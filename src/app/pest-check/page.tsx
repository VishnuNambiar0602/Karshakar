'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  getFarmerProfileAction,
  detectPestDiseaseAction,
  textToSpeechAction,
} from '@/lib/actions';
import {
  Camera,
  Upload,
  Sparkles,
  Loader2,
  Volume2,
  ShieldAlert,
  Sprout,
  Calendar,
  CheckCircle,
} from 'lucide-react';

import { CROPS } from '@/lib/constants';

interface AIDiagnosis {
  detectedIssue: string;
  confidence: number;
  category: 'pest' | 'disease' | 'nutrient_deficiency' | 'none';
  description: string;
  organicControl: string;
  chemicalControl: string;
  prevention: string;
}

export default function PestCheckPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [profileChecked, setProfileChecked] = useState(false);
  const [leafImage, setLeafImage] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>('Rice');
  const [reportLanguage, setReportLanguage] = useState<string>('en');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIDiagnosis | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
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
      }
    });
  }, [router, toast]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLeafImage(reader.result as string);
        setResult(null); // Clear previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!leafImage) return;
    setLoading(true);
    setResult(null);

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
      cropContext: selectedCrop,
      language: reportLanguage,
    });

    setLoading(false);

    if (res.error) {
      toast({
        title: 'Analysis Failed',
        description: res.error,
        variant: 'destructive',
      });
    } else if (res.data) {
      setResult(res.data as AIDiagnosis);
      toast({
        title: 'Analysis Complete',
        description: `Identified condition: ${res.data.detectedIssue}`,
      });
    }
  };

  const handleTextToSpeech = async () => {
    if (!result || playing) return;
    setPlaying(true);

    try {
      const speechText = `AI Diagnostic Report. Condition: ${result.detectedIssue}. Description: ${result.description}. Organic Control: ${result.organicControl}. Prevention: ${result.prevention}`;
      const res = await textToSpeechAction(speechText);
      if (res.data?.audioDataUri) {
        const audio = new Audio(res.data.audioDataUri);
        audio.onended = () => setPlaying(false);
        audio.onerror = () => setPlaying(false);
        await audio.play();
      } else {
        setPlaying(false);
        toast({
          title: 'Audio Failed',
          description: 'Could not generate speech advisory.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      setPlaying(false);
      console.error(e);
    }
  };

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
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="border-b border-emerald-500/10 pb-4">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <Camera className="h-7 w-7 text-emerald-500" />
            AI Leaf Pathology Scanner
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload an image of a plant leaf with spots or insect damage. Gemini AI will diagnose the issue and provide organic/chemical control steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Upload card (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <Card className="border-emerald-500/10 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">1. Upload Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-emerald-500/10 rounded-2xl flex flex-col items-center justify-center p-4 h-[240px] bg-emerald-500/[0.01] hover:bg-emerald-500/[0.02] relative overflow-hidden transition-colors">
                  {leafImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={leafImage} alt="Crop Leaf" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Label htmlFor="leaf-upload" className="cursor-pointer bg-white text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5">
                          <Upload className="h-3.5 w-3.5" /> Change Photo
                        </Label>
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="bg-emerald-500/10 text-emerald-600 p-3 rounded-full w-fit mx-auto">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Select Leaf Image</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Supports PNG, JPG or WEBP</p>
                      </div>
                      <Label htmlFor="leaf-upload" className="cursor-pointer inline-flex bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition-colors">
                        Choose File
                      </Label>
                    </div>
                  )}
                  <input id="leaf-upload" type="file" accept="image/*" onChange={handleImageUpload} className="sr-only" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Parameters & Action (7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-4">
            <Card className="border-emerald-500/10 shadow-lg flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">2. Set Details & Diagnose</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="diag-crop">Crop Category</Label>
                    <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                      <SelectTrigger id="diag-crop">
                        <SelectValue placeholder="Crop type" />
                      </SelectTrigger>
                      <SelectContent>
                        {CROPS.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                        <SelectItem value="Default">Other (General Leaf)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diag-lang">Advisory Language</Label>
                    <Select value={reportLanguage} onValueChange={setReportLanguage}>
                      <SelectTrigger id="diag-lang">
                        <SelectValue placeholder="Language" />
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
                  onClick={handleAnalyze}
                  disabled={loading || !leafImage}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-bold shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing Molecular Pathology...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Diagnose Crop Leaf
                    </>
                  )}
                </Button>

                <Alert className="bg-emerald-500/[0.02] border-emerald-500/10">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <AlertTitle className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Diagnosis Instructions</AlertTitle>
                  <AlertDescription className="text-xs">
                    Please get a clear, close-up photograph of the leaf. Crop out any background weeds or fingers for best accuracy.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Diagnosis Results Card */}
        {result && (
          <Card className="border-emerald-500/20 bg-emerald-500/[0.02] shadow-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-emerald-500/10 pb-4">
              <div>
                <span className="text-xs uppercase font-mono tracking-wider text-muted-foreground">AI Diagnostics Result</span>
                <h3 className="text-2xl font-black text-emerald-800 dark:text-emerald-400 mt-1">
                  {result.detectedIssue}
                </h3>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Badge className={`text-xs uppercase font-mono px-3 py-1 ${
                  result.category === 'none' ? 'bg-emerald-600' : result.category === 'nutrient_deficiency' ? 'bg-blue-600' : 'bg-red-600'
                }`}>
                  {result.category.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className="text-xs font-mono px-3 py-1">
                  Confidence: {(result.confidence * 100).toFixed(0)}%
                </Badge>
                <Button variant="outline" size="sm" onClick={handleTextToSpeech} className="border-emerald-500/10 text-emerald-600">
                  {playing ? <Loader2 className="h-4 w-4 animate-spin text-emerald-500" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wider text-foreground">Condition Summary</h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{result.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-500/[0.03] border border-emerald-500/10 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-xs text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sprout className="h-4 w-4" /> Organic Remedies
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{result.organicControl}</p>
                </div>
                <div className="bg-red-500/[0.02] border border-red-500/10 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-xs text-red-800 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4" /> Chemical Remedies
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{result.chemicalControl || 'None recommended'}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-500/10">
                <h4 className="font-bold text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-emerald-500" /> Long-Term Prevention
                </h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{result.prevention}</p>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
