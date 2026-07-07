'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { KisanGlobe3D, GlobePlot } from '@/components/kisan-globe-3d';
import {
  getFarmerProfileAction,
  saveFarmerProfileAction,
  getPlotsAction,
  addPlotAction,
  deletePlotAction,
  getAlertsAction,
  resolveAlertAction,
  runAlertChecksAction,
  detectPestDiseaseAction,
  getMandiPricesAction,
} from '@/lib/actions';
import {
  Sprout,
  Plus,
  Trash2,
  Camera,
  Upload,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  BellRing,
  Check,
  RefreshCw,
  User,
  MapPin,
  Globe2,
  Loader2,
  Activity,
  ShieldAlert,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface LocalFarmerProfile {
  name: string;
  phone: string;
  state: string;
  district: string;
  preferredLanguage: string;
}

interface LocalPlot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  area: number;
  cropType: string;
  sowingDate: string;
  status: 'Growing' | 'Harvested' | 'Fallow';
}

interface LocalAlert {
  id: string;
  plotId: string;
  plotName: string;
  type: 'weather' | 'soil' | 'pest' | 'irrigation' | 'mandi';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  resolved: boolean;
}

interface LocalMandiPrice {
  mandiName: string;
  state: string;
  district: string;
  crop: string;
  variety: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  date: string;
}

interface AIDiagnosis {
  detectedIssue: string;
  confidence: number;
  category: 'pest' | 'disease' | 'nutrient_deficiency' | 'none';
  description: string;
  organicControl: string;
  chemicalControl: string;
  prevention: string;
}

import { STATES_AND_DISTRICTS, CROPS } from '@/lib/constants';

export default function FarmerPortalPage() {
  const { toast } = useToast();

  // State
  const [profile, setProfile] = useState<LocalFarmerProfile>({
    name: '',
    phone: '',
    state: 'Punjab',
    district: 'Ludhiana',
    preferredLanguage: 'en',
  });
  const [plots, setPlots] = useState<LocalPlot[]>([]);
  const [alerts, setAlerts] = useState<LocalAlert[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);

  // Mandi Prices State
  const [selectedMandiCrop, setSelectedMandiCrop] = useState<string>('Wheat');
  const [mandiPrices, setMandiPrices] = useState<LocalMandiPrice[]>([]);
  const [mandiLoading, setMandiLoading] = useState(false);

  // AI Pest Diagnostic State
  const [leafImage, setLeafImage] = useState<string | null>(null);
  const [selectedDiagnosticCrop, setSelectedDiagnosticCrop] = useState<string>('Rice');
  const [diagnosticLanguage, setDiagnosticLanguage] = useState<string>('en');
  const [aiLoading, setAiLoading] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<AIDiagnosis | null>(null);

  // Form State for Adding Plots
  const [showAddPlot, setShowAddPlot] = useState(false);
  const [newPlot, setNewPlot] = useState({
    name: '',
    latitude: 30.9009,
    longitude: 75.8573,
    area: 2.5,
    cropType: 'Wheat',
    sowingDate: new Date().toISOString().split('T')[0],
    status: 'Growing' as 'Growing' | 'Harvested' | 'Fallow',
  });

  // Load States
  const [profileLoading, setProfileLoading] = useState(true);
  const [plotsLoading, setPlotsLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertEngineRunning, setAlertEngineRunning] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchProfile();
    fetchPlots();
    fetchAlerts();
  }, []);

  // Sync Mandi Crop Change
  useEffect(() => {
    fetchMandiPrices(selectedMandiCrop);
  }, [selectedMandiCrop]);

  const fetchProfile = async () => {
    setProfileLoading(true);
    const res = await getFarmerProfileAction();
    if (res.data) {
      setProfile({
        name: res.data.name || '',
        phone: res.data.phone || '',
        state: res.data.state || 'Punjab',
        district: res.data.district || 'Ludhiana',
        preferredLanguage: res.data.preferredLanguage || 'en',
      });
    }
    setProfileLoading(false);
  };

  const fetchPlots = async () => {
    setPlotsLoading(true);
    const res = await getPlotsAction();
    if (res.data) {
      setPlots(
        res.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          latitude: p.latitude,
          longitude: p.longitude,
          area: p.area,
          cropType: p.cropType,
          sowingDate: p.sowingDate,
          status: p.status,
        }))
      );
    }
    setPlotsLoading(false);
  };

  const fetchAlerts = async () => {
    setAlertsLoading(true);
    const res = await getAlertsAction();
    if (res.data) {
      setAlerts(
        res.data.map((a: any) => ({
          id: a.id,
          plotId: a.plotId,
          plotName: a.plotName,
          type: a.type,
          title: a.title,
          message: a.message,
          severity: a.severity,
          createdAt: a.createdAt,
          resolved: a.resolved,
        }))
      );
    }
    setAlertsLoading(false);
  };

  const fetchMandiPrices = async (crop: string) => {
    setMandiLoading(true);
    const res = await getMandiPricesAction(crop);
    if (res.data) {
      setMandiPrices(res.data);
    }
    setMandiLoading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveFarmerProfileAction(profile);
    if (res.error) {
      toast({
        title: 'Profile Save Failed',
        description: res.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile Saved',
        description: 'Your contact profile and alert preferences have been registered.',
      });
    }
  };

  const handleAddPlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await addPlotAction(newPlot);
    if (res.error) {
      toast({
        title: 'Error Registering Plot',
        description: res.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Plot Registered',
        description: `Plot "${newPlot.name}" successfully registered at lat: ${newPlot.latitude}, lng: ${newPlot.longitude}`,
      });
      setShowAddPlot(false);
      fetchPlots();
      // Reset form coordinates to generic center or offset
      setNewPlot(prev => ({
        ...prev,
        name: '',
        latitude: Number((prev.latitude + (Math.random() - 0.5) * 0.05).toFixed(4)),
        longitude: Number((prev.longitude + (Math.random() - 0.5) * 0.05).toFixed(4)),
      }));
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
        title: 'Plot Removed',
        description: 'The farm plot has been deleted from your profile.',
      });
      if (selectedPlotId === id) setSelectedPlotId(null);
      fetchPlots();
    }
  };

  const handleResolveAlert = async (id: string) => {
    const res = await resolveAlertAction(id);
    if (res.data) {
      toast({
        title: 'Alert Resolved',
        description: 'Alert marked as resolved.',
      });
      fetchAlerts();
    }
  };

  const handleRunAlertChecks = async () => {
    setAlertEngineRunning(true);
    toast({
      title: 'Alert Engine Triggered',
      description: 'Fetching real-time satellite data and checking moisture levels...',
    });
    const res = await runAlertChecksAction();
    setAlertEngineRunning(false);
    if (res.error) {
      toast({
        title: 'Alert Checks Failed',
        description: res.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Alert Analysis Complete',
        description: `Checked all plots. Generated ${res.data?.alertsCreated || 0} alert entries and dispatched notifications.`,
      });
      fetchAlerts();
    }
  };

  // Convert uploaded image to base64
  const handleLeafImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLeafImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeLeaf = async () => {
    if (!leafImage) return;
    setAiLoading(true);
    setDiagnosisResult(null);

    // Get clean base64 format without data prefix
    let cleanBase64 = leafImage;
    let mimeType = 'image/jpeg';
    if (leafImage.startsWith('data:')) {
      const parts = leafImage.split(';base64,');
      mimeType = parts[0].split(':')[1];
      cleanBase64 = parts[1];
    }

    const res = await detectPestDiseaseAction({
      imageBase64: cleanBase64,
      imageMimeType: mimeType,
      cropContext: selectedDiagnosticCrop,
      language: diagnosticLanguage,
    });

    setAiLoading(false);
    if (res.error) {
      toast({
        title: 'AI Diagnostic Failed',
        description: res.error,
        variant: 'destructive',
      });
    } else if (res.data) {
      setDiagnosisResult(res.data as AIDiagnosis);
      toast({
        title: 'Diagnostic Complete',
        description: `Issue identified: ${res.data.detectedIssue}`,
      });
    }
  };

  // Prepares plots for the 3D globe including alert severity statuses
  const globePlots: GlobePlot[] = plots.map(p => {
    const activeAlerts = alerts.filter(a => a.plotId === p.id && !a.resolved);
    let severity: GlobePlot['severity'] = 'none';
    if (activeAlerts.some(a => a.severity === 'high')) {
      severity = 'high';
    } else if (activeAlerts.some(a => a.severity === 'medium')) {
      severity = 'medium';
    } else if (activeAlerts.some(a => a.severity === 'low')) {
      severity = 'low';
    }

    return {
      id: p.id,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      cropType: p.cropType,
      severity,
    };
  });

  const activeAlertsList = alerts.filter(a => !a.resolved);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Sprout className="h-8 w-8 text-emerald-500" />
              Smart Farmer Advisory Portal
            </h1>
            <p className="text-muted-foreground mt-1">
              Automated weather monitoring, soil moisture tracking, mandi prices, and AI pest diagnostics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRunAlertChecks}
              disabled={alertEngineRunning}
              className="border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5"
            >
              {alertEngineRunning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Scan Soil & Weather Conditions
            </Button>
          </div>
        </div>

        {/* Top Section: 3D Globe Map + Registered Plots */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 3D Satellite Map Globe - 7cols */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <Card className="overflow-hidden border-emerald-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Globe2 className="h-5 w-5 text-emerald-500" />
                  3D Satellite Plot Tracker
                </CardTitle>
                <CardDescription>
                  Interactive virtual globe. Displays agricultural plot locations and satellite pathways. Hover for info, click plot to select.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                <KisanGlobe3D
                  plots={globePlots}
                  selectedPlotId={selectedPlotId}
                  onSelectPlot={plot => {
                    setSelectedPlotId(plot.id);
                    toast({
                      title: `Plot Focused: ${plot.name}`,
                      description: `Latitude: ${plot.latitude} | Longitude: ${plot.longitude}`,
                    });
                  }}
                />
              </CardContent>
            </Card>

            {/* Profile Setup Form */}
            <Card className="border-emerald-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <User className="h-5 w-5 text-emerald-500" />
                  Farmer Profile & Notification Preferences
                </CardTitle>
                <CardDescription>
                  Save details to receive instant weather warning and low soil moisture updates on SMS/WhatsApp.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profileLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="farmer-name">Farmer Name</Label>
                        <Input
                          id="farmer-name"
                          placeholder="e.g. Gurpreet Singh"
                          value={profile.name}
                          onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="farmer-phone">Mobile Phone (with country code)</Label>
                        <Input
                          id="farmer-phone"
                          placeholder="e.g. +919876543210"
                          value={profile.phone}
                          onChange={e => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="farmer-state">State</Label>
                        <Select
                          value={profile.state}
                          onValueChange={val =>
                            setProfile(prev => ({
                              ...prev,
                              state: val,
                              district: STATES_AND_DISTRICTS[val]?.[0] || '',
                            }))
                          }
                        >
                          <SelectTrigger id="farmer-state">
                            <SelectValue placeholder="Select State" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(STATES_AND_DISTRICTS).map(st => (
                              <SelectItem key={st} value={st}>
                                {st}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="farmer-district">District</Label>
                        <Select
                          value={profile.district}
                          onValueChange={val => setProfile(prev => ({ ...prev, district: val }))}
                        >
                          <SelectTrigger id="farmer-district">
                            <SelectValue placeholder="Select District" />
                          </SelectTrigger>
                          <SelectContent>
                            {(STATES_AND_DISTRICTS[profile.state] || []).map(dt => (
                              <SelectItem key={dt} value={dt}>
                                {dt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="preferred-lang">Advisory Language</Label>
                        <Select
                          value={profile.preferredLanguage}
                          onValueChange={val => setProfile(prev => ({ ...prev, preferredLanguage: val }))}
                        >
                          <SelectTrigger id="preferred-lang">
                            <SelectValue placeholder="Preferred Language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                            <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                            <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                            <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                            <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                            <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
                            <SelectItem value="kn">ಕನ್ನಡ (Kannada)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Save Profile & Enable Notifications
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Plot Registry - 5cols */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <Card className="border-emerald-500/10 flex-1 flex flex-col">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-500" />
                    My Farm Plots
                  </CardTitle>
                  <CardDescription>Register and monitor plots.</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowAddPlot(!showAddPlot)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {showAddPlot ? 'Cancel' : <><Plus className="h-4 w-4 mr-1" /> Add Plot</>}
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto max-h-[500px]">
                {showAddPlot && (
                  <form onSubmit={handleAddPlot} className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 mb-4 space-y-4">
                    <h3 className="font-bold text-sm text-emerald-800 dark:text-emerald-400">Register New Land Plot</h3>
                    <div className="space-y-2">
                      <Label htmlFor="plot-name">Plot Name</Label>
                      <Input
                        id="plot-name"
                        placeholder="e.g. North Wheatfield"
                        value={newPlot.name}
                        onChange={e => setNewPlot(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="plot-lat">Latitude</Label>
                        <Input
                          id="plot-lat"
                          type="number"
                          step="0.0001"
                          value={newPlot.latitude}
                          onChange={e => setNewPlot(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plot-lon">Longitude</Label>
                        <Input
                          id="plot-lon"
                          type="number"
                          step="0.0001"
                          value={newPlot.longitude}
                          onChange={e => setNewPlot(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="plot-area">Area (Acres)</Label>
                        <Input
                          id="plot-area"
                          type="number"
                          step="0.1"
                          value={newPlot.area}
                          onChange={e => setNewPlot(prev => ({ ...prev, area: parseFloat(e.target.value) }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plot-crop">Crop Type</Label>
                        <Select
                          value={newPlot.cropType}
                          onValueChange={val => setNewPlot(prev => ({ ...prev, cropType: val }))}
                        >
                          <SelectTrigger id="plot-crop">
                            <SelectValue placeholder="Select Crop" />
                          </SelectTrigger>
                          <SelectContent>
                            {CROPS.map(cr => (
                              <SelectItem key={cr} value={cr}>
                                {cr}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="plot-sowing">Sowing Date</Label>
                        <Input
                          id="plot-sowing"
                          type="date"
                          value={newPlot.sowingDate}
                          onChange={e => setNewPlot(prev => ({ ...prev, sowingDate: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plot-status">Status</Label>
                        <Select
                          value={newPlot.status}
                          onValueChange={val =>
                            setNewPlot(prev => ({ ...prev, status: val as any }))
                          }
                        >
                          <SelectTrigger id="plot-status">
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
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Register Land Plot
                    </Button>
                  </form>
                )}

                {plotsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  </div>
                ) : plots.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-emerald-500/10 rounded-xl bg-emerald-500/[0.01]">
                    <Sprout className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-55" />
                    <p className="text-sm text-muted-foreground">No plots registered yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Add a land plot to configure automatic alerts.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {plots.map(p => {
                      const activePlotAlerts = alerts.filter(a => a.plotId === p.id && !a.resolved);
                      const isSelected = selectedPlotId === p.id;
                      
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPlotId(p.id)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                            isSelected
                              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-md'
                              : 'hover:bg-muted/50 border-emerald-500/5'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-base">{p.name}</h4>
                                <Badge variant={p.status === 'Growing' ? 'default' : 'secondary'}>
                                  {p.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {p.cropType} • {p.area} Acres • Sown: {p.sowingDate}
                              </p>
                              <div className="text-[11px] text-muted-foreground mt-2 font-mono flex items-center gap-3">
                                <span>Lat: {p.latitude.toFixed(4)}°</span>
                                <span>Lng: {p.longitude.toFixed(4)}°</span>
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
                          
                          {/* Alert indicators */}
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
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section 2: Alerts Center */}
        <Card className="border-emerald-500/10">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Bell className="h-5 w-5 text-emerald-500" />
                Active Farm Alerts ({activeAlertsList.length})
              </CardTitle>
              <CardDescription>
                Satellite, Soil Moisture & Meteorological alerts detected by the Kisan threshold engine.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            ) : activeAlertsList.length === 0 ? (
              <div className="text-center py-8 bg-emerald-500/5 border border-dashed border-emerald-500/10 rounded-xl">
                <Check className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-emerald-800 dark:text-emerald-400">All plots are healthy!</p>
                <p className="text-xs text-muted-foreground mt-1">No alerts active. Click &quot;Scan Soil &amp; Weather Conditions&quot; to refresh.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlertsList.map(a => (
                  <div
                    key={a.id}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                      a.severity === 'high'
                        ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-amber-500/5 border-amber-500/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {a.severity === 'high' ? (
                          <ShieldAlert className="h-5 w-5 text-red-500 animate-pulse" />
                        ) : (
                          <BellRing className="h-5 w-5 text-amber-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-sm md:text-base text-foreground">
                            {a.title}
                          </h4>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            Plot: {a.plotName}
                          </Badge>
                          <Badge
                            className={`text-[10px] uppercase font-mono px-1.5 py-0.2 ${
                              a.severity === 'high'
                                ? 'bg-red-600 text-white'
                                : 'bg-amber-600 text-white'
                            }`}
                          >
                            {a.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleResolveAlert(a.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white self-end md:self-auto shrink-0 size-sm text-xs"
                      size="sm"
                    >
                      Resolve & Clear Alert
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Diagnostic Camera + Mandi price tabs */}
        <Tabs defaultValue="pest" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted mb-6">
            <TabsTrigger value="pest" className="flex items-center gap-2">
              <Camera className="h-4 w-4" /> AI Pest Scanner
            </TabsTrigger>
            <TabsTrigger value="mandi" className="flex items-center gap-2">
              <Coins className="h-4 w-4" /> Mandi Rates
            </TabsTrigger>
          </TabsList>

          {/* AI Leaf Diagnostic Camera Tab */}
          <TabsContent value="pest" className="space-y-4">
            <Card className="border-emerald-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Sparkles className="h-5 w-5 text-emerald-500 animate-pulse" />
                  AI Plant Pathology Leaf Scanner
                </CardTitle>
                <CardDescription>
                  Upload an image of your crop leaf to identify pest infestations, diseases, or nutritional deficiencies using Gemini Vision.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* File Upload / Image area - 5cols */}
                  <div className="md:col-span-5 flex flex-col gap-4">
                    <Label className="text-sm font-semibold">Step 1: Upload leaf photograph</Label>
                    <div className="border-2 border-dashed border-emerald-500/10 rounded-2xl flex flex-col items-center justify-center p-6 h-[260px] bg-emerald-500/[0.01] hover:bg-emerald-500/[0.02] relative overflow-hidden transition-colors">
                      {leafImage ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={leafImage}
                            alt="Uploaded Leaf"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Label
                              htmlFor="leaf-upload"
                              className="cursor-pointer bg-white text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5"
                            >
                              <Upload className="h-3.5 w-3.5" /> Replace Photo
                            </Label>
                          </div>
                        </>
                      ) : (
                        <div className="text-center space-y-3">
                          <div className="bg-emerald-500/10 text-emerald-600 p-3 rounded-full w-fit mx-auto">
                            <Upload className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Select Leaf Photo</p>
                            <p className="text-xs text-muted-foreground mt-1">Accepts PNG, JPG or WEBP formats</p>
                          </div>
                          <Label
                            htmlFor="leaf-upload"
                            className="cursor-pointer inline-flex bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition-colors"
                          >
                            Browse Device
                          </Label>
                        </div>
                      )}
                      <input
                        id="leaf-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLeafImageUpload}
                        className="sr-only"
                      />
                    </div>
                  </div>

                  {/* Diagnosis controls & settings - 7cols */}
                  <div className="md:col-span-7 flex flex-col gap-4">
                    <Label className="text-sm font-semibold">Step 2: Analysis parameters</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="diag-crop">Crop Category</Label>
                        <Select
                          value={selectedDiagnosticCrop}
                          onValueChange={setSelectedDiagnosticCrop}
                        >
                          <SelectTrigger id="diag-crop">
                            <SelectValue placeholder="Select Crop" />
                          </SelectTrigger>
                          <SelectContent>
                            {CROPS.map(c => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                            <SelectItem value="Default">Other (General Leaf)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="diag-lang">Report Language</Label>
                        <Select value={diagnosticLanguage} onValueChange={setDiagnosticLanguage}>
                          <SelectTrigger id="diag-lang">
                            <SelectValue placeholder="Report Language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                            <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                            <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                            <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                            <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                            <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
                            <SelectItem value="kn">ಕನ್ನಡ (Kannada)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      onClick={handleAnalyzeLeaf}
                      disabled={aiLoading || !leafImage}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-bold shadow-lg"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Scanning Leaf Diagnostics (Gemini AI)...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
                          Diagnose Leaf Disease
                        </>
                      )}
                    </Button>

                    <Alert className="bg-emerald-500/[0.02] border-emerald-500/10">
                      <Camera className="h-4 w-4 text-emerald-500" />
                      <AlertTitle className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Pathology Tip</AlertTitle>
                      <AlertDescription className="text-xs">
                        Ensure the photo has clear focus on the leaf lesion or infestation. Avoid shadow gradients and extreme glares for high classification accuracy.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>

                {/* AI Scanning progress mockup */}
                {aiLoading && (
                  <div className="p-6 text-center space-y-3 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl animate-pulse">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
                    <p className="font-semibold text-sm">Uploading and analyzing plant tissue structure...</p>
                    <p className="text-xs text-muted-foreground">Running molecular anomaly classification via Gemini models</p>
                  </div>
                )}

                {/* Diagnostic Results report */}
                {diagnosisResult && (
                  <div className="border border-emerald-500/20 bg-emerald-500/[0.02] rounded-2xl p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-emerald-500/10 pb-4">
                      <div>
                        <span className="text-xs uppercase font-mono tracking-wider text-muted-foreground">AI Diagnosis Report</span>
                        <h3 className="text-2xl font-black text-emerald-800 dark:text-emerald-400 mt-1">
                          {diagnosisResult.detectedIssue}
                        </h3>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge
                          className={`text-xs uppercase font-mono px-3 py-1 ${
                            diagnosisResult.category === 'none'
                              ? 'bg-emerald-600'
                              : diagnosisResult.category === 'nutrient_deficiency'
                              ? 'bg-blue-600'
                              : 'bg-red-600'
                          }`}
                        >
                          Type: {diagnosisResult.category.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-mono px-3 py-1">
                          Confidence: {(diagnosisResult.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-sm text-foreground uppercase tracking-wider">Clinical Description</h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {diagnosisResult.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="bg-emerald-500/[0.03] border border-emerald-500/10 p-4 rounded-xl space-y-2">
                          <h4 className="font-bold text-xs text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sprout className="h-4 w-4" /> Organic / Biological Measures
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {diagnosisResult.organicControl}
                          </p>
                        </div>
                        <div className="bg-red-500/[0.02] border border-red-500/10 p-4 rounded-xl space-y-2">
                          <h4 className="font-bold text-xs text-red-800 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldAlert className="h-4 w-4" /> Chemical Control / Fungicides
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {diagnosisResult.chemicalControl || 'N/A (No chemical treatment recommended)'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-emerald-500/10">
                        <h4 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-emerald-500" /> Long-Term Prevention Practices
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {diagnosisResult.prevention}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mandi Commodity Price Tab */}
          <TabsContent value="mandi" className="space-y-4">
            <Card className="border-emerald-500/10">
              <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <Coins className="h-5 w-5 text-emerald-500" />
                    Mandi Market Commodity Price Index
                  </CardTitle>
                  <CardDescription>
                    Deterministic market pricing compiled from regional Mandi records. Updated daily.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Label htmlFor="mandi-crop-select" className="text-xs whitespace-nowrap">Filter Crop:</Label>
                  <Select value={selectedMandiCrop} onValueChange={setSelectedMandiCrop}>
                    <SelectTrigger id="mandi-crop-select" className="w-[140px] h-9">
                      <SelectValue placeholder="Select Crop" />
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
              </CardHeader>
              <CardContent>
                {mandiLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  </div>
                ) : mandiPrices.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground text-sm">No price records found.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-emerald-500/10 bg-emerald-500/[0.005]">
                    <Table>
                      <TableHeader className="bg-emerald-500/5">
                        <TableRow>
                          <TableHead className="font-bold">Mandi Name</TableHead>
                          <TableHead className="font-bold">Region (State/District)</TableHead>
                          <TableHead className="font-bold">Variety</TableHead>
                          <TableHead className="font-bold text-right">Modal Rate (INR/Qtl)</TableHead>
                          <TableHead className="font-bold text-right">Trading Range</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mandiPrices.map((m, idx) => {
                          // Simulate minor mock variations for price trends
                          const isUp = (idx + selectedMandiCrop.charCodeAt(0)) % 2 === 0;
                          return (
                            <TableRow key={m.mandiName} className="hover:bg-muted/30">
                              <TableCell className="font-bold">{m.mandiName}</TableCell>
                              <TableCell>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-emerald-500" />
                                  {m.state}, {m.district}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {m.variety}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-black">
                                <span className="flex items-center justify-end gap-1.5 text-foreground text-sm">
                                  ₹{m.modalPrice.toLocaleString()}
                                  {isUp ? (
                                    <ArrowUpRight className="h-4 w-4 text-emerald-600 shrink-0" />
                                  ) : (
                                    <ArrowDownRight className="h-4 w-4 text-amber-600 shrink-0" />
                                  )}
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">
                                ₹{m.minPrice.toLocaleString()} - ₹{m.maxPrice.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Footer */}
      <footer className="py-6 w-full shrink-0 border-t mt-12 bg-muted/20">
        <div className="container max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © 2026 Kisan Alert - Smart Farmer Advisory. Powered by Satellite Remote Sensing & Gemini AI.
          </p>
          <div className="flex gap-4">
            <Link href="/" className="text-xs hover:underline underline-offset-4 text-muted-foreground">
              Main Dashboard
            </Link>
            <Link href="/settings" className="text-xs hover:underline underline-offset-4 text-muted-foreground">
              Notification Settings
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Simple client side Link component wrapper for standard link references in Footer/etc.
function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
