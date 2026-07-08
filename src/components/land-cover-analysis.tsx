
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { LandCoverAnalysis as LandCoverAnalysisType } from "@/lib/types";
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useLanguage } from "@/hooks/use-language";
import { ImageWithLoader } from "./image-with-loader";


interface LandCoverAnalysisProps {
  landCover: LandCoverAnalysisType;
}

const ChangeCell = ({ value }: { value: number }) => {
  const isPositive = value >= 0;
  
  return (
    <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      <span>{isPositive ? '▲' : '▼'}</span>
      <span>{Math.abs(value).toFixed(2)}%</span>
    </div>
  );
};

export function LandCoverAnalysis({ landCover }: LandCoverAnalysisProps) {
  const { t } = useLanguage();

  const rows = [
      { key: 'vegetation', label: t('dashboard.landCover.vegetation') },
      { key: 'water', label: t('dashboard.landCover.water') },
      { key: 'builtUp', label: t('dashboard.landCover.builtUp') },
      { key: 'other', label: t('dashboard.landCover.other') },
  ] as const;
  
  const chartData = rows.map(row => ({
    name: row.label,
    startArea: landCover[row.key].startArea,
    endArea: landCover[row.key].endArea,
  }));

  const chartConfig = {
    startArea: {
      label: t('dashboard.landCover.startArea'),
      color: "hsl(var(--secondary))",
    },
    endArea: {
      label: t('dashboard.landCover.endArea'),
      color: "hsl(var(--primary))",
    },
  }

  return (
    <Card className="glass-card border border-primary/10 shadow-xl hover:glow-border transition-all duration-300">
      <CardHeader className="pb-4 border-b border-emerald-950/15">
        <CardTitle className="text-xl font-bold tracking-tight">{t('dashboard.landCover.title')}</CardTitle>
        <CardDescription className="text-slate-400 mt-1">{t('dashboard.landCover.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 pt-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-1">
                 <div className="rounded-2xl border border-emerald-950/15 overflow-hidden">
                   <Table>
                    <TableHeader className="bg-primary/[0.02]">
                      <TableRow>
                        <TableHead className="font-bold text-slate-300">{t('dashboard.landCover.class')}</TableHead>
                        <TableHead className="text-right font-bold text-slate-300">{t('dashboard.landCover.startArea')}</TableHead>
                        <TableHead className="text-right font-bold text-slate-300">{t('dashboard.landCover.change')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map(row => {
                          const data = landCover[row.key];
                          return (
                              <TableRow key={row.key} className="hover:bg-primary/[0.02] transition-colors">
                                  <TableCell className="font-semibold text-slate-200">
                                     {row.label}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">{data.startArea.toFixed(2)}</TableCell>
                                  <TableCell><ChangeCell value={data.percentageChange} /></TableCell>
                              </TableRow>
                          )
                      })}
                    </TableBody>
                  </Table>
                 </div>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <h3 className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{t('dashboard.landCover.startArea')}</h3>
                    <div className="aspect-square rounded-2xl overflow-hidden border border-primary/10 relative shadow-inner group">
                       <div className="absolute inset-0 bg-primary/[0.04] pointer-events-none z-10 mix-blend-overlay group-hover:bg-transparent transition-colors duration-300" />
                       <ImageWithLoader src={landCover.beforeMapUrl} alt="Land cover map at the start of the period." />
                    </div>
                </div>
                 <div className="space-y-2">
                    <h3 className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{t('dashboard.landCover.endArea')}</h3>
                    <div className="aspect-square rounded-2xl overflow-hidden border border-primary/10 relative shadow-inner group">
                        <div className="absolute inset-0 bg-primary/[0.04] pointer-events-none z-10 mix-blend-overlay group-hover:bg-transparent transition-colors duration-300" />
                        <ImageWithLoader src={landCover.afterMapUrl} alt="Land cover map at the end of the period." />
                    </div>
                </div>
            </div>
        </div>
         <div className="min-h-[300px] pt-8">
            <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={chartData} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="name"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                    />
                    <YAxis 
                        tickFormatter={(value) => `${value} km²`}
                    />
                        <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                        />
                    <Legend />
                    <Bar dataKey="startArea" fill="var(--color-startArea)" radius={4} />
                    <Bar dataKey="endArea" fill="var(--color-endArea)" radius={4} />
                </BarChart>
            </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
