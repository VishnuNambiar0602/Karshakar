'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  getFarmerProfileAction,
  getPlotsAction,
  getAlertsAction,
  getWeatherReportAction,
  getMandiPricesAction,
  textToSpeechAction,
} from '@/lib/actions';
import {
  Sprout,
  BellRing,
  Volume2,
  Loader2,
  Sun,
  Cloudy,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  MapPin,
  TrendingUp,
  Camera,
  Coins,
  LayoutDashboard,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

const WEATHER_ICONS: Record<string, any> = {
  Sun: Sun,
  Cloudy: Cloudy,
  CloudFog: CloudFog,
  CloudDrizzle: CloudDrizzle,
  CloudRain: CloudRain,
  CloudSnow: CloudSnow,
  CloudLightning: CloudLightning,
};

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [plots, setPlots] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [mandiPrices, setMandiPrices] = useState<any[]>([]);
  const [weather, setWeather] = useState<any>(null);
  
  // TTS State
  const [playingAlertId, setPlayingAlertId] = useState<string | null>(null);

  const loadFarmerDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const plotsRes = await getPlotsAction();
      const plotsData = plotsRes.data || [];
      setPlots(plotsData);

      const alertsRes = await getAlertsAction();
      setAlerts(alertsRes.data || []);

      // Load weather for primary plot (or default to state center if no plots)
      if (plotsData.length > 0) {
        const primaryPlot = plotsData[0];
        const weatherRes = await getWeatherReportAction({
          latitude: primaryPlot.latitude,
          longitude: primaryPlot.longitude,
        });
        setWeather(weatherRes.data || null);

        // Load Mandi prices for primary crop
        const mandiRes = await getMandiPricesAction(primaryPlot.cropType);
        setMandiPrices(mandiRes.data || []);
      } else {
        // Fallback Mandi price fetch
        const mandiRes = await getMandiPricesAction('Wheat');
        setMandiPrices(mandiRes.data || []);
      }
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error Loading Dashboard',
        description: 'Failed to retrieve real-time alerts or mandi prices.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    getFarmerProfileAction().then(res => {
      if (!res.data) {
        toast({
          title: 'Welcome to Kisan Alert',
          description: 'Please complete your profile to continue.',
        });
        router.push('/onboarding');
      } else {
        setProfile(res.data);
        setProfileChecked(true);
        loadFarmerDashboardData();
      }
    });
  }, [router, toast, loadFarmerDashboardData]);

  const handleTextToSpeech = async (alert: any) => {
    if (playingAlertId === alert.id) return;
    setPlayingAlertId(alert.id);

    try {
      const speechText = `${alert.title}. Alert for ${alert.plotName}. ${alert.message}`;
      const res = await textToSpeechAction(speechText);
      if (res.data?.audioDataUri) {
        const audio = new Audio(res.data.audioDataUri);
        audio.onended = () => setPlayingAlertId(null);
        audio.onerror = () => setPlayingAlertId(null);
        await audio.play();
      } else {
        setPlayingAlertId(null);
        toast({
          title: 'Speech Failed',
          description: 'Could not load audio advisory.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      setPlayingAlertId(null);
      console.error(e);
    }
  };

  if (!profileChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Filter top 3 active alerts by severity
  const activeAlerts = alerts
    .filter(a => !a.resolved)
    .sort((a, b) => {
      const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
    })
    .slice(0, 3);

  // Weather Icon resolution
  const WeatherIconComponent = weather?.current?.iconName && WEATHER_ICONS[weather.current.iconName]
    ? WEATHER_ICONS[weather.current.iconName]
    : Sun;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black">Hello, {profile?.name}!</h1>
            <p className="text-emerald-100 mt-1 text-sm md:text-base">
              Welcome back. Your portal has verified connections to live weather trackers and satellite scans.
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="secondary"
            className="bg-white text-emerald-800 hover:bg-emerald-50 flex items-center gap-1.5 shrink-0"
          >
            <LayoutDashboard className="h-4 w-4" /> Advanced Satellite View
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Main (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Active Alerts */}
              <Card className="border-emerald-500/10 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <BellRing className="h-5 w-5 text-emerald-500" />
                    Top Active Alerts
                  </CardTitle>
                  <CardDescription>Urgent advisory logs calculated for your crop plots.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeAlerts.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-emerald-500/10 rounded-xl bg-emerald-500/[0.01]">
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">All fields are stable</p>
                      <p className="text-xs text-muted-foreground mt-0.5">No critical issues detected by the sensor check.</p>
                    </div>
                  ) : (
                    activeAlerts.map(a => (
                      <div
                        key={a.id}
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                          a.severity === 'high' ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            {a.severity === 'high' ? (
                              <ShieldAlert className="h-4 w-4 text-red-500" />
                            ) : (
                              <BellRing className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-sm">{a.title}</span>
                              <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 uppercase">
                                {a.plotName}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTextToSpeech(a)}
                          className="border-emerald-500/10 text-emerald-600 self-end sm:self-auto"
                        >
                          {playingAlertId === a.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                  {alerts.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => router.push('/alerts')} className="text-emerald-600 hover:text-emerald-700 p-0 h-auto font-bold flex items-center gap-1">
                      See All Alerts ({alerts.length}) <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Mandi Ticker */}
              <Card className="border-emerald-500/10 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Coins className="h-5 w-5 text-emerald-500" />
                    Market Rates
                  </CardTitle>
                  <CardDescription>
                    Recent regional Mandi modal prices per quintal for crop: <span className="font-bold text-emerald-700">{plots[0]?.cropType || 'Wheat'}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mandiPrices.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No mandi prices loaded.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {mandiPrices.slice(0, 4).map(m => (
                        <div key={m.mandiName} className="p-3 border border-emerald-500/5 bg-emerald-500/[0.01] rounded-xl flex justify-between items-center">
                          <div>
                            <span className="font-bold text-sm block">{m.mandiName}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5"><MapPin className="h-2.5 w-2.5 text-emerald-500" /> {m.state}, {m.district}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-emerald-700 text-sm block">₹{m.modalPrice.toLocaleString()}</span>
                            <span className="text-[9px] text-muted-foreground block">₹{m.minPrice} - ₹{m.maxPrice}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Weather Widget */}
              <Card className="border-emerald-500/10 shadow-lg bg-gradient-to-br from-emerald-950/5 to-blue-950/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Sun className="h-4.5 w-4.5 text-emerald-500" />
                    Plot Weather Snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {weather ? (
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-3xl font-black text-foreground">{weather.current.temperature.toFixed(1)}°C</span>
                        <p className="text-xs text-muted-foreground font-semibold">{weather.current.conditions}</p>
                        <p className="text-[10px] text-muted-foreground">Humidity: {weather.current.humidity}% • Wind: {weather.current.windSpeed} km/h</p>
                      </div>
                      <div className="bg-emerald-500/10 p-3 rounded-full text-emerald-600">
                        <WeatherIconComponent className="h-10 w-10" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Sprout className="h-7 w-7 text-muted-foreground mx-auto mb-1.5 opacity-40" />
                      <p className="text-xs text-muted-foreground">Register a plot in `/plots` to enable automated meteorological lookups.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Links / Actions */}
              <Card className="border-emerald-500/10 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => router.push('/plots')}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 border-emerald-500/5 bg-emerald-500/[0.01] hover:bg-emerald-500/5"
                  >
                    <Sprout className="h-5 w-5 text-emerald-500" />
                    <span className="text-xs font-semibold">Manage Plots</span>
                  </Button>
                  <Button
                    onClick={() => router.push('/alerts')}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 border-emerald-500/5 bg-emerald-500/[0.01] hover:bg-emerald-500/5"
                  >
                    <BellRing className="h-5 w-5 text-emerald-500" />
                    <span className="text-xs font-semibold">View Alerts</span>
                  </Button>
                  <Button
                    onClick={() => router.push('/pest-check')}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 border-emerald-500/5 bg-emerald-500/[0.01] hover:bg-emerald-500/5"
                  >
                    <Camera className="h-5 w-5 text-emerald-500" />
                    <span className="text-xs font-semibold">AI Pathology</span>
                  </Button>
                  <Button
                    onClick={() => router.push('/crop-advisor')}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 border-emerald-500/5 bg-emerald-500/[0.01] hover:bg-emerald-500/5"
                  >
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    <span className="text-xs font-semibold">Crop Advisor</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
