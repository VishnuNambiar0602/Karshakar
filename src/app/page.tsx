
"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Cpu, BarChart, Download, SlidersHorizontal, CheckCircle, ArrowRight, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { ContactSheet } from "@/components/contact-sheet";
import { useLanguage } from "@/hooks/use-language";
import { Chatbot } from "@/components/chatbot";


export default function LandingPage() {
    const { t } = useLanguage();
    const [isContactOpen, setContactOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative w-full h-[80vh] md:h-[90vh] flex items-center justify-center text-center text-white overflow-hidden">
             <div className="absolute inset-0 z-0 bg-gray-900 bg-gradient-to-b from-black/50 to-gray-900/80">
             </div>

            <div className="container px-4 md:px-6 z-10">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-shadow-lg">
                    {t('landing.hero.title')}
                  </h1>
                  <p className="max-w-[700px] mx-auto text-lg text-gray-200 md:text-xl">
                    {t('landing.hero.subtitle')}
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                   <Button asChild size="lg" className="bg-primary/90 hover:bg-primary text-primary-foreground hover:scale-105 transition-transform duration-300 shadow-lg">
                    <Link href="/dashboard">{t('landing.hero.getStarted')} <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary" className="hover:scale-105 transition-transform duration-300 shadow-lg">
                    <Link href="/predict">{t('landing.hero.predictiveTools')} <BrainCircuit className="ml-2 h-5 w-5" /></Link>
                  </Button>
                </div>
              </div>
            </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                  {t('landing.features.keyFeatures')}
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  {t('landing.features.title')}
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  {t('landing.features.subtitle')}
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-4 mt-12">
              <div className="grid gap-2 text-center p-4 rounded-lg hover:bg-muted/50 transition-colors">
                <SlidersHorizontal className="h-10 w-10 text-primary mx-auto" />
                <h3 className="text-lg font-bold">{t('landing.features.coordinateInput')}</h3>
                <p className="text-sm text-muted-foreground">
                    {t('landing.features.coordinateInputDesc')}
                </p>
              </div>
              <div className="grid gap-2 text-center p-4 rounded-lg hover:bg-muted/50 transition-colors">
                <Cpu className="h-10 w-10 text-primary mx-auto" />
                <h3 className="text-lg font-bold">{t('landing.features.metricComputation')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('landing.features.metricComputationDesc')}
                </p>
              </div>
              <div className="grid gap-2 text-center p-4 rounded-lg hover:bg-muted/50 transition-colors">
                <BarChart className="h-10 w-10 text-primary mx-auto" />
                <h3 className="text-lg font-bold">{t('landing.features.interactiveVisuals')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('landing.features.interactiveVisualsDesc')}
                </p>
              </div>
               <div className="grid gap-2 text-center p-4 rounded-lg hover:bg-muted/50 transition-colors">
                <Download className="h-10 w-10 text-primary mx-auto" />
                <h3 className="text-lg font-bold">{t('landing.features.exportEasily')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('landing.features.exportEasilyDesc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
            <div className="container px-4 md:px-6">
                 <div className="grid gap-10 lg:grid-cols-2 items-center">
                    <div className="lg:col-span-2 text-center">
                        <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm mb-2">{t('landing.whyUs.tag')}</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">{t('landing.whyUs.title')}</h2>
                        <p className="max-w-3xl mx-auto text-muted-foreground md:text-xl/relaxed mt-4">
                            {t('landing.whyUs.subtitle')}
                        </p>
                    </div>
                    <div className="col-span-1 lg:col-span-2">
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                            <li className="flex items-start">
                                <CheckCircle className="h-6 w-6 mr-3 text-primary flex-shrink-0 mt-1" />
                                <span className="text-muted-foreground"><strong>{t('landing.whyUs.point1')}</strong></span>
                            </li>
                             <li className="flex items-start">
                                <CheckCircle className="h-6 w-6 mr-3 text-primary flex-shrink-0 mt-1" />
                                <span className="text-muted-foreground"><strong>{t('landing.whyUs.point2')}</strong></span>
                            </li>
                             <li className="flex items-start">
                                <CheckCircle className="h-6 w-6 mr-3 text-primary flex-shrink-0 mt-1" />
                                <span className="text-muted-foreground"><strong>{t('landing.whyUs.point3')}</strong></span>
                            </li>
                             <li className="flex items-start">
                                <CheckCircle className="h-6 w-6 mr-3 text-primary flex-shrink-0 mt-1" />
                                <span className="text-muted-foreground"><strong>{t('landing.whyUs.point4')}</strong></span>
                            </li>
                        </ul>
                    </div>
                 </div>
            </div>
        </section>
      </main>
      <footer id="contact" className="py-6 w-full shrink-0 border-t">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
            <nav className="flex gap-4 sm:gap-6">
                <Link href="#about" className="text-xs hover:underline underline-offset-4 text-muted-foreground" onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({behavior: 'smooth'})}}>{t('footer.about')}</Link>
                <Link href="#contact" className="text-xs hover:underline underline-offset-4 text-muted-foreground" onClick={(e) => { e.preventDefault(); setContactOpen(true)}}>{t('footer.contact')}</Link>
            </nav>
            <p className="text-xs text-muted-foreground text-center">
              {t('footer.copyright')}
            </p>
            <div className="w-24 hidden sm:block"></div> {/* Spacer to balance flexbox */}
        </div>
      </footer>
      <ContactSheet open={isContactOpen} onOpenChange={setContactOpen} />
      <Chatbot />
    </div>
  );
}
