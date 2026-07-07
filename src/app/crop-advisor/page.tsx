
"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, Loader2, Wheat, Droplets, LandPlot, Dna, Bug, FlaskConical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { suggestCropAction, getAdvancedCropAdviceAction } from "@/lib/actions";
import type { SuggestCropOutput, AdvancedCropAdvice } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/use-language";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ContactSheet } from "@/components/contact-sheet";

const cropOptions = ["Corn", "Wheat", "Rice", "Soybeans", "Cotton", "Potatoes", "Tomatoes", "Barley", "Sorghum"];

function CropAdvisorContent() {
    const { toast } = useToast();
    const { t, language } = useLanguage();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState< 'suggest' | 'advanced' | null>(null);
    const [isContactOpen, setContactOpen] = useState(false);
    
    // Basic suggestion state
    const [suggestionResult, setSuggestionResult] = useState<SuggestCropOutput | null>(null);
    
    // Advanced advice state
    const [adviceResult, setAdviceResult] = useState<AdvancedCropAdvice | null>(null);
    const [selectedCropForAdvice, setSelectedCropForAdvice] = useState<string>("");

    const [lat, setLat] = useState("28.6139");
    const [lon, setLon] = useState("77.2090");
    const [climate, setClimate] = useState("Subtropical, with a hot summer and a cool, dry winter.");
    const [currentCrop, setCurrentCrop] = useState("Wheat");

    useEffect(() => {
        const latParam = searchParams.get('lat');
        const lonParam = searchParams.get('lon');
        if (latParam) setLat(latParam);
        if (lonParam) setLon(lonParam);
    }, [searchParams]);
    
    useEffect(() => {
        if(suggestionResult?.suggestedCrop) {
            setSelectedCropForAdvice(suggestionResult.suggestedCrop);
        }
    }, [suggestionResult]);

    const handleSuggestSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading('suggest');
        setSuggestionResult(null);
        setAdviceResult(null);

        const formData = {
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
            climateDescription: climate,
            currentCrop,
            language: language,
        };

        const response = await suggestCropAction(formData);
        
        if (response.error) {
            toast({ title: t('predict.error.aiError.title'), description: response.error, variant: "destructive" });
        } else if (response.data) {
            setSuggestionResult(response.data);
            toast({ title: t('cropAdvisor.toast.success.title'), description: t('cropAdvisor.toast.success.description') });
        }
        setIsLoading(null);
    };
    
    const handleAdvancedAdviceSubmit = async () => {
        if (!selectedCropForAdvice) {
            toast({ title: t('cropAdvisor.error.noCropSelected.title'), description: t('cropAdvisor.error.noCropSelected.description'), variant: "destructive" });
            return;
        }
        setIsLoading('advanced');
        setAdviceResult(null);
        
        const response = await getAdvancedCropAdviceAction({
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
            climateDescription: climate,
            crop: selectedCropForAdvice,
            language: language
        });
        
        if (response.error) {
            toast({ title: t('predict.error.aiError.title'), description: response.error, variant: "destructive" });
        } else if (response.data) {
            setAdviceResult(response.data);
            toast({ title: t('cropAdvisor.toast.advancedSuccess.title'), description: t('cropAdvisor.toast.advancedSuccess.description', {crop: selectedCropForAdvice}) });
        }
        setIsLoading(null);
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 p-4 md:p-6">
                <div className="container mx-auto space-y-8 max-w-4xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('cropAdvisor.title')}</CardTitle>
                            <CardDescription>{t('cropAdvisor.description')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSuggestSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="latitude">{t('predict.latitude')}</Label>
                                        <Input id="latitude" value={lat} onChange={e => setLat(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="longitude">{t('predict.longitude')}</Label>
                                        <Input id="longitude" value={lon} onChange={e => setLon(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="current-crop">{t('cropAdvisor.currentCrop.label')}</Label>
                                    <Input id="current-crop" placeholder={t('cropAdvisor.currentCrop.placeholder')} value={currentCrop} onChange={e => setCurrentCrop(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="climate">{t('cropAdvisor.climate.label')}</Label>
                                    <Textarea id="climate" placeholder={t('cropAdvisor.climate.placeholder')} value={climate} onChange={e => setClimate(e.target.value)} required />
                                </div>
                                <Button type="submit" disabled={!!isLoading} className="w-full">
                                    {isLoading === 'suggest' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wheat className="mr-2" />}
                                    {t('cropAdvisor.button.getRecommendation')}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {isLoading === 'suggest' && (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                    )}

                    {suggestionResult && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('cropAdvisor.result.title')}</CardTitle>
                                <CardDescription>{t('cropAdvisor.result.description')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <Card className="p-4">
                                        <CardDescription className="flex items-center gap-2 mb-2"><LandPlot /> {t('cropAdvisor.result.soilType')}</CardDescription>
                                        <Badge variant="outline" className="text-lg">{suggestionResult.fetchedSoilType}</Badge>
                                    </Card>
                                     <Card className="p-4">
                                        <CardDescription className="flex items-center gap-2 mb-2"><Droplets /> {t('cropAdvisor.result.moisture')}</CardDescription>
                                        <Badge variant="outline" className="text-lg">{suggestionResult.fetchedMoistureLevel}</Badge>
                                    </Card>
                                </div>

                                <div className="text-center space-y-2 pt-4">
                                    <p className="text-muted-foreground">{t('cropAdvisor.result.suggestedCrop')}</p>
                                    <h3 className="text-4xl font-bold text-primary">{suggestionResult.suggestedCrop}</h3>
                                </div>
                                <div className="text-center space-y-2">
                                     <p className="text-muted-foreground">{t('cropAdvisor.result.suitability')}</p>
                                      <div className="relative h-8 w-full bg-muted rounded-full overflow-hidden">
                                        <div className="absolute top-0 left-0 h-full bg-green-500 rounded-full" style={{ width: `${suggestionResult.suitabilityScore}%` }} />
                                        <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white mix-blend-difference">{suggestionResult.suitabilityScore}% {t('cropAdvisor.result.suitable')}</span>
                                    </div>
                                </div>
                                
                                <Alert>
                                    <Lightbulb className="h-4 w-4" />
                                    <AlertTitle>{t('cropAdvisor.result.reasoning')}</AlertTitle>
                                    <AlertDescription>
                                       {suggestionResult.reasoning}
                                    </AlertDescription>
                                </Alert>

                                {suggestionResult.alternativeCrop && (
                                     <Alert variant="default">
                                        <Wheat className="h-4 w-4" />
                                        <AlertTitle>{t('cropAdvisor.result.alternative')}</AlertTitle>
                                        <AlertDescription>
                                           {t('cropAdvisor.result.alternativeDesc', { crop: suggestionResult.alternativeCrop })}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                
                                <Separator className="my-6" />
                                
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">{t('cropAdvisor.advanced.title')}</h3>
                                    <p className="text-sm text-muted-foreground">{t('cropAdvisor.advanced.description')}</p>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <Select value={selectedCropForAdvice} onValueChange={setSelectedCropForAdvice}>
                                            <SelectTrigger className="w-full sm:w-[280px]">
                                                <SelectValue placeholder={t('cropAdvisor.advanced.selectCrop.placeholder')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {suggestionResult.suggestedCrop && !cropOptions.includes(suggestionResult.suggestedCrop) && (
                                                    <SelectItem value={suggestionResult.suggestedCrop}>{suggestionResult.suggestedCrop}</SelectItem>
                                                )}
                                                {cropOptions.map(crop => <SelectItem key={crop} value={crop}>{crop}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Button onClick={handleAdvancedAdviceSubmit} disabled={!!isLoading || !selectedCropForAdvice} className="w-full sm:w-auto">
                                            {isLoading === 'advanced' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Dna className="mr-2 h-4 w-4" />}
                                            {t('cropAdvisor.advanced.button')}
                                        </Button>
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    )}
                    
                    {isLoading === 'advanced' && (
                         <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                    )}
                    
                    {adviceResult && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('cropAdvisor.advanced.result.title', { crop: adviceResult.crop })}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-2"><LandPlot /> {t('cropAdvisor.advanced.result.plantingDensity')}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-2xl font-bold">{adviceResult.plantingDensity.value.toLocaleString()} <span className="text-lg text-muted-foreground">{adviceResult.plantingDensity.unit}</span></p>
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardHeader className="pb-2">
                                         <CardDescription className="flex items-center gap-2"><Bug /> {t('cropAdvisor.advanced.result.pests')}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 list-disc pl-5">
                                            {adviceResult.pestAndDiseaseRisks.map(risk => (
                                                <li key={risk.name}>
                                                    <span className="font-semibold">{risk.name}:</span> {risk.description}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                                
                                 <Card>
                                    <CardHeader className="pb-2">
                                         <CardDescription className="flex items-center gap-2"><FlaskConical /> {t('cropAdvisor.advanced.result.fertilization')}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 list-disc pl-5">
                                            {adviceResult.fertilizationStrategy.map(strat => (
                                                <li key={strat.timing}>
                                                    <span className="font-semibold">{strat.timing}:</span> {strat.recommendation}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                                
                                <Alert>
                                    <Lightbulb className="h-4 w-4" />
                                    <AlertTitle>{t('predict.result.yield.notes')}</AlertTitle>
                                    <AlertDescription>{adviceResult.notes}</AlertDescription>
                                </Alert>
                                
                            </CardContent>
                        </Card>
                    )}

                </div>
            </main>
            <footer id="contact" className="py-6 w-full shrink-0 border-t">
                <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
                    <nav className="flex gap-4 sm:gap-6">
                        <Link href="/#about" className="text-xs hover:underline underline-offset-4 text-muted-foreground">{t('footer.about')}</Link>
                        <Link href="#contact" className="text-xs hover:underline underline-offset-4 text-muted-foreground" onClick={(e) => { e.preventDefault(); setContactOpen(true)}}>{t('footer.contact')}</Link>
                    </nav>
                    <p className="text-xs text-muted-foreground text-center">
                      {t('footer.copyright')}
                    </p>
                    <div className="w-24 hidden sm:block"></div> {/* Spacer to balance flexbox */}
                </div>
            </footer>
            <ContactSheet open={isContactOpen} onOpenChange={setContactOpen} />
        </div>
    );
}

export default function CropAdvisorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CropAdvisorContent />
        </Suspense>
    )
}
