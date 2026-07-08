"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AnalyzeChangeOutput } from "@/ai/flows/analyze-change";
import { CheckCircle, Activity, AlertTriangle, AlertOctagon, BrainCircuit } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface ChangeInsightCardProps {
  changeAnalysis: AnalyzeChangeOutput;
}

export function ChangeInsightCard({ changeAnalysis }: ChangeInsightCardProps) {
  const { t } = useLanguage();

  const { classification, confidenceScore, explanation, recommendedAction } = changeAnalysis;

  // Determine styles and icon based on classification
  let variantStyles = "";
  let Icon = BrainCircuit;
  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";

  switch (classification) {
    case "Normal":
      variantStyles = "border-l-green-500 bg-green-500/[0.03] text-green-700 dark:text-green-300";
      Icon = CheckCircle;
      badgeVariant = "secondary";
      break;
    case "Transitional":
      variantStyles = "border-l-yellow-500 bg-yellow-500/[0.03] text-yellow-700 dark:text-yellow-300";
      Icon = Activity;
      badgeVariant = "outline";
      break;
    case "Concerning":
      variantStyles = "border-l-orange-500 bg-orange-500/[0.03] text-orange-700 dark:text-orange-300";
      Icon = AlertTriangle;
      badgeVariant = "destructive";
      break;
    case "Critical":
      variantStyles = "border-l-red-500 bg-red-500/[0.03] text-red-700 dark:text-red-300";
      Icon = AlertOctagon;
      badgeVariant = "destructive";
      break;
  }

  // Convert confidence to percentage
  const confidencePercent = Math.round(confidenceScore * 100);

  return (
    <Card className={`mb-6 border-l-4 glass-card hover:glow-border transition-all duration-300 ${variantStyles}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold tracking-tight">{t('dashboard.insight.title')}</CardTitle>
          </div>
          <Badge variant={badgeVariant} className="text-xs px-3 py-1 font-bold rounded-full">
            {t(`dashboard.insight.classification.${classification}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-2">
        <div>
          <p className="text-base leading-relaxed text-slate-300">{explanation}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-xl bg-background/30 border border-emerald-950/15">
            <h4 className="font-bold mb-1 text-xs text-slate-400 uppercase tracking-wider">
              {t('dashboard.insight.action')}
            </h4>
            <p className="font-semibold text-primary">{recommendedAction}</p>
          </div>

          <div className="flex flex-col justify-center p-4 rounded-xl bg-background/30 border border-emerald-950/15">
            <div className="flex justify-between mb-2">
              <span className="font-bold text-xs text-slate-400 uppercase tracking-wider">
                {t('dashboard.insight.confidence')}
              </span>
              <span className="font-extrabold text-foreground">{confidencePercent}%</span>
            </div>
            <Progress value={confidencePercent} className="h-2 bg-emerald-950/30" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}