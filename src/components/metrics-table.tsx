
"use client";

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { generateInsightAction, generateReportAction } from "@/lib/actions";
import { generateCsv, downloadFile } from "@/lib/csv";
import type { AnalysisResult, MetricData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Wand2 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';


type TableRowData = {
    name: string;
    type: 'index' | 'landcover' | 'band';
    firstValue: number | null;
    lastValue: number | null;
    percentageChange: number | null;
    n: number | null;
    insight?: string;
};

type SortKey = keyof TableRowData | '';
type SortDirection = 'asc' | 'desc';

type MetricPoint = {
  value: number | null;
};

interface MetricsTableProps {
  analysisResult: AnalysisResult;
  location: string;
  dateRange: string;
}

const metricOrder = [
    // Bands
    'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B9', 'B11', 'B12',
    // Indices
    'NDVI', 'NDWI', 'NDBI', 'NBR',
    // Land Cover
    'Vegetation', 'Water', 'Built-up', 'Other'
];

export function MetricsTable({ analysisResult, location, dateRange }: MetricsTableProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [sortKey, setSortKey] = useState<SortKey>('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [insightLoading, setInsightLoading] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  
  const [tableData, setTableData] = useState<TableRowData[]>(() => {
    const timeSeriesMetrics: TableRowData[] = Object.entries(analysisResult.timeSeries).map(([name, ts]) => {
      const validPoints = ts.filter((d: MetricPoint) => d.value !== null && !isNaN(d.value));
      const firstValue = validPoints.length > 0 ? validPoints[0].value : null;
      const lastValue = validPoints.length > 0 ? validPoints[validPoints.length - 1].value : null;
      let percentageChange: number | null = null;
      if (firstValue !== null && lastValue !== null && firstValue !== 0) {
        percentageChange = ((lastValue - firstValue) / Math.abs(firstValue)) * 100;
      }
      return {
        name,
        type: name.startsWith('B') ? 'band' : 'index',
        firstValue,
        lastValue,
        percentageChange,
        n: validPoints.length
      };
    });

    const landCoverMetrics: TableRowData[] = [
      { name: 'Vegetation', key: 'vegetation' },
      { name: 'Water', key: 'water' },
      { name: 'Built-up', key: 'builtUp' },
      { name: 'Other', key: 'other' },
    ].map(item => {
        const data = analysisResult.landCover[item.key as keyof typeof analysisResult.landCover];
        if (typeof data === 'string') {
            return {
                name: item.name,
                type: 'landcover',
                firstValue: null,
                lastValue: null,
                percentageChange: null,
                n: null,
            };
        }
        return {
            name: item.name,
            type: 'landcover',
            firstValue: data.startArea,
            lastValue: data.endArea,
            percentageChange: data.percentageChange,
            n: null,
        }
    });

    const allMetrics = [...timeSeriesMetrics, ...landCoverMetrics];
    
    return allMetrics.sort((a, b) => {
        const indexA = metricOrder.indexOf(a.name);
        const indexB = metricOrder.indexOf(b.name);
        if(indexA === -1) return 1;
        if(indexB === -1) return -1;
        return indexA - indexB;
    });
  });
  
  const sortedMetrics = useMemo(() => {
    if (!sortKey) return tableData;
    return [...tableData].sort((a, b) => {
      const aVal = a[sortKey as keyof TableRowData];
      const bVal = b[sortKey as keyof TableRowData];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tableData, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const getInsight = async (metricName: string) => {
    if (insightLoading) return;
    setInsightLoading(metricName);
    
    const metric = tableData.find(m => m.name === metricName);
    if (metric && metric.firstValue !== null && metric.lastValue !== null && metric.percentageChange !== null && metric.n !== null) {
      const result = await generateInsightAction({
          metricName: metric.name,
          firstValue: metric.firstValue,
          lastValue: metric.lastValue,
          percentageChange: metric.percentageChange,
          numberOfValidPoints: metric.n,
      });

      if (result.error) {
        toast({ title: t('predict.error.aiError.title'), description: result.error, variant: "destructive" });
      } else if (result.data && result.data.insight) {
        setTableData(prevData => prevData.map(m => m.name === metricName ? { ...m, insight: result.data!.insight } : m));
      }
    }
    setInsightLoading(null);
  };
  
  const handleExportCsv = () => {
    const metricsToExport: MetricData[] = tableData.map(row => ({
        name: row.name,
        firstValue: row.firstValue,
        lastValue: row.lastValue,
        percentageChange: row.percentageChange,
        n: row.n ?? 0,
        timeSeries: [], // Not needed for this CSV
    }));
    const csvData = generateCsv(metricsToExport, t);
    downloadFile(csvData, 'earth-insights-metrics.csv', 'text/csv');
    toast({ title: t('dashboard.metrics.export.csvSuccess.title'), description: t('dashboard.metrics.export.csvSuccess.description') });
  }

  const handleExportReport = async () => {
    setReportLoading(true);
    const metricsForReport = tableData.map(d => ({
        name: d.name,
        type: d.type,
        firstValue: d.firstValue,
        lastValue: d.lastValue,
        percentageChange: d.percentageChange,
        points: d.n,
        unit: d.type === 'landcover' ? 'km²' : (d.type === 'band' ? 'reflectance' : 'index value')
    }));

    const result = await generateReportAction(JSON.stringify(metricsForReport, null, 2), location, dateRange);
    setReportLoading(false);
    if (result.error) {
      toast({ title: t('dashboard.metrics.export.reportError.title'), description: result.error, variant: 'destructive' });
    } else if (result.data) {
      downloadFile(result.data.summaryReport, 'summary-report.txt', 'text/plain');
      toast({ title: t('dashboard.metrics.export.reportSuccess.title'), description: t('dashboard.metrics.export.reportSuccess.description') });
    }
  };

  const handleExportGeospatial = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-74.2, 40.6],
              [-73.8, 40.6],
              [-73.8, 40.9],
              [-74.2, 40.9],
              [-74.2, 40.6],
            ]],
          },
          properties: {
            location,
            dateRange,
            generatedAt: new Date().toISOString(),
          },
        },
      ],
    };

    downloadFile(JSON.stringify(geojson, null, 2), 'earth-insights-artifact.geojson', 'application/geo+json');
    toast({ title: 'GeoJSON export complete', description: 'Geospatial artifact downloaded successfully.' });
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDirection === 'asc' ? '▲' : '▼';
  };
  
  return (
    <Card className="glass-card border border-primary/10 shadow-xl hover:glow-border transition-all duration-300">
      <CardHeader className="pb-4 border-b border-emerald-950/15">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight">{t('dashboard.metrics.title')}</CardTitle>
            <CardDescription className="text-slate-400 mt-1">{t('dashboard.metrics.description')}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportCsv} className="rounded-xl border-emerald-950/20 hover:bg-primary/5 hover:text-primary transition-all duration-200">{t('dashboard.metrics.export.csv')}</Button>
            <Button variant="outline" onClick={handleExportReport} disabled={reportLoading} className="rounded-xl border-emerald-950/20 hover:bg-primary/5 hover:text-primary transition-all duration-200">
              {reportLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" /> : null}
              {reportLoading ? t('dashboard.metrics.export.generating') : t('dashboard.metrics.export.report')}
            </Button>
            <Button variant="outline" onClick={handleExportGeospatial} className="rounded-xl border-emerald-950/20 hover:bg-primary/5 hover:text-primary transition-all duration-200">GeoJSON</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="overflow-x-auto rounded-2xl border border-emerald-950/15">
        <Table>
          <TableHeader className="bg-primary/[0.02]">
            <TableRow>
              <TableHead aria-sort={sortKey === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'} className="font-bold text-slate-300">
                <button type="button" onClick={() => handleSort('name')} className="flex items-center hover:text-primary transition-colors uppercase text-xs tracking-wider" aria-label="Sort by metric">{t('dashboard.metrics.table.metric')} <span className="ml-1.5 text-[10px]">{renderSortIcon('name')}</span></button>
              </TableHead>
              <TableHead className="text-right font-bold text-slate-300" aria-sort={sortKey === 'firstValue' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" onClick={() => handleSort('firstValue')} className="ml-auto flex items-center justify-end hover:text-primary transition-colors uppercase text-xs tracking-wider" aria-label="Sort by start value">{t('dashboard.metrics.table.start')} <span className="ml-1.5 text-[10px]">{renderSortIcon('firstValue')}</span></button>
              </TableHead>
              <TableHead className="text-right font-bold text-slate-300" aria-sort={sortKey === 'lastValue' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" onClick={() => handleSort('lastValue')} className="ml-auto flex items-center justify-end hover:text-primary transition-colors uppercase text-xs tracking-wider" aria-label="Sort by end value">{t('dashboard.metrics.table.end')} <span className="ml-1.5 text-[10px]">{renderSortIcon('lastValue')}</span></button>
              </TableHead>
              <TableHead className="text-right font-bold text-slate-300" aria-sort={sortKey === 'percentageChange' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" onClick={() => handleSort('percentageChange')} className="ml-auto flex items-center justify-end hover:text-primary transition-colors uppercase text-xs tracking-wider" aria-label="Sort by percentage change">{t('dashboard.metrics.table.change')} <span className="ml-1.5 text-[10px]">{renderSortIcon('percentageChange')}</span></button>
              </TableHead>
              <TableHead className="text-right font-bold text-slate-300" aria-sort={sortKey === 'n' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                 <button type="button" onClick={() => handleSort('n')} className="ml-auto flex items-center justify-end hover:text-primary transition-colors uppercase text-xs tracking-wider" aria-label="Sort by points">{t('dashboard.metrics.table.points')} <span className="ml-1.5 text-[10px]">{renderSortIcon('n')}</span></button>
              </TableHead>
              <TableHead className="text-center font-bold text-slate-300 uppercase text-xs tracking-wider">{t('dashboard.metrics.table.insight')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMetrics.map((metric) => (
              <TableRow key={metric.name} className="hover:bg-primary/[0.01] transition-colors">
                <TableCell className="font-semibold text-slate-200">{metric.name}</TableCell>
                <TableCell className="text-right font-mono text-xs">{metric.firstValue?.toFixed(4) ?? 'N/A'}</TableCell>
                <TableCell className="text-right font-mono text-xs">{metric.lastValue?.toFixed(4) ?? 'N/A'}</TableCell>
                <TableCell className={`text-right font-mono text-xs font-bold ${metric.percentageChange === null ? '' : metric.percentageChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metric.percentageChange === null ? 'N/A' : `${metric.percentageChange >= 0 ? '+' : ''}${metric.percentageChange.toFixed(2)}%`}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">{metric.n ?? 'N/A'}</TableCell>
                <TableCell className="text-center">
                  {metric.type !== 'landcover' ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => !metric.insight && getInsight(metric.name)} disabled={!!insightLoading} className="rounded-xl hover:bg-primary/10 hover:text-primary">
                          {insightLoading === metric.name ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Wand2 className={`h-4 w-4 ${insightLoading ? 'animate-pulse text-primary/75' : 'text-primary'}`} />}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 rounded-2xl bg-background/95 backdrop-blur-xl border border-emerald-950/20 shadow-2xl">
                        {insightLoading === metric.name ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span className="ml-2 text-sm font-semibold">{t('dashboard.metrics.export.generating')}</span>
                          </div>
                        ) : (
                          <div className="grid gap-2 p-1">
                            <h4 className="font-bold text-sm text-foreground">{t('dashboard.metrics.table.insightTitle', { metric: metric.name })}</h4>
                            <p className="text-xs text-slate-300 leading-relaxed mt-1">{metric.insight || t('dashboard.metrics.table.insightPlaceholder')}</p>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  ): <div className="w-8 h-8"></div>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}
