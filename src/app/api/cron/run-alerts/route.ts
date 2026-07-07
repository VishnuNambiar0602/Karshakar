import { NextResponse } from 'next/server';
import { runAlertChecksForAllPlots } from '@/lib/alert-engine';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}

async function handleCron(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;

    let isAuthorized = false;
    if (cronSecret) {
      if (authHeader === `Bearer ${cronSecret}`) {
        isAuthorized = true;
      }
      if (querySecret === cronSecret) {
        isAuthorized = true;
      }
    } else {
      logger.warn('cron_secret_missing_default_auth_allowed');
      isAuthorized = true; // Allow in local dev when no env key is set
    }

    if (!isAuthorized) {
      return new Response('Unauthorized', { status: 401 });
    }

    logger.info('cron_run_alerts_triggered');
    const result = await runAlertChecksForAllPlots();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('cron_run_alerts_failed', { error: String(error) });
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
