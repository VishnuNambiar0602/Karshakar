
"use client";

import React, { useState, useMemo } from 'react';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, Label, Brush, Bar, ComposedChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AnalysisResult, GroundTruthDataPoint } from '@/lib/types';
import { format } from 'date-fns';
import type { DateRange } from "react-day-picker";
import { useLanguage } from '@/hooks/use-language';
import { Button } from './ui/button';
import { Loader2, Video } from 'lucide-react';
import { generateTimelapseVideoAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

type TooltipPayloadItem = {
  color?: string;
  stroke?: string;
  name?: string;
  value?: number | null;
  unit?: string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
};

type BrushRange = {
  startIndex?: number;
  endIndex?: number;
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const formattedLabel = label ? format(new Date(label), 'PPP') : 'No date';
    return (
      <div className="bg-background/80 backdrop-blur-sm p-2 border border-border rounded-md shadow-lg">
        <p className="label font-bold">{formattedLabel}</p>
        {payload.map((pld, index: number) => (
           <p key={index} style={{ color: pld.color || pld.stroke }}>
               {`${pld.name}: `}
               {pld.value !== null && pld.value !== undefined ? pld.value.toFixed(4) : 'N/A'}
               {pld.unit}
            </p>
        ))}
      </div>
    );
  }
  return null;
};

function combineAndSortData(analysisResult: AnalysisResult, groundTruth: GroundTruthDataPoint[] | null) {
    if (!groundTruth) return [];

    const satelliteDataMap = new Map(analysisResult.timeSeries.NDVI.map(d => [format(new Date(d.date), 'yyyy-MM-dd'), d.value]));

    return groundTruth
        .map((gt) => {
            const dateStr = format(new Date(gt.date), 'yyyy-MM-dd');
            const satelliteValue = satelliteDataMap.get(dateStr);
            if (satelliteValue !== undefined && satelliteValue !== null && !isNaN(gt.value)) {
                return {
                    ground: gt.value,
                    satellite: satelliteValue,
                };
            }
            return null;
        })
        .filter((d): d is { ground: number, satellite: number } => d !== null);
}

function downsampleSeries<T>(data: T[], maxPoints = 240): T[] {
  if (data.length <= maxPoints) {
    return data;
  }

  const step = Math.ceil(data.length / maxPoints);
  const sampled: T[] = [];
  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i] as T);
  }
  const last = data[data.length - 1];
  if (sampled[sampled.length - 1] !== last) {
    sampled.push(last as T);
  }

  return sampled;
}


interface VisualizationsProps {
  analysisResult: AnalysisResult;
  groundTruthData: GroundTruthDataPoint[] | null;
  selectedMetric: string;
  setSelectedMetric: (metric: string) => void;
  locationDescription: string;
  dateRange?: DateRange;
}

const metricOrder = [
    'NDVI', 'NDWI', 'NDBI', 'NBR',
    'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B9', 'B11', 'B12',
];

export function Visualizations({ analysisResult, groundTruthData, selectedMetric, setSelectedMetric, locationDescription, dateRange }: VisualizationsProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [brushStartIndex, setBrushStartIndex] = useState<number | undefined>();
  const [brushEndIndex, setBrushEndIndex] = useState<number | undefined>();
  
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const metricNames = Object.keys(analysisResult.timeSeries).sort((a,b) => {
      const indexA = metricOrder.indexOf(a);
      const indexB = metricOrder.indexOf(b);
      if(indexA === -1) return 1;
      if(indexB === -1) return -1;
      return indexA - indexB;
  });
  
  const combinedChartData = useMemo(() => {
    const metricData = analysisResult.timeSeries[selectedMetric as keyof typeof analysisResult.timeSeries];
    const weatherMap = new Map(analysisResult.historicalWeather.map(d => [format(new Date(d.date), 'yyyy-MM-dd'), d]));

    const merged = metricData.map(metricPoint => {
        const dateStr = format(new Date(metricPoint.date), 'yyyy-MM-dd');
        const weatherPoint = weatherMap.get(dateStr);
        return {
            date: metricPoint.date,
            value: metricPoint.value,
            temperature: weatherPoint?.temperature,
            precipitation: weatherPoint?.precipitation,
        }
    });

    return downsampleSeries(merged);

  }, [analysisResult, selectedMetric]);
  
  const comparisonData = combineAndSortData(analysisResult, groundTruthData);
  
  const handleBrushChange = (range: BrushRange | undefined) => {
    setBrushStartIndex(range?.startIndex);
    setBrushEndIndex(range?.endIndex);
  };
  
  const handleGenerateVideo = async () => {
    if (!dateRange?.from || !dateRange?.to) {
        toast({ title: t('dashboard.error.noDate.title'), description: t('dashboard.error.noDate.description'), variant: "destructive"});
        return;
    }
    setIsGeneratingVideo(true);
    setVideoUrl(null);

    const result = await generateTimelapseVideoAction({
        metricName: selectedMetric,
        locationDescription,
        startDate: format(dateRange.from, "MMM dd, yyyy"),
        endDate: format(dateRange.to, "MMM dd, yyyy"),
    });

    setIsGeneratingVideo(false);

    if (result.error || !result.data) {
        toast({ title: t('dashboard.video.error.title'), description: result.error || t('dashboard.video.error.description'), variant: "destructive"});
    } else {
        setVideoUrl(result.data.videoDataUri);
    }
  }


  return (
    <>
    <Card className="glass-card border border-primary/10 shadow-xl hover:glow-border transition-all duration-300">
      <CardHeader className="pb-4 border-b border-emerald-950/15">
        <CardTitle className="text-xl font-bold tracking-tight">{t('dashboard.viz.title')}</CardTitle>
        <CardDescription className="text-slate-400 mt-1">{t('dashboard.viz.description')}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="time-series">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-primary/[0.03] border border-emerald-950/15 p-1">
            <TabsTrigger value="time-series" className="rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">{t('dashboard.viz.tabs.timeSeries')}</TabsTrigger>
            <TabsTrigger value="comparison" disabled={!groundTruthData} className="rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                {t('dashboard.viz.tabs.comparison')}
                {!groundTruthData && <span className="text-xs ml-2">({t('dashboard.viz.tabs.csvRequired')})</span>}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="time-series" className="mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <Button onClick={handleGenerateVideo} disabled={isGeneratingVideo} className="w-full sm:w-auto rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-300">
                    {isGeneratingVideo ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin text-primary-foreground" /> {t('dashboard.video.button.generating')}</>
                    ) : (
                        <><Video className="mr-2 h-4 w-4 text-primary-foreground" /> {t('dashboard.video.button.generate')}</>
                    )}
                </Button>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-full sm:w-[280px] rounded-xl border-emerald-950/20 bg-background/50 focus:ring-primary/20">
                        <SelectValue placeholder={t('dashboard.viz.selectPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-background/95 backdrop-blur-md border-emerald-950/20">
                        {metricNames.map(name => <SelectItem key={name} value={name} className="hover:bg-primary/10 rounded-lg">{name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            {combinedChartData && (
              <div className="h-[400px] w-full border border-emerald-950/10 rounded-2xl p-4 bg-background/30 backdrop-blur-sm shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={combinedChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorPrecip" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.01}/>
                      </linearGradient>
                      <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(16, 185, 129, 0.05)" />
                    <XAxis 
                        dataKey="date" 
                        tickFormatter={(str) => format(new Date(str), 'MMM yy')}
                        minTickGap={35}
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 11 }}
                    />
                    <YAxis yAxisId="left" domain={['auto', 'auto']} tickFormatter={(val) => typeof val === 'number' ? val.toFixed(2) : val} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => typeof val === 'number' ? val.toFixed(1) : val} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />

                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    
                    <Bar yAxisId="right" dataKey="precipitation" name={t('dashboard.weather.precipitation')} fill="url(#colorPrecip)" barSize={16} unit="mm" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="temperature" name={t('dashboard.weather.temperature')} stroke="hsl(var(--destructive))" strokeWidth={2.5} dot={false} unit="°C" />
                    <Area yAxisId="left" type="monotone" dataKey="value" name={selectedMetric} fill="url(#colorMetric)" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} connectNulls />
                    
                     <Brush 
                        dataKey="date" 
                        height={30} 
                        stroke="hsl(var(--primary))"
                        fill="rgba(16, 185, 129, 0.03)"
                        tickFormatter={(str) => format(new Date(str), 'MMM d')}
                        startIndex={brushStartIndex}
                        endIndex={brushEndIndex}
                        onChange={handleBrushChange}
                     />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>
          <TabsContent value="comparison" className="mt-6">
            <CardDescription className="text-center mb-4 text-slate-400">{t('dashboard.viz.comparisonDescription')}</CardDescription>
             <div className="h-[400px] w-full border border-emerald-950/10 rounded-2xl p-4 bg-background/30 backdrop-blur-sm shadow-inner">
                  <ResponsiveContainer width="100%" height="100%">
                     <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                        <CartesianGrid stroke="rgba(16, 185, 129, 0.08)" />
                        <XAxis type="number" dataKey="ground" name={t('dashboard.viz.groundTruth')} stroke="hsl(var(--muted-foreground))">
                           <Label value={t('dashboard.viz.groundTruth')} offset={-25} position="insideBottom" fill="hsl(var(--muted-foreground))" />
                        </XAxis>
                        <YAxis type="number" dataKey="satellite" name={t('dashboard.viz.satelliteValue')} stroke="hsl(var(--muted-foreground))">
                             <Label value={t('dashboard.viz.satelliteValue')} angle={-90} offset={-10} position="insideLeft" style={{ textAnchor: 'middle' }} fill="hsl(var(--muted-foreground))" />
                        </YAxis>
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Legend verticalAlign="top" height={36}/>
                        <Scatter name={t('dashboard.viz.comparisonLegend')} data={comparisonData} fill="hsl(var(--primary))" />
                     </ScatterChart>
                  </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

    <Dialog open={!!videoUrl} onOpenChange={(open) => !open && setVideoUrl(null)}>
        <DialogContent className="max-w-4xl rounded-2xl bg-background/95 backdrop-blur-xl border border-emerald-950/20 shadow-2xl">
            <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">{t('dashboard.video.modal.title', {metric: selectedMetric})}</DialogTitle>
            <DialogDescription className="text-slate-400">
                {t('dashboard.video.modal.description', {location: locationDescription})}
            </DialogDescription>
            </DialogHeader>
            <div className="aspect-video w-full bg-black rounded-xl overflow-hidden border border-emerald-950/20 shadow-inner">
                {videoUrl && (
                    <video controls autoPlay src={videoUrl} className="w-full h-full" />
                )}
            </div>
        </DialogContent>
    </Dialog>

    </>
  );
}
