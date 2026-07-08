
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Satellite, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import type { SatellitePassData } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface MonitoringCardProps {
    nextPass: SatellitePassData | null;
    isLoading: boolean;
}

export function MonitoringCard({ nextPass, isLoading }: MonitoringCardProps) {
    const { toast } = useToast();
    const { t } = useLanguage();
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [threshold, setThreshold] = useState(20);

    const handleSave = () => {
        toast({
            title: isMonitoring ? t('dashboard.monitoring.alert.enabled.title') : t('dashboard.monitoring.alert.disabled.title'),
            description: isMonitoring ? t('dashboard.monitoring.alert.enabled.description', { threshold: threshold.toString() }) : t('dashboard.monitoring.alert.disabled.description'),
        });
    }

    return (
        <Card className="glass-card hover:glow-border transition-all duration-300">
            <CardHeader className="pb-4 border-b border-emerald-950/15">
                <div className="flex items-center gap-2.5">
                    <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 text-primary">
                        <Satellite className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">{t('dashboard.monitoring.title')}</CardTitle>
                        <CardDescription className="text-slate-400 mt-1">{t('dashboard.monitoring.description')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">

                {isLoading && (
                    <div className="space-y-3">
                        <Skeleton className="h-5 w-3/4 rounded-lg bg-emerald-500/10" />
                        <Skeleton className="h-4 w-1/2 rounded-lg bg-emerald-500/10" />
                    </div>
                )}

                {!isLoading && nextPass && (
                    <div className="p-4 rounded-2xl bg-primary/[0.03] border border-primary/10 shadow-inner">
                        <p className="font-semibold text-sm text-primary">{t('dashboard.summary.nextPass')}</p>
                        <p className="text-slate-400 text-sm mt-1">
                            {nextPass.satelliteName} {t('dashboard.monitoring.pass.in')} <span className="font-bold text-foreground">{formatDistanceToNow(new Date(nextPass.passTime), { addSuffix: true })}</span>
                        </p>
                    </div>
                )}
                
                <div className="flex items-center justify-between space-x-2 pt-2">
                    <Label htmlFor="monitoring-switch" className="flex-grow flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-slate-300">
                        <div className="bg-primary/5 p-2 rounded-xl text-primary/80">
                            <Bot className="h-4 w-4" />
                        </div>
                        {t('dashboard.monitoring.toggle')}
                    </Label>
                    <Switch
                        id="monitoring-switch"
                        checked={isMonitoring}
                        onCheckedChange={setIsMonitoring}
                        className="data-[state=checked]:bg-primary"
                    />
                </div>
                {isMonitoring && (
                    <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label htmlFor="threshold" className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('dashboard.monitoring.threshold.label')}</Label>
                        <div className="relative">
                            <Input
                                id="threshold"
                                type="number"
                                value={threshold}
                                onChange={(e) => setThreshold(Number(e.target.value))}
                                className="pr-10 rounded-xl bg-background/50 border-emerald-950/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                            />
                            <span className="absolute inset-y-0 right-3 flex items-center text-sm font-bold text-slate-400">%</span>
                        </div>
                         <p className="text-xs text-slate-400 leading-relaxed">{t('dashboard.monitoring.threshold.description')}</p>
                    </div>
                )}
                 <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-11 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-300">
                    {t('dashboard.monitoring.save')}
                </Button>
            </CardContent>
        </Card>
    );
}

    