
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { WeatherData, HourlyForecast } from "@/lib/types";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Button } from "./ui/button";
import {
  RefreshCw,
  HelpCircle,
  Sun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Cloudy,
  type LucideProps,
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface WeatherReportProps {
    weather: WeatherData | null;
    isLoading?: boolean;
    showForecast?: boolean;
    onFetchWeather?: () => void;
}

const ICONS = {
  Sun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Cloudy,
} as const;

const Icon = ({ name, ...props }: { name: string } & LucideProps) => {
    const IconComponent = ICONS[name as keyof typeof ICONS] ?? HelpCircle;
    return <IconComponent {...props} />;
}

export function WeatherReport({ weather, isLoading, showForecast = true, onFetchWeather }: WeatherReportProps) {
  const { t } = useLanguage();

  if (isLoading) {
    return <Skeleton className="h-full w-full min-h-[160px]" />;
  }

  if (!weather) {
    return (
      <Card className="h-full flex items-center justify-center min-h-[160px]">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-2">{t('dashboard.weather.noData')}</p>
           {onFetchWeather && (
             <Button onClick={onFetchWeather} size="sm" variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" /> {t('dashboard.weather.fetch')}
            </Button>
           )}
        </CardContent>
      </Card>
    );
  }

  const { current, forecast, summary } = weather;

  return (
    <Card className="glass-card hover:glow-border transition-all duration-300">
      <CardHeader className="pb-4 border-b border-emerald-950/15">
        <CardTitle className="text-xl font-bold tracking-tight">{t('dashboard.weather.title')}</CardTitle>
        <CardDescription className="text-slate-400 mt-1">{showForecast ? summary : current.conditions}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20 text-primary animate-pulse">
                  <Icon name={current.iconName} className="h-10 w-10 text-primary" />
                </div>
                <div>
                     <div className="text-4xl font-extrabold tracking-tight text-foreground">{current.temperature.toFixed(0)}°C</div>
                </div>
            </div>
            <div className="space-y-1.5 text-sm text-right">
                <div className="flex justify-end gap-2 text-slate-400">
                    <span>{t('dashboard.weather.humidity')}</span>
                    <span className="font-semibold text-foreground">{current.humidity}%</span>
                </div>
                <div className="flex justify-end gap-2 text-slate-400">
                    <span>{t('dashboard.weather.wind')}</span>
                    <span className="font-semibold text-foreground">{current.windSpeed} km/h</span>
                </div>
            </div>
        </div>

        {showForecast && (
            <div className="pt-4 border-t border-emerald-950/10">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">{t('dashboard.weather.hourly')}</h4>
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex space-x-3 pb-3">
                    {forecast.map((hour: HourlyForecast) => (
                        <div key={hour.time} className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-primary/[0.02] hover:bg-primary/[0.06] border border-primary/5 min-w-[85px] transition-all duration-200">
                            <p className="text-xs font-bold text-slate-400">{hour.time}</p>
                            <Icon name={hour.iconName} className="h-6 w-6 text-slate-300" />
                            <p className="text-base font-extrabold text-foreground">{hour.temperature.toFixed(0)}°C</p>
                        </div>
                    ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
