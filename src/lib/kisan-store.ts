import 'server-only';
import { getFirestore } from '@/lib/firebase';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { logger } from '@/lib/logger';

export interface FarmerProfile {
  userId: string;
  name: string;
  phone: string;
  state: string;
  district: string;
  preferredLanguage: string;
  createdAt: string;
}

export interface Plot {
  id: string;
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  area: number; // in acres
  cropType: string;
  sowingDate: string;
  status: 'Growing' | 'Harvested' | 'Fallow';
  createdAt: string;
}

export interface KisanAlert {
  id: string;
  plotId: string;
  plotName: string;
  userId: string;
  type: 'weather' | 'soil' | 'pest' | 'irrigation' | 'mandi';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  resolved: boolean;
}

export interface NotificationLog {
  id: string;
  userId: string;
  plotId: string;
  alertId: string;
  channel: 'sms' | 'whatsapp';
  to: string;
  status: 'sent' | 'failed' | 'pending';
  providerResponse?: string;
  sentAt: string;
}

// Fallback JSON DB Configuration
const FALLBACK_DB_PATH = path.join(os.tmpdir(), 'kisan-alert-db.json');

interface FallbackSchema {
  profiles: Record<string, FarmerProfile>;
  plots: Record<string, Plot[]>;
  alerts: Record<string, KisanAlert[]>;
  notificationLogs?: NotificationLog[];
}

function initFallbackDb(): FallbackSchema {
  if (fs.existsSync(FALLBACK_DB_PATH)) {
    try {
      const data = fs.readFileSync(FALLBACK_DB_PATH, 'utf8');
      const parsed = JSON.parse(data) as FallbackSchema;
      if (!parsed.notificationLogs) {
        parsed.notificationLogs = [];
      }
      return parsed;
    } catch (e) {
      logger.error('fallback_db_read_error', { error: String(e) });
    }
  }
  const defaultDb: FallbackSchema = { profiles: {}, plots: {}, alerts: {}, notificationLogs: [] };
  fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(defaultDb, null, 2), 'utf8');
  return defaultDb;
}

function saveFallbackDb(db: FallbackSchema) {
  try {
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    logger.error('fallback_db_write_error', { error: String(e) });
  }
}

// Helper to determine if Firestore is active
function isFirestoreEnabled(): boolean {
  return !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
}

export async function getFarmerProfile(userId: string): Promise<FarmerProfile | null> {
  if (isFirestoreEnabled()) {
    try {
      const db = getFirestore();
      const doc = await db.collection('farmer_profiles').doc(userId).get();
      if (doc.exists) {
        return doc.data() as FarmerProfile;
      }
    } catch (e) {
      logger.error('firestore_get_profile_failed', { userId, error: String(e) });
    }
  }

  // Fallback
  const db = initFallbackDb();
  return db.profiles[userId] || null;
}

export async function saveFarmerProfile(userId: string, profile: Omit<FarmerProfile, 'userId' | 'createdAt'>): Promise<FarmerProfile> {
  const completeProfile: FarmerProfile = {
    ...profile,
    userId,
    createdAt: new Date().toISOString()
  };

  if (isFirestoreEnabled()) {
    try {
      const db = getFirestore();
      await db.collection('farmer_profiles').doc(userId).set(completeProfile, { merge: true });
      return completeProfile;
    } catch (e) {
      logger.error('firestore_save_profile_failed', { userId, error: String(e) });
    }
  }

  // Fallback
  const db = initFallbackDb();
  db.profiles[userId] = completeProfile;
  saveFallbackDb(db);
  return completeProfile;
}

export async function getPlots(userId: string): Promise<Plot[]> {
  if (isFirestoreEnabled()) {
    try {
      const db = getFirestore();
      const snapshot = await db.collection('plots').where('userId', '==', userId).get();
      return snapshot.docs.map(doc => doc.data() as Plot);
    } catch (e) {
      logger.error('firestore_get_plots_failed', { userId, error: String(e) });
    }
  }

  // Fallback
  const db = initFallbackDb();
  return db.plots[userId] || [];
}

export async function addPlot(userId: string, plotData: Omit<Plot, 'id' | 'userId' | 'createdAt'>): Promise<Plot> {
  const plot: Plot = {
    ...plotData,
    id: `plot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    createdAt: new Date().toISOString()
  };

  if (isFirestoreEnabled()) {
    try {
      const db = getFirestore();
      await db.collection('plots').doc(plot.id).set(plot);
      return plot;
    } catch (e) {
      logger.error('firestore_add_plot_failed', { userId, error: String(e) });
    }
  }

  // Fallback
  const db = initFallbackDb();
  if (!db.plots[userId]) {
    db.plots[userId] = [];
  }
  db.plots[userId].push(plot);
  saveFallbackDb(db);
  return plot;
}

export async function deletePlot(userId: string, plotId: string): Promise<boolean> {
  if (isFirestoreEnabled()) {
    try {
      const db = getFirestore();
      await db.collection('plots').doc(plotId).delete();
      return true;
    } catch (e) {
      logger.error('firestore_delete_plot_failed', { plotId, error: String(e) });
    }
  }

  // Fallback
  const db = initFallbackDb();
  if (db.plots[userId]) {
    const originalLength = db.plots[userId].length;
    db.plots[userId] = db.plots[userId].filter(p => p.id !== plotId);
    saveFallbackDb(db);
    return db.plots[userId].length < originalLength;
  }
  return false;
}

export async function getAlerts(userId: string): Promise<KisanAlert[]> {
  if (isFirestoreEnabled()) {
    try {
      const db = getFirestore();
      const snapshot = await db.collection('alerts').where('userId', '==', userId).orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => doc.data() as KisanAlert);
    } catch (e) {
      logger.error('firestore_get_alerts_failed', { userId, error: String(e) });
    }
  }

  // Fallback
  const db = initFallbackDb();
  return db.alerts[userId] || [];
}

export async function addAlert(alertData: Omit<KisanAlert, 'id' | 'createdAt' | 'resolved'>): Promise<KisanAlert> {
  const alert: KisanAlert = {
    ...alertData,
    id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    resolved: false
  };

  if (isFirestoreEnabled()) {
    try {
      const db = getFirestore();
      await db.collection('alerts').doc(alert.id).set(alert);
      return alert;
    } catch (e) {
      logger.error('firestore_add_alert_failed', { alert, error: String(e) });
    }
  }

  // Fallback
  const db = initFallbackDb();
  const userId = alertData.userId;
  if (!db.alerts[userId]) {
    db.alerts[userId] = [];
  }
  db.alerts[userId].unshift(alert); // Add to the top
  saveFallbackDb(db);
  return alert;
}

export async function resolveAlert(userId: string, alertId: string): Promise<boolean> {
  if (isFirestoreEnabled()) {
    try {
      const db = getFirestore();
      await db.collection('alerts').doc(alertId).update({ resolved: true });
      return true;
    } catch (e) {
      logger.error('firestore_resolve_alert_failed', { alertId, error: String(e) });
    }
  }

  // Fallback
  const db = initFallbackDb();
  if (db.alerts[userId]) {
    let updated = false;
    db.alerts[userId] = db.alerts[userId].map(a => {
      if (a.id === alertId) {
        updated = true;
        return { ...a, resolved: true };
      }
      return a;
    });
    saveFallbackDb(db);
    return updated;
  }
  return false;
}

// For Cron Alert Trigger: fetches all registered plots
export async function getAllPlots(): Promise<Plot[]> {
  if (isFirestoreEnabled()) {
    try {
      const db = getFirestore();
      const snapshot = await db.collection('plots').get();
      return snapshot.docs.map(doc => doc.data() as Plot);
    } catch (e) {
      logger.error('firestore_get_all_plots_failed', { error: String(e) });
    }
  }

  // Fallback
  const db = initFallbackDb();
  return Object.values(db.plots).flat();
}

export async function addNotificationLog(logData: Omit<NotificationLog, 'id' | 'sentAt'>): Promise<NotificationLog> {
  const completeLog: NotificationLog = {
    ...logData,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    sentAt: new Date().toISOString(),
  };

  if (isFirestoreEnabled()) {
    try {
      const db = getFirestore();
      await db.collection('notification_logs').doc(completeLog.id).set(completeLog);
      return completeLog;
    } catch (e) {
      logger.error('firestore_add_notification_log_failed', { log: completeLog, error: String(e) });
    }
  }

  // Fallback
  const db = initFallbackDb();
  if (!db.notificationLogs) {
    db.notificationLogs = [];
  }
  db.notificationLogs.push(completeLog);
  saveFallbackDb(db);
  return completeLog;
}

export async function getNotificationLogs(userId: string): Promise<NotificationLog[]> {
  if (isFirestoreEnabled()) {
    try {
      const db = getFirestore();
      const snapshot = await db.collection('notification_logs').where('userId', '==', userId).get();
      return snapshot.docs.map(doc => doc.data() as NotificationLog);
    } catch (e) {
      logger.error('firestore_get_notification_logs_failed', { userId, error: String(e) });
    }
  }

  // Fallback
  const db = initFallbackDb();
  return (db.notificationLogs || []).filter(l => l.userId === userId);
}

export async function getAllProfiles(): Promise<FarmerProfile[]> {
  if (isFirestoreEnabled()) {
    try {
      const db = getFirestore();
      const snapshot = await db.collection('farmer_profiles').get();
      return snapshot.docs.map(doc => doc.data() as FarmerProfile);
    } catch (e) {
      logger.error('firestore_get_all_profiles_failed', { error: String(e) });
    }
  }

  const db = initFallbackDb();
  return Object.values(db.profiles);
}

export async function getAllAlerts(): Promise<KisanAlert[]> {
  if (isFirestoreEnabled()) {
    try {
      const db = getFirestore();
      const snapshot = await db.collection('alerts').get();
      return snapshot.docs.map(doc => doc.data() as KisanAlert);
    } catch (e) {
      logger.error('firestore_get_all_alerts_failed', { error: String(e) });
    }
  }

  const db = initFallbackDb();
  return Object.values(db.alerts).flat();
}

export async function getAllNotificationLogs(): Promise<NotificationLog[]> {
  if (isFirestoreEnabled()) {
    try {
      const db = getFirestore();
      const snapshot = await db.collection('notification_logs').get();
      return snapshot.docs.map(doc => doc.data() as NotificationLog);
    } catch (e) {
      logger.error('firestore_get_all_notification_logs_failed', { error: String(e) });
    }
  }

  const db = initFallbackDb();
  return db.notificationLogs || [];
}
