
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
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.landCover.title')}</CardTitle>
        <CardDescription>{t('dashboard.landCover.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-1">
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('dashboard.landCover.class')}</TableHead>
                      <TableHead className="text-right">{t('dashboard.landCover.startArea')}</TableHead>
                      <TableHead className="text-right">{t('dashboard.landCover.change')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(row => {
                        const data = landCover[row.key];
                        return (
                            <TableRow key={row.key}>
                                <TableCell className="font-medium">
                                   {row.label}
                                </TableCell>
                                <TableCell className="text-right">{data.startArea.toFixed(2)}</TableCell>
                                <TableCell><ChangeCell value={data.percentageChange} /></TableCell>
                            </TableRow>
                        )
                    })}
                  </TableBody>
                </Table>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <h3 className="text-center font-semibold">{t('dashboard.landCover.startArea')}</h3>
                    <div className="aspect-square rounded-lg overflow-hidden border">
                       <ImageWithLoader src={landCover.beforeMapUrl} alt="Land cover map at the start of the period." />
                    </div>
                </div>
                 <div className="space-y-2">
                    <h3 className="text-center font-semibold">{t('dashboard.landCover.endArea')}</h3>
                    <div className="aspect-square rounded-lg overflow-hidden border">
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
