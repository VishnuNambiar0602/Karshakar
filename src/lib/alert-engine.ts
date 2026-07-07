import { getAllPlots, addAlert, getFarmerProfile, KisanAlert, Plot } from '@/lib/kisan-store';
import { getSoilAndWeatherData } from '@/services/open-meteo';
import { sendNotification } from '@/services/notifications';
import { logger } from '@/lib/logger';
import { getWeatherReport } from '@/ai/flows/get-weather-report';

interface AlertCheckResult {
  plotId: string;
  alerts: Omit<KisanAlert, 'id' | 'createdAt' | 'resolved'>[];
}

/**
 * Runs threshold evaluations for a single plot based on meteorological and soil data.
 */
export async function checkPlotThresholds(plot: Plot): Promise<AlertCheckResult> {
  const alerts: Omit<KisanAlert, 'id' | 'createdAt' | 'resolved'>[] = [];
  
  try {
    // 1. Fetch real-time soil and weather data for the plot coordinates
    const data = await getSoilAndWeatherData(plot.latitude, plot.longitude);
    
    // 2. Evaluate Soil Moisture
    const rawVwc = data.current?.soil_moisture_0_to_1cm ?? 0.20;
    const vwc = rawVwc < 1 ? rawVwc * 100 : rawVwc;
    if (vwc < 18) {
      alerts.push({
        plotId: plot.id,
        plotName: plot.name,
        userId: plot.userId,
        type: 'soil',
        title: 'Low Soil Moisture Warning',
        message: `Soil moisture on your plot "${plot.name}" is critically low at ${vwc.toFixed(1)}% VWC. Crop stress is likely.`,
        severity: 'high',
      });
      // Suggest irrigation alert
      alerts.push({
        plotId: plot.id,
        plotName: plot.name,
        userId: plot.userId,
        type: 'irrigation',
        title: 'Irrigation Recommended',
        message: `Dry soil conditions detected. It is recommended to apply irrigation of approximately 1.5 inches to crop "${plot.cropType}".`,
        severity: 'medium',
      });
    } else if (vwc > 42) {
      alerts.push({
        plotId: plot.id,
        plotName: plot.name,
        userId: plot.userId,
        type: 'soil',
        title: 'High Soil Saturated Warning',
        message: `Soil on your plot "${plot.name}" is highly saturated at ${vwc.toFixed(1)}% VWC. Watch for waterlogging.`,
        severity: 'medium',
      });
    }

    // 3. Evaluate Weather conditions
    let temp = 25;
    let precip = 0;
    try {
      const weatherData = await getWeatherReport({ latitude: plot.latitude, longitude: plot.longitude });
      temp = weatherData.current?.temperature ?? 25;
      if (weatherData.current?.conditions.toLowerCase().includes('rain')) {
        precip = 18;
      } else if (weatherData.current?.conditions.toLowerCase().includes('drizzle')) {
        precip = 5;
      }
    } catch (e) {
      logger.error('alert_check_weather_failed', { plotId: plot.id, error: String(e) });
    }

    if (temp > 40) {
      alerts.push({
        plotId: plot.id,
        plotName: plot.name,
        userId: plot.userId,
        type: 'weather',
        title: 'Extreme Heatwave Alert',
        message: `Temperature on your plot "${plot.name}" is extremely high at ${temp}°C. Increase watering frequency to protect crop "${plot.cropType}".`,
        severity: 'high',
      });
    } else if (temp < 6) {
      alerts.push({
        plotId: plot.id,
        plotName: plot.name,
        userId: plot.userId,
        type: 'weather',
        title: 'Frost Hazard Warning',
        message: `Near-freezing temperature (${temp}°C) detected on your plot "${plot.name}". Take steps to protect frost-sensitive seedlings.`,
        severity: 'high',
      });
    }

    if (precip > 15) {
      alerts.push({
        plotId: plot.id,
        plotName: plot.name,
        userId: plot.userId,
        type: 'weather',
        title: 'Heavy Rainfall Warning',
        message: `Heavy rainfall of ${precip}mm detected on plot "${plot.name}". Clear drainage channels to prevent crop damage.`,
        severity: 'medium',
      });
    }

  } catch (error) {
    logger.error('alert_check_plot_failed', { plotId: plot.id, error: String(error) });
  }

  return { plotId: plot.id, alerts };
}

/**
 * Runs the alerting pipeline for all plots.
 * Fetches all registered plots, checks thresholds, creates alert entries,
 * and sends out real/mock SMS & WhatsApp updates to registered farmers.
 */
export async function runAlertChecksForAllPlots(): Promise<{ checked: number; alertsCreated: number }> {
  const plots = await getAllPlots();
  let alertsCreatedCount = 0;

  logger.info('alert_engine_start', { plotCount: plots.length });

  for (const plot of plots) {
    const result = await checkPlotThresholds(plot);
    
    for (const alertData of result.alerts) {
      // 1. Add alert to DB
      await addAlert(alertData);
      alertsCreatedCount++;

      // 2. Fetch Farmer Profile to send notification
      const profile = await getFarmerProfile(plot.userId);
      if (profile && profile.phone) {
        // Construct notification message
        const message = `Kisan Alert: [${alertData.title}] ${alertData.message}`;
        
        // Push notification in background
        void (async () => {
          try {
            // Send SMS
            await sendNotification({
              to: profile.phone,
              message: message,
              type: 'sms'
            });
            // Send WhatsApp
            await sendNotification({
              to: profile.phone,
              message: message,
              type: 'whatsapp'
            });
          } catch (err) {
            logger.error('alert_notification_dispatch_failed', { plotId: plot.id, userId: plot.userId, error: String(err) });
          }
        })();
      }
    }
  }

  logger.info('alert_engine_completed', { checked: plots.length, alertsCreated: alertsCreatedCount });
  return { checked: plots.length, alertsCreated: alertsCreatedCount };
}
