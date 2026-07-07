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
      variantStyles = "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
      Icon = CheckCircle;
      badgeVariant = "secondary"; // Often greenish or neutral
      break;
    case "Transitional":
      variantStyles = "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800";
      Icon = Activity;
      badgeVariant = "outline";
      break;
    case "Concerning":
      variantStyles = "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800";
      Icon = AlertTriangle;
      badgeVariant = "destructive"; // Orange/Red usually
      break;
    case "Critical":
      variantStyles = "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
      Icon = AlertOctagon;
      badgeVariant = "destructive";
      break;
  }

  // Convert confidence to percentage
  const confidencePercent = Math.round(confidenceScore * 100);

  return (
    <Card className={`mb-6 border-l-4 ${variantStyles}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-6 w-6" />
            <CardTitle>{t('dashboard.insight.title')}</CardTitle>
          </div>
          <Badge variant={badgeVariant} className="text-base px-3 py-1">
            {t(`dashboard.insight.classification.${classification}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-lg leading-relaxed">{explanation}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-lg bg-background/50 border">
            <h4 className="font-semibold mb-1 text-sm text-muted-foreground uppercase tracking-wider">
              {t('dashboard.insight.action')}
            </h4>
            <p className="font-medium text-primary">{recommendedAction}</p>
          </div>

          <div className="flex flex-col justify-center p-4 rounded-lg bg-background/50 border">
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                {t('dashboard.insight.confidence')}
              </span>
              <span className="font-bold">{confidencePercent}%</span>
            </div>
            <Progress value={confidencePercent} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}