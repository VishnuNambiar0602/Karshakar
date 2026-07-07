'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/header';
import { getAdminMetricsAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Grid,
  BellRing,
  MailWarning,
  Activity,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    getAdminMetricsAction().then(res => {
      if (res.error) {
        toast({
          title: 'Access Denied',
          description: 'Restricted to administrative personnel only.',
          variant: 'destructive',
        });
        router.push('/');
      } else {
        setAuthorized(true);
        setMetrics(res.data);
      }
      setLoading(false);
    });
  }, [router, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authorized || !metrics) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
        <MailWarning className="h-12 w-12 text-red-500" />
        <h1 className="text-xl font-bold">Unauthorized Access</h1>
        <p className="text-sm text-muted-foreground">Admin credentials required to view this portal.</p>
        <Button onClick={() => router.push('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Farmer Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
              <Activity className="h-7 w-7 text-primary" />
              Advisory Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time monitoring of registered plots, advisory generation rates, and automated message delivery.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="border-primary/20 text-primary dark:text-primary hover:bg-primary/5"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Farmer Portal
          </Button>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Registered Farmers</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalFarmers}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Total profiles created</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Active Land Plots</CardTitle>
              <Grid className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalPlots}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Total fields registered</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Alerts (24h / 7d)</CardTitle>
              <BellRing className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.alertsLast24h} <span className="text-sm font-normal text-muted-foreground">/ {metrics.alertsLast7d}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Threshold triggers recorded</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Notification Success</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.notificationSuccessRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-0.5">Out of {metrics.totalNotifications} messages sent</p>
            </CardContent>
          </Card>
        </div>

        {/* Message Logs Table */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Recent Notification Logs</CardTitle>
            <CardDescription>
              Chronological log of SMS and WhatsApp advisories sent to farmers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.recentLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No notification delivery logs found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                      <th className="p-3">Sent At</th>
                      <th className="p-3">To</th>
                      <th className="p-3">Channel</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {metrics.recentLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-muted/10">
                        <td className="p-3 font-mono text-xs">
                          {new Date(log.sentAt).toLocaleString()}
                        </td>
                        <td className="p-3 font-medium">{log.to}</td>
                        <td className="p-3 uppercase text-xs font-semibold tracking-wider">
                          {log.channel}
                        </td>
                        <td className="p-3">
                          <span className="flex items-center gap-1.5">
                            {log.status === 'sent' ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 text-[10px]">
                                  SUCCESS
                                </Badge>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-red-500" />
                                <Badge variant="outline" className="border-red-500/20 text-red-600 bg-red-500/5 text-[10px]">
                                  FAILED
                                </Badge>
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
