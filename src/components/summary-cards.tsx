
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
      <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.landCover.vegetation')}</CardTitle>
            <AreaChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {landCover.vegetation.endArea.toFixed(2)} km²
            </div>
            <ChangeIndicator value={landCover.vegetation.percentageChange} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.landCover.water')}</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {landCover.water.endArea.toFixed(2)} km²
            </div>
            <ChangeIndicator value={landCover.water.percentageChange} />
          </CardContent>
        </Card>
      <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.landCover.builtUp')}</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {landCover.builtUp.endArea.toFixed(2)} km²
            </div>
            <ChangeIndicator value={landCover.builtUp.percentageChange} />
          </CardContent>
        </Card>
    </>
  );
}
