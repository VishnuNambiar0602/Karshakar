
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Building, AreaChart, Droplets } from "lucide-react";
import type { LandCoverAnalysis } from "@/lib/types";
import { useLanguage } from "@/hooks/use-language";

interface SummaryCardsProps {
    landCover: LandCoverAnalysis;
}

const ChangeIndicator = ({ value }: { value: number }) => {
    const { t } = useLanguage();
    if (value === 0) return null;
    const isPositive = value > 0;
    return (
        <p className="text-xs text-muted-foreground flex items-center">
            {isPositive ? <ArrowUp className="h-4 w-4 text-green-500" /> : <ArrowDown className="h-4 w-4 text-red-500" />}
            <span className={isPositive ? "text-green-500" : "text-red-500"}>
                {Math.abs(value).toFixed(2)}%
            </span>
            &nbsp;{t('dashboard.summary.change')}
        </p>
    );
};

export function SummaryCards({ landCover }: SummaryCardsProps) {
  const { t } = useLanguage();

  return (
    <>
      <Card className="glass-card hover:glow-border transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">{t('dashboard.landCover.vegetation')}</CardTitle>
            <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500">
              <AreaChart className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
                {landCover.vegetation.endArea.toFixed(2)} km²
            </div>
            <div className="mt-2">
              <ChangeIndicator value={landCover.vegetation.percentageChange} />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover:glow-border transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">{t('dashboard.landCover.water')}</CardTitle>
            <div className="bg-blue-500/10 p-2 rounded-xl text-blue-500">
              <Droplets className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
                {landCover.water.endArea.toFixed(2)} km²
            </div>
            <div className="mt-2">
              <ChangeIndicator value={landCover.water.percentageChange} />
            </div>
          </CardContent>
        </Card>
      <Card className="glass-card hover:glow-border transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">{t('dashboard.landCover.builtUp')}</CardTitle>
            <div className="bg-amber-500/10 p-2 rounded-xl text-amber-500">
              <Building className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
                {landCover.builtUp.endArea.toFixed(2)} km²
            </div>
            <div className="mt-2">
              <ChangeIndicator value={landCover.builtUp.percentageChange} />
            </div>
          </CardContent>
        </Card>
    </>
  );
}
