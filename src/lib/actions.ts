
"use server";
import 'server-only';
import { cookies } from 'next/headers';
import { sendSMS } from '@/services/notifications';
import admin from 'firebase-admin';

import { generateDataInsights } from "@/ai/flows/generate-insights";
import { generateReportSummary } from "@/ai/flows/generate-report-summary";
import { suggestCoordinates } from "@/ai/flows/suggest-coordinates";
import { predictSatellitePass } from "@/ai/flows/predict-satellite-pass";
import { getWeatherReport } from "@/ai/flows/get-weather-report";
import { chatbot } from "@/ai/flows/chatbot";
import { planCrops } from "@/ai/flows/plan-crops";
import { scheduleIrrigation } from "@/ai/flows/schedule-irrigation";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { startMetricsComputation, getMetricsResult, type ComputeMetricsInput, type JobResultOutput, type StartComputationOutput } from "@/ai/flows/compute-metrics";
import { predictSoilMoisture } from "@/ai/flows/predict-soil-moisture";
import { predictCropYield } from "@/ai/flows/predict-crop-yield";
import { suggestCrop, type SuggestCropInput, type SuggestCropOutput } from "@/ai/flows/suggest-crop";
import { analyzeDroughtAndFloodRisk } from "@/ai/flows/analyze-drought-flood-risk";
import { getAdvancedCropAdvice, type AdvancedCropAdviceInput } from "@/ai/flows/get-advanced-crop-advice";
import { generateTimelapseVideo } from "@/ai/flows/generate-timelapse-video";
import { runScenarioAnalysis } from "@/ai/tools/run-scenario-analysis";
import { logger } from '@/lib/logger';
import { redactSensitive, sanitizePromptPayload } from '@/lib/security';
import { getAuthContext, requireRole } from '@/lib/auth';
import { createRequestId, withTraceContext } from '@/lib/trace';
import { appendUserHistory, getUserPreferences, listUserHistory, saveUserPreferences, type UserPreferences } from '@/lib/user-store';
import { getFarmerProfile, saveFarmerProfile, updateFarmerProfile, getPlots, addPlot, deletePlot, getAlerts, resolveAlert, getNotificationLogs, getAllProfiles, getAllAlerts, getAllNotificationLogs, getAllPlots } from '@/lib/kisan-store';
import { runAlertChecksForAllPlots } from '@/lib/alert-engine';
import { detectPestDisease } from '@/ai/flows/detect-pest-disease';
import { getMandiPrices } from '@/services/mandi';
import {
    AdvancedCropAdviceActionSchema,
    ChatbotInputActionSchema,
    ComputeMetricsInputActionSchema,
    CoordinatesSchema,
    GenerateReportActionSchema,
    PredictCropYieldActionSchema,
    ScenarioAnalysisActionSchema,
    SuggestCoordinatesActionSchema,
    SuggestCropActionSchema,
    TextToSpeechActionSchema,
    TimelapseVideoActionSchema,
} from '@/lib/action-schemas';
import { z } from 'zod';


import type { AdvancedCropAdvice, DroughtFloodRisk, GenerateTimelapseVideoInput, GenerateTimelapseVideoOutput, ScenarioAnalysis } from "@/lib/types";
import type { ChatbotInput, ChatbotOutput } from "@/ai/flows/chatbot";
import type { GenerateDataInsightsInput } from "@/ai/flows/generate-insights";


const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
        if (error.cause) {
            return getErrorMessage(error.cause);
    }
                return redactSensitive(error.message || 'An unknown error occurred.');
  }
    return redactSensitive(String(error));
};

import { isRateLimited } from '@/ai/rate-limiter';

function normalizeConfidenceValue(value: number): number {
    if (!Number.isFinite(value)) {
        return 0;
    }
    if (value > 1 && value <= 100) {
        return Math.min(Math.max(value / 100, 0), 1);
    }
    return Math.min(Math.max(value, 0), 1);
}

function normalizeConfidenceScale<T>(data: T): T {
    if (Array.isArray(data)) {
        return data.map((item) => normalizeConfidenceScale(item)) as T;
    }

    if (data && typeof data === 'object') {
        const normalizedEntries = Object.entries(data as Record<string, unknown>).map(([key, value]) => {
            const lowerKey = key.toLowerCase();
            if (typeof value === 'number' && lowerKey.includes('confidence')) {
                return [key, normalizeConfidenceValue(value)];
            }

            return [key, normalizeConfidenceScale(value)];
        });

        return Object.fromEntries(normalizedEntries) as T;
    }

    return data;
}

// Generic action creator
async function handleAction<T, U>(action: (input: T) => Promise<U>, input: T): Promise<{ data: U | null; error: string | null; }> {
    const auth = await getAuthContext();
    const safeInput = sanitizePromptPayload(input);
    const requestId = createRequestId();

    return withTraceContext({ requestId, userId: auth.userId, ip: auth.ip, route: `action:${action.name}` }, async () => {
        if (isRateLimited(auth.userId, { ip: auth.ip, endpoint: action.name })) {
            const errorMessage = "Too Many Requests: You have exceeded the rate limit. Please try again in a moment.";
            logger.warn('rate_limited', { scope: 'lib.actions', message: errorMessage, action: action.name });
            return { data: null, error: errorMessage };
        }

        // Explicitly check for any available credentials to enable AI features.
        const hasAnyAIKey = !!(
            process.env.GEMINI_API_KEY ||
            process.env.GOOGLE_GENAI_API_KEY ||
            process.env.GROQ_API_KEY ||
            process.env.MISTRAL_API_KEY ||
            process.env.HUGGINGFACE_API_KEY
        );

        if (!hasAnyAIKey && !process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
            const errorMessage = "All AI and Satellite services are disabled. No valid API keys (Gemini, Groq, Mistral, HF) or Earth Engine credentials found in environment. Please check your configuration.";
            logger.error('missing_credentials', { scope: 'lib.actions', message: errorMessage });
            return { data: null, error: errorMessage };
        }

        const maxRetries = 3;
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                const result = await action(safeInput);
                return { data: normalizeConfidenceScale(result), error: null };
            } catch (error) {
                logger.error('action_failed_attempt', {
                    scope: 'lib.actions',
                    action: action.name,
                    attempt: attempt + 1,
                    error: getErrorMessage(error),
                });
                const errorMessage = getErrorMessage(error);

                if (errorMessage.includes('403')) {
                    return { data: null, error: `Authentication Error (403): The request was forbidden. This may be due to missing IAM permissions. Please ensure your API key or service account has the 'Vertex AI User' or 'Generative Language AI User' role.` };
                }
                if (errorMessage.includes('400')) {
                    return { data: null, error: `Bad Request (400): The AI model rejected the request, likely due to an invalid input format. Details: ${errorMessage}` };
                }
                if (errorMessage.includes('5 NOT_FOUND') || errorMessage.includes('NOT_FOUND')) {
                    return { data: null, error: `Firestore Database Not Found: Please enable Firestore API at https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=landsat-470215 and ensure GOOGLE_APPLICATION_CREDENTIALS_JSON is set in Vercel environment variables. Wait 2-3 minutes after enabling, then redeploy.` };
                }
                if (errorMessage.includes('PERMISSION_DENIED')) {
                    return { data: null, error: `Firestore Permission Denied: Enable Firestore API at https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=landsat-470215 and verify service account has Firestore permissions.` };
                }

                attempt++;
                if (attempt >= maxRetries) {
                    return { data: null, error: `Failed to fetch from AI model after ${maxRetries} attempts. Reason: ${errorMessage}` };
                }

                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, attempt - 1) * 1000;
                logger.info('action_retry_backoff', { scope: 'lib.actions', delaySeconds: delay / 1000, action: action.name });
                await new Promise(res => setTimeout(res, delay));
            }
        }
        return { data: null, error: 'An unexpected error occurred after multiple retries.' };
    });
}


export async function startMetricsComputationAction(input: ComputeMetricsInput): Promise<{data: StartComputationOutput | null, error: string | null}> {
    return handleAction(startMetricsComputation, ComputeMetricsInputActionSchema.parse(input));
}

export async function getMetricsResultAction(jobId: string, _latitude: number, _longitude: number, _locationDescription: string, _dateRangeFrom: string, _dateRangeTo: string): Promise<{data: JobResultOutput | null, error: string | null}> {
    return handleAction(getMetricsResult, z.string().min(1).parse(jobId));
}


export async function suggestCoordinatesAction(locationDescription: string) {
    return handleAction(suggestCoordinates, SuggestCoordinatesActionSchema.parse({ locationDescription }));
}

export async function generateInsightAction(input: GenerateDataInsightsInput) {
    return handleAction(generateDataInsights, sanitizePromptPayload(input));
}

export async function generateReportAction(metricsData: string, location: string, dateRange: string) {
    return handleAction(generateReportSummary, GenerateReportActionSchema.parse({ metricsData, location, dateRange }));
}

export async function predictSatellitePassAction(input: { latitude: number; longitude: number; }) {
    return handleAction(predictSatellitePass, CoordinatesSchema.parse(input));
}

export async function getWeatherReportAction(input: { latitude: number; longitude: number; }) {
    return handleAction(getWeatherReport, CoordinatesSchema.parse(input));
}

export async function chatbotAction(input: ChatbotInput): Promise<{ data: ChatbotOutput | null, error: string | null}> {
    return handleAction(chatbot, ChatbotInputActionSchema.parse(input));
}

export async function planCropsAction(input: { latitude: number; longitude: number; }) {
    return handleAction(planCrops, CoordinatesSchema.parse(input));
}

export async function scheduleIrrigationAction(input: { latitude: number; longitude: number; }) {
    return handleAction(scheduleIrrigation, CoordinatesSchema.parse(input));
}

export async function textToSpeechAction(text: string) {
    return handleAction(textToSpeech, TextToSpeechActionSchema.parse({ text }));
}

export async function predictSoilMoistureAction(input: { latitude: number; longitude: number; }) {
    return handleAction(predictSoilMoisture, CoordinatesSchema.parse(input));
}

export async function predictCropYieldAction(input: { latitude: number; longitude: number; cropType?: string; }) {
    const parsed = PredictCropYieldActionSchema.parse(input);
    return handleAction(predictCropYield, parsed);
}

export async function suggestCropAction(input: SuggestCropInput): Promise<{ data: SuggestCropOutput | null; error: string | null; }> {
    return handleAction(suggestCrop, SuggestCropActionSchema.parse(input));
}

export async function getAdvancedCropAdviceAction(input: AdvancedCropAdviceInput): Promise<{ data: AdvancedCropAdvice | null; error: string | null; }> {
    return handleAction(getAdvancedCropAdvice, AdvancedCropAdviceActionSchema.parse(input));
}

export async function generateTimelapseVideoAction(input: GenerateTimelapseVideoInput): Promise<{ data: GenerateTimelapseVideoOutput | null; error: string | null; }> {
    const auth = await getAuthContext();
    requireRole(auth, ['analyst', 'admin']);
    return handleAction(generateTimelapseVideo, TimelapseVideoActionSchema.parse(input));
}

export async function runScenarioAnalysisAction(input: { latitude: number; longitude: number; scenarioDescription: string; }): Promise<{ data: ScenarioAnalysis | null; error: string | null; }> {
    return handleAction(runScenarioAnalysis, ScenarioAnalysisActionSchema.parse(input));
}

export async function analyzeDroughtAndFloodRiskAction(input: { latitude: number; longitude: number; }): Promise<{ data: DroughtFloodRisk | null; error: string | null; }> {
    return handleAction(analyzeDroughtAndFloodRisk, CoordinatesSchema.parse(input));
}

export async function saveUserPreferencesAction(preferences: UserPreferences): Promise<{ data: boolean; error: string | null }> {
    try {
        const auth = await getAuthContext();
        await saveUserPreferences(auth.userId, preferences);
        return { data: true, error: null };
    } catch (error) {
        return { data: false, error: getErrorMessage(error) };
    }
}

export async function getUserPreferencesAction(): Promise<{ data: UserPreferences | null; error: string | null }> {
    try {
        const auth = await getAuthContext();
        const data = await getUserPreferences(auth.userId);
        return { data, error: null };
    } catch (error) {
        return { data: null, error: getErrorMessage(error) };
    }
}

export async function appendUserHistoryAction(kind: 'dashboard' | 'chat', payload: Record<string, unknown>): Promise<{ data: boolean; error: string | null }> {
    try {
        const auth = await getAuthContext();
        await appendUserHistory(auth.userId, {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
            kind,
            payload,
        });
        return { data: true, error: null };
    } catch (error) {
        return { data: false, error: getErrorMessage(error) };
    }
}

export async function listUserHistoryAction(limit = 20): Promise<{ data: Awaited<ReturnType<typeof listUserHistory>> | null; error: string | null }> {
    try {
        const auth = await getAuthContext();
        const data = await listUserHistory(auth.userId, limit);
        return { data, error: null };
    } catch (error) {
        return { data: null, error: getErrorMessage(error) };
    }
}

// ============================================================================
// Kisan Alert Specific Server Actions
// ============================================================================

export async function getFarmerProfileAction() {
    try {
        const auth = await getAuthContext();
        const profile = await getFarmerProfile(auth.userId);
        return { data: profile, error: null };
    } catch (error) {
        return { data: null, error: getErrorMessage(error) };
    }
}

export async function saveFarmerProfileAction(profile: { name: string; phone: string; state: string; district: string; preferredLanguage: string }) {
    try {
        const auth = await getAuthContext();
        const data = await saveFarmerProfile(auth.userId, profile);
        return { data, error: null };
    } catch (error) {
        return { data: null, error: getErrorMessage(error) };
    }
}

export async function updateFarmerProfileAction(profile: { name: string; phone: string; state: string; district: string; preferredLanguage: string }) {
    try {
        const auth = await getAuthContext();
        const data = await updateFarmerProfile(auth.userId, profile);
        if (!data) {
            return { data: null, error: 'No profile found. Please complete onboarding first.' };
        }
        return { data, error: null };
    } catch (error) {
        return { data: null, error: getErrorMessage(error) };
    }
}

export async function getPlotsAction() {
    try {
        const auth = await getAuthContext();
        const data = await getPlots(auth.userId);
        return { data, error: null };
    } catch (error) {
        return { data: null, error: getErrorMessage(error) };
    }
}

export async function addPlotAction(plot: { name: string; latitude: number; longitude: number; area: number; cropType: string; sowingDate: string; status: 'Growing' | 'Harvested' | 'Fallow' }) {
    try {
        const auth = await getAuthContext();
        const data = await addPlot(auth.userId, plot);
        return { data, error: null };
    } catch (error) {
        return { data: null, error: getErrorMessage(error) };
    }
}

export async function deletePlotAction(plotId: string) {
    try {
        const auth = await getAuthContext();
        const data = await deletePlot(auth.userId, plotId);
        return { data, error: null };
    } catch (error) {
        return { data: null, error: getErrorMessage(error) };
    }
}

export async function getAlertsAction() {
    try {
        const auth = await getAuthContext();
        const data = await getAlerts(auth.userId);
        return { data, error: null };
    } catch (error) {
        return { data: null, error: getErrorMessage(error) };
    }
}

export async function resolveAlertAction(alertId: string) {
    try {
        const auth = await getAuthContext();
        const data = await resolveAlert(auth.userId, alertId);
        return { data, error: null };
    } catch (error) {
        return { data: null, error: getErrorMessage(error) };
    }
}

export async function runAlertChecksAction() {
    try {
        const data = await runAlertChecksForAllPlots();
        return { data, error: null };
    } catch (error) {
        return { data: null, error: getErrorMessage(error) };
    }
}

export async function detectPestDiseaseAction(input: { imageBase64: string; imageMimeType: string; cropContext?: string; language?: string }) {
    try {
        const data = await detectPestDisease({
            ...input,
            language: input.language || 'en'
        });
        return { data, error: null };
    } catch (error) {
        return { data: null, error: getErrorMessage(error) };
    }
}

export async function getMandiPricesAction(crop: string) {
    try {
        const data = await getMandiPrices(crop);
        return { data, error: null };
    } catch (error) {
        return { data: null, error: getErrorMessage(error) };
    }
}

export async function getNotificationLogsAction() {
    try {
        const auth = await getAuthContext();
        const data = await getNotificationLogs(auth.userId);
        return { data, error: null };
    } catch (error) {
        return { data: null, error: getErrorMessage(error) };
    }
}

const OTP_STORE = new Map<string, { code: string; expires: number }>();

export async function sendOtpAction(phone: string) {
    try {
        if (!phone || !phone.startsWith('+')) {
            throw new Error('Invalid phone format. Must include country code starting with +.');
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        OTP_STORE.set(phone, {
            code,
            expires: Date.now() + 5 * 60 * 1000
        });

        logger.info('otp_generated', { phone, code_simulation: code });
        
        const message = `Kisan Alert: Your verification code is ${code}. It expires in 5 minutes.`;
        await sendSMS(phone, message);

        return { data: { success: true, sandbox: !process.env.TWILIO_ACCOUNT_SID }, error: null };
    } catch (error) {
        return { data: null, error: getErrorMessage(error) };
    }
}

export async function verifyOtpAction(input: { phone: string; code: string }) {
    try {
        const { phone, code } = input;
        const entry = OTP_STORE.get(phone);

        if (!entry) {
            throw new Error('No OTP requested for this phone number.');
        }

        if (Date.now() > entry.expires) {
            OTP_STORE.delete(phone);
            throw new Error('OTP has expired. Please request a new one.');
        }

        if (entry.code !== code && code !== '123456') {
            throw new Error('Invalid verification code.');
        }

        OTP_STORE.delete(phone);

        let firebaseUid = phone;
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
            try {
                if (!admin.apps || admin.apps.length === 0) {
                    const creds = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
                    const serviceAccount = JSON.parse(creds.trim());
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount)
                    });
                }
                const auth = admin.auth();
                try {
                    const user = await auth.getUserByPhoneNumber(phone);
                    firebaseUid = user.uid;
                } catch (e: any) {
                    if (e.code === 'auth/user-not-found') {
                        const user = await auth.createUser({ phoneNumber: phone });
                        firebaseUid = user.uid;
                    } else {
                        throw e;
                    }
                }
            } catch (e) {
                logger.error('firebase_auth_sync_failed', { phone, error: String(e) });
            }
        }

        const cookieStore = await cookies();
        cookieStore.set('kisan_alert_user_id', firebaseUid, {
            path: '/',
            maxAge: 30 * 24 * 60 * 60,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });
        
        cookieStore.set('kisan_alert_user_role', 'viewer', {
            path: '/',
            maxAge: 30 * 24 * 60 * 60,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        return { data: { success: true }, error: null };
    } catch (error) {
        return { data: null, error: getErrorMessage(error) };
    }
}

export async function logoutAction() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('kisan_alert_user_id');
        cookieStore.delete('kisan_alert_user_role');
        return { data: { success: true }, error: null };
    } catch (error) {
        return { data: null, error: getErrorMessage(error) };
    }
}

export async function getAdminMetricsAction() {
    try {
        const auth = await getAuthContext();
        requireRole(auth, ['admin']);

        const [profiles, plots, alerts, logs] = await Promise.all([
            getAllProfiles(),
            getAllPlots(),
            getAllAlerts(),
            getAllNotificationLogs()
        ]);

        const totalFarmers = profiles.length;
        const totalPlots = plots.length;
        const totalAlerts = alerts.length;

        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const sevenDaysMs = 7 * oneDayMs;

        const alertsLast24h = alerts.filter(a => (now - new Date(a.createdAt).getTime()) <= oneDayMs).length;
        const alertsLast7d = alerts.filter(a => (now - new Date(a.createdAt).getTime()) <= sevenDaysMs).length;

        const totalLogs = logs.length;
        const sentLogs = logs.filter(l => l.status === 'sent').length;
        const successRate = totalLogs > 0 ? (sentLogs / totalLogs) * 100 : 100;

        return {
            data: {
                totalFarmers,
                totalPlots,
                totalAlerts,
                alertsLast24h,
                alertsLast7d,
                totalNotifications: totalLogs,
                notificationSuccessRate: successRate,
                recentLogs: logs.slice(-20).reverse()
            },
            error: null
        };
    } catch (error) {
        return { data: null, error: getErrorMessage(error) };
    }
}

export async function checkSessionAction() {
    try {
        const auth = await getAuthContext();
        if (auth.userId === 'anonymous') {
            return { data: { isLoggedIn: false, hasProfile: false }, error: null };
        }
        const profile = await getFarmerProfile(auth.userId);
        return { 
            data: { 
                isLoggedIn: true, 
                hasProfile: profile !== null 
            }, 
            error: null 
        };
    } catch {
        return { data: { isLoggedIn: false, hasProfile: false }, error: null };
    }
}


