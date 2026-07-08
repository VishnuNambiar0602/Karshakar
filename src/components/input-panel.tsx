
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar as CalendarIcon, Upload, Wand2, Cpu, Loader2, History, Wheat } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { parseCsv } from "@/lib/csv";
import { suggestCoordinatesAction } from "@/lib/actions";
import type { GroundTruthDataPoint, HistoryEntry } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";
import { useLanguage } from "@/hooks/use-language";

interface InputPanelProps {
  lat: string;
  setLat: (val: string) => void;
  lon: string;
  setLon: (val: string) => void;
  locationDesc: string;
  setLocationDesc: (val: string) => void;
  dateRange?: DateRange;
  setDateRange: (range?: DateRange) => void;
  onCompute: () => void;
  isComputing: boolean;
  onFileUpload: (data: GroundTruthDataPoint[] | null) => void;
  history: HistoryEntry[];
  onHistorySelect: (entry: HistoryEntry) => void;
}

export function InputPanel({
  lat, setLat, lon, setLon, locationDesc, setLocationDesc,
  dateRange, setDateRange, onCompute, isComputing, onFileUpload,
  history, onHistorySelect
}: InputPanelProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [fileName, setFileName] =useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const parsedData = parseCsv(text, t);
        if ('error' in parsedData) {
          toast({ title: t('dashboard.csv.error.title'), description: parsedData.error, variant: "destructive" });
          onFileUpload(null);
        } else {
          toast({ title: t('dashboard.csv.success.title'), description: t('dashboard.csv.success.description', { count: parsedData.length }) });
          onFileUpload(parsedData);
        }
      };
      reader.readAsText(file);
    } else {
        setFileName("");
        onFileUpload(null);
    }
  };

  const handleSuggestCoordinates = async () => {
    if (!locationDesc) {
      toast({ title: t('predict.error.noLocation.title'), description: t('predict.error.noLocation.description'), variant: "destructive" });
      return;
    }
    setIsSuggesting(true);
    const result = await suggestCoordinatesAction(locationDesc);
    if (result.error) {
      toast({ title: t('predict.error.aiError.title'), description: result.error, variant: "destructive" });
    } else if (result.data) {
      setLat(result.data.latitude.toFixed(4));
      setLon(result.data.longitude.toFixed(4));
      toast({ title: t('predict.coordinatesSuggested.title'), description: `${t('predict.coordinatesSuggested.confidence')}: ${(result.data.confidence * 100).toFixed(0)}%` });
    }
    setIsSuggesting(false);
  };

  return (
    <Card className="glass-card border border-primary/15 dark:border-primary/25 shadow-xl hover:glow-border transition-all duration-300 bg-grid-pattern">
      <CardHeader className="pb-4 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/25 text-primary">
            <Wheat className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight">{t('dashboard.input.title')}</CardTitle>
            <CardDescription className="text-slate-400 mt-0.5">
              {t('dashboard.input.description')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2 col-span-1 md:col-span-2">
             <Label htmlFor="location-desc" className="text-sm font-semibold text-slate-300">{t('dashboard.input.locationDesc')}</Label>
             <div className="flex gap-2">
               <Input
                 id="location-desc"
                 placeholder={t('dashboard.input.locationDescPlaceholder')}
                 value={locationDesc}
                 onChange={(e) => setLocationDesc(e.target.value)}
                 disabled={isSuggesting}
                 className="rounded-xl border-emerald-950/20 bg-background/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
               />
               <Button 
                 onClick={handleSuggestCoordinates} 
                 disabled={isSuggesting || !locationDesc} 
                 size="icon" 
                 className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:scale-105 active:scale-95 transition-all duration-200 shrink-0"
               >
                 {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                 <span className="sr-only">{t('predict.suggestCoordinates')}</span>
               </Button>
             </div>
           </div>
           <div className="space-y-2">
             <Label htmlFor="latitude" className="text-sm font-semibold text-slate-300">{t('predict.latitude')}</Label>
             <Input id="latitude" placeholder="e.g., 40.7128" value={lat} onChange={(e) => setLat(e.target.value)} className="rounded-xl border-emerald-950/20 bg-background/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300" />
           </div>
           <div className="space-y-2">
             <Label htmlFor="longitude" className="text-sm font-semibold text-slate-300">{t('predict.longitude')}</Label>
             <Input id="longitude" placeholder="e.g., -74.0060" value={lon} onChange={(e) => setLon(e.target.value)} className="rounded-xl border-emerald-950/20 bg-background/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300" />
           </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-300">{t('dashboard.input.dateRange')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-xl border-emerald-950/20 bg-background/50 focus:ring-primary/20 transition-all duration-300",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>{t('dashboard.input.pickDate')}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl bg-background/95 backdrop-blur-xl border border-emerald-950/20 shadow-2xl" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  initialFocus
                  className="rounded-2xl"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="csv-upload" className="text-sm font-semibold text-slate-300">{t('dashboard.input.groundTruth')}</Label>
            <Button asChild variant="outline" className="w-full justify-start text-left font-normal rounded-xl border-emerald-950/20 bg-background/50 hover:bg-primary/5 transition-all duration-300">
                <Label htmlFor="csv-upload" className="w-full cursor-pointer flex items-center">
                    <Upload className="mr-2 h-4 w-4 text-primary" />
                    <span className="truncate text-slate-200">{fileName || t('dashboard.input.uploadFile')}</span>
                </Label>
            </Button>
            <Input id="csv-upload" type="file" accept=".csv" className="sr-only" onChange={handleFileChange} />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-primary/10">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" disabled={history.length === 0} className="w-full sm:w-auto rounded-xl border-emerald-950/20 hover:bg-primary/5 hover:text-primary transition-all duration-200">
                  <History className="mr-2 h-4 w-4 text-primary" /> {t('dashboard.history.button')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-2xl bg-background/95 backdrop-blur-xl border-emerald-950/20 shadow-2xl">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-bold leading-none">{t('dashboard.history.title')}</h4>
                    <p className="text-sm text-slate-400">
                      {t('dashboard.history.description')}
                    </p>
                  </div>
                  <ScrollArea className="h-64">
                    {history.length > 0 ? (
                      <div className="grid gap-2">
                        {history.map((entry) => (
                           <div
                             key={entry.id}
                             onClick={() => onHistorySelect(entry)}
                             className="text-sm p-3 hover:bg-primary/10 rounded-xl cursor-pointer transition-colors duration-200 border border-transparent hover:border-primary/10"
                           >
                            <p className="font-bold truncate text-foreground">{entry.locationDesc || `${entry.lat}, ${entry.lon}`}</p>
                             <p className="text-xs text-slate-400 mt-1">
                               {format(entry.timestamp, "PPP p")}
                             </p>
                           </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 text-center py-4">{t('dashboard.history.empty')}</p>
                    )}
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex gap-2.5 w-full sm:w-auto">
                <Button variant="secondary" asChild className="flex-1 sm:flex-initial rounded-xl border border-emerald-500/10 bg-slate-900/40 hover:bg-slate-900/80 text-white font-semibold transition-all duration-200">
                    <Link href={`/crop-advisor?lat=${lat}&lon=${lon}`}>
                        <Wheat className="mr-2 h-4 w-4 text-primary animate-pulse" />
                        {t('dashboard.input.cropAdvisor')}
                    </Link>
                </Button>
                <Button onClick={onCompute} disabled={isComputing} className="flex-1 sm:flex-initial rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-md hover:scale-105 active:scale-95 transition-all duration-200">
                {isComputing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Cpu className="mr-2 h-4 w-4" />
                )}
                {t('dashboard.input.compute')}
                </Button>
            </div>
          </div>
      </CardContent>
    </Card>
  );
}
