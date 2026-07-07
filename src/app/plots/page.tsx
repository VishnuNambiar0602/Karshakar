'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { KisanGlobe3D, GlobePlot } from '@/components/kisan-globe-3d';
import {
  getFarmerProfileAction,
  getPlotsAction,
  addPlotAction,
  deletePlotAction,
  suggestCoordinatesAction,
  getAlertsAction,
} from '@/lib/actions';
import { Sprout, Plus, Trash2, Globe2, Loader2, MapPin, Wand2, Calendar } from 'lucide-react';

import { CROPS } from '@/lib/constants';

export default function PlotsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false);
  const [plots, setPlots] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [locationName, setLocationName] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    latitude: 30.9009,
    longitude: 75.8573,
    area: 2.5,
    cropType: 'Wheat',
    sowingDate: new Date().toISOString().split('T')[0],
    status: 'Growing' as 'Growing' | 'Harvested' | 'Fallow',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plotsRes, alertsRes] = await Promise.all([getPlotsAction(), getAlertsAction()]);
      setPlots(plotsRes.data || []);
      setAlerts(alertsRes.data || []);
    } catch (e) {
      toast({
        title: 'Error loading data',
        description: String(e),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Check if profile exists, otherwise onboarding is required
    getFarmerProfileAction().then(res => {
      if (!res.data) {
        toast({
          title: 'Profile Required',
          description: 'Please complete onboarding first.',
          variant: 'destructive',
        });
        router.push('/onboarding');
      } else {
        setProfileChecked(true);
        loadData();
      }
    });
  }, [router, toast, loadData]);

  const handleSuggestCoords = async () => {
    if (!locationName.trim()) return;
    setSuggesting(true);
    const res = await suggestCoordinatesAction(locationName);
    setSuggesting(false);

    if (res.error) {
      toast({
        title: 'Search Failed',
        description: res.error,
        variant: 'destructive',
      });
    } else {
      const coords = res.data;
      if (coords) {
        setForm(prev => ({
          ...prev,
          latitude: parseFloat(coords.latitude.toFixed(4)),
          longitude: parseFloat(coords.longitude.toFixed(4)),
        }));
        toast({
          title: 'Coordinates Found',
          description: `Located: ${locationName} (Confidence: ${(coords.confidence * 100).toFixed(0)}%)`,
        });
      }
    }
  };

  const handleAddPlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    const res = await addPlotAction(form);
    setAdding(false);

    if (res.error) {
      toast({
        title: 'Failed to Add Plot',
        description: res.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Plot Added',
        description: `Plot "${form.name}" has been registered.`,
      });
      setShowAddForm(false);
      setForm(prev => ({
        ...prev,
        name: '',
        latitude: Number((prev.latitude + (Math.random() - 0.5) * 0.05).toFixed(4)),
        longitude: Number((prev.longitude + (Math.random() - 0.5) * 0.05).toFixed(4)),
      }));
      loadData();
    }
  };

  const handleDeletePlot = async (id: string) => {
    const res = await deletePlotAction(id);
    if (res.error) {
      toast({
        title: 'Delete Failed',
        description: res.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Plot Deleted',
        description: 'Plot successfully removed.',
      });
      if (selectedPlotId === id) setSelectedPlotId(null);
      loadData();
    }
  };

  // Prepare plot data for the 3D globe including active severity warnings
  const globePlots: GlobePlot[] = plots.map(p => {
    const activeAlerts = alerts.filter(a => a.plotId === p.id && !a.resolved);
    let severity: GlobePlot['severity'] = 'none';
    if (activeAlerts.some(a => a.severity === 'high')) severity = 'high';
    else if (activeAlerts.some(a => a.severity === 'medium')) severity = 'medium';
    else if (activeAlerts.some(a => a.severity === 'low')) severity = 'low';

    return {
      id: p.id,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      cropType: p.cropType,
      severity,
    };
  });

  if (!profileChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex justify-between items-center border-b border-emerald-500/10 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
              <Sprout className="h-7 w-7 text-emerald-500" />
              Manage Land Plots
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add your crop fields to query local environmental metrics and satellite health reports.
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {showAddForm ? 'Cancel' : <><Plus className="h-4 w-4 mr-1.5" /> Register Plot</>}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: 3D Map Globe (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <Card className="overflow-hidden border-emerald-500/10 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Globe2 className="h-5 w-5 text-emerald-500" />
                  3D Satellite Plot Tracker
                </CardTitle>
                <CardDescription>
                  Revolves automatically. Click glowing plot nodes to view crop coordinates.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                <KisanGlobe3D
                  plots={globePlots}
                  selectedPlotId={selectedPlotId}
                  onSelectPlot={plot => {
                    setSelectedPlotId(plot.id);
                    toast({
                      title: `Selected Plot: ${plot.name}`,
                      description: `Latitude: ${plot.latitude} | Longitude: ${plot.longitude}`,
                    });
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Add Form / Plot List (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {showAddForm && (
              <Card className="border-emerald-500/10 shadow-lg bg-emerald-500/[0.01]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Add New Land Plot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address-lookup">Lookup Location Name (Optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="address-lookup"
                        placeholder="e.g. Ludhiana Punjab"
                        value={locationName}
                        onChange={e => setLocationName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSuggestCoords()}
                      />
                      <Button type="button" size="icon" onClick={handleSuggestCoords} disabled={suggesting || !locationName}>
                        {suggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <form onSubmit={handleAddPlot} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="plot-name">Plot Name</Label>
                      <Input
                        id="plot-name"
                        placeholder="e.g. Rice field A"
                        value={form.name}
                        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="0.0001"
                          value={form.latitude}
                          onChange={e => setForm(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="0.0001"
                          value={form.longitude}
                          onChange={e => setForm(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="area">Area (Acres)</Label>
                        <Input
                          id="area"
                          type="number"
                          step="0.1"
                          value={form.area}
                          onChange={e => setForm(prev => ({ ...prev, area: parseFloat(e.target.value) }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cropType">Crop Type</Label>
                        <Select
                          value={form.cropType}
                          onValueChange={val => setForm(prev => ({ ...prev, cropType: val }))}
                        >
                          <SelectTrigger id="cropType">
                            <SelectValue placeholder="Crop type" />
                          </SelectTrigger>
                          <SelectContent>
                            {CROPS.map(c => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="sowingDate">Sowing Date</Label>
                        <Input
                          id="sowingDate"
                          type="date"
                          value={form.sowingDate}
                          onChange={e => setForm(prev => ({ ...prev, sowingDate: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={form.status}
                          onValueChange={val => setForm(prev => ({ ...prev, status: val as any }))}
                        >
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Growing">Growing</SelectItem>
                            <SelectItem value="Harvested">Harvested</SelectItem>
                            <SelectItem value="Fallow">Fallow</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button type="submit" disabled={adding} className="w-full bg-emerald-600 hover:bg-emerald-700">
                      {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Register Land Plot
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card className="border-emerald-500/10 shadow-lg flex-1 overflow-auto max-h-[550px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">Registered Plots</CardTitle>
                <CardDescription>Select a plot to see coordinate details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  </div>
                ) : plots.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-emerald-500/10 rounded-xl bg-emerald-500/[0.01]">
                    <Sprout className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">No plots registered yet.</p>
                  </div>
                ) : (
                  plots.map(p => {
                    const isSelected = selectedPlotId === p.id;
                    const activePlotAlerts = alerts.filter(a => a.plotId === p.id && !a.resolved);
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlotId(p.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                            : 'hover:bg-muted/50 border-emerald-500/5'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base">{p.name}</h4>
                              <Badge variant={p.status === 'Growing' ? 'default' : 'secondary'}>
                                {p.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {p.cropType} • {p.area} Acres
                            </p>
                            <div className="text-[11px] text-muted-foreground font-mono flex gap-3 pt-1">
                              <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3 text-emerald-500" /> {p.latitude.toFixed(4)}°</span>
                              <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3 text-emerald-500" /> {p.sowingDate}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePlot(p.id);
                            }}
                            className="text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {activePlotAlerts.length > 0 && (
                          <div className="mt-3 flex gap-2">
                            {activePlotAlerts.map(alert => (
                              <Badge
                                key={alert.id}
                                variant="destructive"
                                className={`text-[10px] uppercase font-mono px-2 py-0.5 ${
                                  alert.severity === 'high'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-amber-500 text-white'
                                }`}
                              >
                                {alert.type}: {alert.severity}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
