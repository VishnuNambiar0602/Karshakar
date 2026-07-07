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
  getAlertsAction,
  resolveAlertAction,
  runAlertChecksAction,
  textToSpeechAction,
  getNotificationLogsAction,
} from '@/lib/actions';
import {
  Bell,
  BellRing,
  Check,
  RefreshCw,
  Volume2,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  Info,
} from 'lucide-react';

export default function AlertsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [checking, setChecking] = useState(false);
  
  // Audio playback state
  const [playingAlertId, setPlayingAlertId] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, logsRes] = await Promise.all([
        getAlertsAction(),
        getNotificationLogsAction()
      ]);
      if (alertsRes.data) {
        setAlerts(alertsRes.data);
      }
      if (logsRes.data) {
        setLogs(logsRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getFarmerProfileAction().then(res => {
      if (!res.data) {
        toast({
          title: 'Profile Required',
          description: 'Please complete onboarding first.',
          variant: 'destructive',
        });
        router.push('/onboarding');
      } else {
        setProfileChecked(true);
        loadAlerts();
      }
    });
  }, [router, toast, loadAlerts]);

  const handleResolveAlert = async (id: string) => {
    const res = await resolveAlertAction(id);
    if (res.data) {
      toast({
        title: 'Alert Resolved',
        description: 'Alert cleared from active panel.',
      });
      loadAlerts();
    }
  };

  const handleRunAlertChecks = async () => {
    setChecking(true);
    toast({
      title: 'Alert Check Started',
      description: 'Analyzing satellite indices and weather metrics...',
    });
    const res = await runAlertChecksAction();
    setChecking(false);

    if (res.error) {
      toast({
        title: 'Alert Check Failed',
        description: res.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Scan Complete',
        description: `Alert checks finished. Created ${res.data?.alertsCreated || 0} alerts.`,
      });
      loadAlerts();
    }
  };

  const handleTextToSpeech = async (alert: any) => {
    if (playingAlertId === alert.id) return; // Already playing
    setPlayingAlertId(alert.id);

    try {
      const speechText = `${alert.title}. Warning for plot ${alert.plotName}. ${alert.message}`;
      const res = await textToSpeechAction(speechText);
      
      if (res.data?.audioDataUri) {
        const audio = new Audio(res.data.audioDataUri);
        audio.onended = () => setPlayingAlertId(null);
        audio.onerror = () => setPlayingAlertId(null);
        await audio.play();
      } else {
        setPlayingAlertId(null);
        toast({
          title: 'TTS Failed',
          description: 'Could not generate speech audio.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      setPlayingAlertId(null);
      console.error(e);
    }
  };

  const activeAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);

  if (!profileChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="flex justify-between items-center border-b border-emerald-500/10 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
              <Bell className="h-7 w-7 text-emerald-500" />
              Alert Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Active warnings and advisories based on real-time soil, satellite, and temperature sensors.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRunAlertChecks}
            disabled={checking}
            className="border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5"
          >
            {checking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Scan Weather & Soil
          </Button>
        </div>

        {/* Active Alerts */}
        <Card className="border-emerald-500/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BellRing className="h-5 w-5 text-emerald-500" />
              Active Warnings ({activeAlerts.length})
            </CardTitle>
            <CardDescription>Urgent conditions requiring attention or irrigation changes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            ) : activeAlerts.length === 0 ? (
              <div className="text-center py-10 bg-emerald-500/5 border border-dashed border-emerald-500/10 rounded-xl">
                <Check className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-emerald-800 dark:text-emerald-400">All plots are stable!</p>
                <p className="text-xs text-muted-foreground mt-1">No active alerts. Click &quot;Scan Weather &amp; Soil&quot; to refresh.</p>
              </div>
            ) : (
              activeAlerts.map(a => (
                <div
                  key={a.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                    a.severity === 'high'
                      ? 'bg-red-500/5 border-red-500/20'
                      : 'bg-amber-500/5 border-amber-500/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0">
                      {a.severity === 'high' ? (
                        <ShieldAlert className="h-5 w-5 text-red-500 animate-pulse" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm md:text-base text-foreground">
                          {a.title}
                        </h4>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          Plot: {a.plotName}
                        </Badge>
                        <Badge
                          className={`text-[10px] uppercase font-mono px-1.5 py-0.2 ${
                            a.severity === 'high'
                              ? 'bg-red-600 text-white'
                              : 'bg-amber-600 text-white'
                          }`}
                        >
                          {a.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{a.message}</p>
                      
                      {/* Delivery Status logs */}
                      {(() => {
                        const alertLogs = logs.filter(l => l.alertId === a.id);
                        if (alertLogs.length === 0) return null;
                        return (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center">Advisory Sent:</span>
                            {alertLogs.map(l => (
                              <Badge
                                key={l.id}
                                variant="outline"
                                className={`text-[9px] uppercase font-mono px-1.5 py-0 ${
                                  l.status === 'sent'
                                    ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                                    : 'border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/5'
                                }`}
                              >
                                {l.channel}: {l.status}
                              </Badge>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTextToSpeech(a)}
                      className="border-emerald-500/10 text-emerald-600 hover:bg-emerald-500/5"
                    >
                      {playingAlertId === a.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleResolveAlert(a.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Clear Warning
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Resolved Alerts (Archive) */}
        {resolvedAlerts.length > 0 && (
          <Card className="border-emerald-500/10 opacity-70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Alert Archive ({resolvedAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resolvedAlerts.slice(0, 10).map(a => (
                <div
                  key={a.id}
                  className="p-3 rounded-lg border border-border bg-muted/20 flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-semibold text-muted-foreground">{a.title}</span>
                    <span className="text-muted-foreground mx-1.5">•</span>
                    <span className="text-muted-foreground">Plot: {a.plotName}</span>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">{a.message}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] uppercase font-mono">Resolved</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
