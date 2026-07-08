
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { addDays, format, formatISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { InputPanel } from "@/components/input-panel";
import { SummaryCards } from "@/components/summary-cards";
import { MetricsTable } from "@/components/metrics-table";
import { Visualizations } from "@/components/visualizations";
import { WeatherReport } from "@/components/weather-report";
import { LandCoverAnalysis } from "@/components/land-cover-analysis";
import { useToast } from "@/hooks/use-toast";
import type { GroundTruthDataPoint, SatellitePassData, WeatherData, HistoryEntry, AnalysisResult } from "@/lib/types";
import { appendUserHistoryAction, listUserHistoryAction, predictSatellitePassAction, getWeatherReportAction, startMetricsComputationAction, getMetricsResultAction } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Map, AlertTriangle, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { Chatbot } from "./chatbot";
import { MonitoringCard } from "./monitoring-card";
import { ChangeInsightCard } from "./change-insight-card"; // New import
import { Progress } from "@/components/ui/progress"; // New import
import { GISDashboard } from "@/components/gis-dashboard";

type ComputationStatus = 'idle' | 'computing' | 'polling' | 'completed' | 'error';
const HISTORY_STORAGE_KEY = 'earth-insights.dashboard-history';

type StoredHistoryEntry = {
  id: string;
  lat: string;
  lon: string;
  locationDesc: string;
  timestamp: string;
  dateFrom?: string;
  dateTo?: string;
};

export function Dashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [lat, setLat] = useState("40.7128");
  const [lon, setLon] = useState("-74.0060");
  const [locationDesc, setLocationDesc] = useState("New York City");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -365),
    to: new Date(),
  });
  const [groundTruthData, setGroundTruthData] = useState<GroundTruthDataPoint[] | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [computationStatus, setComputationStatus] = useState<ComputationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState<string>("NDVI");
  const [nextPass, setNextPass] = useState<SatellitePassData | null>(null);
  const [isFetchingPass, setIsFetchingPass] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    void (async () => {
      const remoteHistory = await listUserHistoryAction(20);
      if (remoteHistory.data && remoteHistory.data.length > 0) {
        const restoredRemote = remoteHistory.data
          .filter((item) => item.kind === 'dashboard')
          .map((item) => {
            const payload = item.payload as Record<string, string | undefined>;
            return {
              id: item.id,
              lat: payload.lat || '0',
              lon: payload.lon || '0',
              locationDesc: payload.locationDesc || 'Unknown',
              timestamp: new Date(item.createdAt),
              dateRange: {
                from: payload.dateFrom ? new Date(payload.dateFrom) : undefined,
                to: payload.dateTo ? new Date(payload.dateTo) : undefined,
              },
            } as HistoryEntry;
          })
          .filter((entry) => !!entry.dateRange?.from && !!entry.dateRange?.to);

        setHistory(restoredRemote);
        return;
      }

      const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!raw) {
        return;
      }
      try {
        const parsed = JSON.parse(raw) as StoredHistoryEntry[];
        const restored: HistoryEntry[] = parsed.map((entry) => ({
          id: entry.id,
          lat: entry.lat,
          lon: entry.lon,
          locationDesc: entry.locationDesc,
          timestamp: new Date(entry.timestamp),
          dateRange: {
            from: entry.dateFrom ? new Date(entry.dateFrom) : undefined,
            to: entry.dateTo ? new Date(entry.dateTo) : undefined,
          },
        }));
        setHistory(restored.filter((entry) => !!entry.dateRange?.from && !!entry.dateRange?.to));
      } catch {
        window.localStorage.removeItem(HISTORY_STORAGE_KEY);
      }
    })();
  }, []);

  useEffect(() => {
    const serializable: StoredHistoryEntry[] = history.map((entry) => ({
      id: entry.id,
      lat: entry.lat,
      lon: entry.lon,
      locationDesc: entry.locationDesc,
      timestamp: entry.timestamp.toISOString(),
      dateFrom: entry.dateRange?.from?.toISOString(),
      dateTo: entry.dateRange?.to?.toISOString(),
    }));
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(serializable));
  }, [history]);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    };
  }, []);

  const pollForResults = useCallback(async (jobId: string, currentLat: string, currentLon: string, currentLocationDesc: string, currentDateRangeFrom: Date, currentDateRangeTo: Date) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);

    const pollStartTime = Date.now();
    const POLLING_TIMEOUT = 120000; // 2 minutes

    pollingTimeoutRef.current = setTimeout(() => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        setErrorState("Analysis is taking longer than expected. Please try again later.");
        setComputationStatus('error');
        toast({ title: "Polling Timeout", description: "Did not get a result within 2 minutes.", variant: "destructive" });
    }, POLLING_TIMEOUT);

    pollingIntervalRef.current = setInterval(async () => {
      const elapsedTime = Date.now() - pollStartTime;
      setProgress(Math.min(95, (elapsedTime / POLLING_TIMEOUT) * 100)); // Cap progress at 95% until completion

      const response = await getMetricsResultAction(
        jobId,
        parseFloat(currentLat),
        parseFloat(currentLon),
        currentLocationDesc,
        formatISO(currentDateRangeFrom, { representation: 'date' }),
        formatISO(currentDateRangeTo, { representation: 'date' })
      );

      if (response.data) {
        if (response.data.status === 'completed') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
          setProgress(100);
          setAnalysisResult(response.data.result || null);
          setComputationStatus('completed');
          toast({ title: t('dashboard.compute.success.title'), description: t('dashboard.compute.success.description') });
        } else if (response.data.status === 'error') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
          setErrorState(response.data.error || 'An unknown error occurred.');
          setComputationStatus('error');
          toast({ title: t('dashboard.error.compute.title'), description: response.data.error, variant: "destructive" });
        }
      } else if (response.error) {
         if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
         if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
         setErrorState(response.error);
         setComputationStatus('error');
      }
    }, 5000); // Poll every 5 seconds
  }, [toast, t]);


  const handleCompute = useCallback(async () => {
    if (!lat || !lon) {
      toast({ title: t('dashboard.error.invalidCoords.title'), description: t('dashboard.error.invalidCoords.description'), variant: "destructive" });
      return;
    }
    if (!dateRange || !dateRange.from || !dateRange.to) {
      toast({ title: t('dashboard.error.noDate.title'), description: t('dashboard.error.noDate.description'), variant: "destructive" });
      return;
    }

    setComputationStatus('computing');
    setProgress(5);
    setAnalysisResult(null);
    setErrorState(null);
    setNextPass(null);
    setWeather(null);
    
    const newHistoryEntry: HistoryEntry = { id: new Date().toISOString(), lat, lon, locationDesc, dateRange, timestamp: new Date() };
    setHistory(prev => [newHistoryEntry, ...prev.slice(0, 9)]);
    void appendUserHistoryAction('dashboard', {
      lat,
      lon,
      locationDesc,
      dateFrom: dateRange.from?.toISOString(),
      dateTo: dateRange.to?.toISOString(),
    });

    // Don't await ancillary data, let it fetch in the background
    setIsFetchingPass(true);
    predictSatellitePassAction({ latitude: parseFloat(lat), longitude: parseFloat(lon) })
      .then(res => setNextPass(res.data))
      .catch(err => console.error("Failed to fetch satellite pass:", err))
      .finally(() => setIsFetchingPass(false));

    setIsFetchingWeather(true);
    getWeatherReportAction({ latitude: parseFloat(lat), longitude: parseFloat(lon) })
      .then(res => setWeather(res.data))
      .catch(err => console.error("Failed to fetch weather report:", err))
      .finally(() => setIsFetchingWeather(false));
    
    setProgress(15);

    const result = await startMetricsComputationAction({
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        startDate: formatISO(dateRange.from, { representation: 'date' }),
        endDate: formatISO(dateRange.to, { representation: 'date' }),
    });

    if (result.error || !result.data) {
        setErrorState(result.error || t('dashboard.error.compute.description'));
        setComputationStatus('error');
        toast({ title: "Failed to Start Computation", description: result.error || t('dashboard.error.compute.description'), variant: "destructive" });
    } else {
        setComputationStatus('polling');
        setProgress(25);
        pollForResults(result.data.jobId, lat, lon, locationDesc, dateRange.from, dateRange.to);
    }

  }, [lat, lon, locationDesc, dateRange, toast, t, pollForResults]);
  
  const handleHistorySelect = (entry: HistoryEntry) => {
    setLat(entry.lat);
    setLon(entry.lon);
    setLocationDesc(entry.locationDesc);
    setDateRange(entry.dateRange);
    toast({ title: t('dashboard.history.toast.title'), description: t('dashboard.history.toast.description', { location: entry.locationDesc })});
  };
  
  const dateRangeString = dateRange?.from && dateRange?.to 
    ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
    : "N/A";
    
  const isProcessing = computationStatus === 'computing' || computationStatus === 'polling';

  const renderContent = () => {
      if (isProcessing) {
          const messages = {
              computing: "Connecting to satellite data stream...",
              polling: "Analyzing environmental metrics...",
          };
          return (
            <Card className="glass-card border border-primary/20 dark:border-primary/30 shadow-2xl bg-grid-pattern overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-premium pointer-events-none" />
                <CardContent className="pt-8 pb-8 relative z-10">
                    <div className="flex flex-col items-center justify-center min-h-[220px] gap-5">
                        <div className="relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/25 opacity-75" />
                            <div className="relative bg-primary/15 border border-primary/30 p-4 rounded-full text-primary">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        </div>
                        <p className="text-lg font-bold tracking-tight text-slate-100 animate-pulse">{messages[computationStatus]}</p>
                        <div className="w-3/4 max-w-md space-y-2">
                            <Progress value={progress} className="h-2.5 bg-primary/10 border border-primary/10" />
                            <p className="text-xs text-right text-muted-foreground font-mono font-semibold">{Math.round(progress)}%</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
          );
      }

      if (computationStatus === 'idle') {
          return (
              <Card className="glass-card border border-primary/20 dark:border-primary/30 shadow-2xl bg-grid-pattern relative overflow-hidden py-24 text-center">
                <div className="absolute inset-0 bg-gradient-premium pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
                <CardHeader className="relative z-10 max-w-xl mx-auto space-y-4">
                    <div className="mx-auto bg-primary/10 text-primary p-4 rounded-2xl w-fit border border-primary/25 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-pulse-slow">
                        <Map className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-400">
                        {t('dashboard.welcome.title')}
                    </CardTitle>
                    <CardDescription className="text-slate-300 text-sm sm:text-base leading-relaxed">
                        {t('dashboard.welcome.description')}
                    </CardDescription>
                </CardHeader>
              </Card>
          );
      }
      
       if (computationStatus === 'error') {
          return (
              <Card className="glass-card border border-destructive/25 dark:border-destructive/35 shadow-2xl relative overflow-hidden py-20 text-center bg-[radial-gradient(circle_at_center,_rgba(239,68,68,0.03)_0%,_transparent_60%)]">
                <CardHeader className="max-w-xl mx-auto space-y-4">
                    <div className="mx-auto bg-destructive/15 text-destructive p-4 rounded-2xl w-fit border border-destructive/30 animate-pulse">
                        <AlertTriangle className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                        {t('dashboard.error.compute.title')}
                    </CardTitle>
                    <CardDescription className="text-destructive font-medium border border-destructive/10 bg-destructive/5 px-4 py-2.5 rounded-xl text-sm leading-relaxed">
                        {errorState}
                    </CardDescription>
                </CardHeader>
              </Card>
          );
      }

      if (computationStatus === 'completed' && analysisResult) {
          return (
            <>
              {analysisResult.changeAnalysis && (
                <ChangeInsightCard changeAnalysis={analysisResult.changeAnalysis} />
              )}
              <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-4">
                <div className="xl:col-span-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <SummaryCards 
                    landCover={analysisResult.landCover}
                  />
                </div>
                <div className="xl:col-span-1 grid gap-6">
                     <WeatherReport 
                        weather={weather} 
                        isLoading={isFetchingWeather} 
                        showForecast={false}
                    />
                     <MonitoringCard nextPass={nextPass} isLoading={isFetchingPass} />
                </div>
              </div>
    
              <LandCoverAnalysis landCover={analysisResult.landCover} />

              <GISDashboard analysisResult={analysisResult} locationLabel={locationDesc} />
    
              <MetricsTable 
                analysisResult={analysisResult} 
                location={`${lat}, ${lon}`}
                dateRange={dateRangeString}
              />
    
              <Visualizations
                analysisResult={analysisResult}
                groundTruthData={groundTruthData}
                selectedMetric={selectedMetric}
                setSelectedMetric={setSelectedMetric}
                locationDescription={locationDesc}
                dateRange={dateRange}
              />
            </>
          )
      }
      
      return null;
  }

  return (
    <div className="container mx-auto p-2 sm:p-4 space-y-6">
      <InputPanel
        lat={lat}
        setLat={setLat}
        lon={lon}
        setLon={setLon}
        locationDesc={locationDesc}
        setLocationDesc={setLocationDesc}
        dateRange={dateRange}
        setDateRange={setDateRange}
        onCompute={handleCompute}
        isComputing={isProcessing}
        onFileUpload={setGroundTruthData}
        history={history}
        onHistorySelect={handleHistorySelect}
      />

      {renderContent()}
      
      <Chatbot lat={lat} lon={lon} />
    </div>
  );
}


    