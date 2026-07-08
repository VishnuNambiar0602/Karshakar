"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { GeometricBackground } from "@/components/geometric-background";
import { ContactSheet } from "@/components/contact-sheet";
import { Chatbot } from "@/components/chatbot";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import {
  SlidersHorizontal,
  Cpu,
  BarChart,
  Download,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isContactOpen, setContactOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Sticky Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[80vh] md:h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Animated Starfield Background */}
          <GeometricBackground />
          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 z-0 bg-gray-900/60 bg-gradient-to-b from-black/50 to-gray-900/80 pointer-events-none" />

          {/* Hero Content */}
          <div className="container relative z-10 max-w-5xl mx-auto px-4 text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-white leading-none">
              {t("landing.hero.title")}
            </h1>
            <p className="max-w-[700px] text-lg md:text-xl text-gray-200 mx-auto leading-relaxed font-medium">
              {t("landing.hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <Button
                onClick={() => router.push("/login")}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12 px-8 rounded-xl hover:scale-105 transition-transform duration-300 shadow-lg flex items-center gap-2"
              >
                {t("landing.hero.login") || "Login"} <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                onClick={() => router.push("/register")}
                variant="secondary"
                size="lg"
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-black h-12 px-8 rounded-xl hover:scale-105 transition-transform duration-300 shadow-lg flex items-center gap-2"
              >
                {t("landing.hero.register") || "Create Account"} <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 md:py-24 lg:py-32 bg-background border-t">
          <div className="container max-w-6xl mx-auto px-4 space-y-12">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <span className="inline-block rounded-lg bg-muted px-3 py-1 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                {t("landing.features.keyFeatures")}
              </span>
              <h2 className="text-3xl font-black tracking-tight sm:text-5xl text-foreground">
                {t("landing.features.title")}
              </h2>
              <p className="max-w-[900px] text-muted-foreground text-base md:text-lg mx-auto">
                {t("landing.features.subtitle")}
              </p>
            </div>

            {/* Grid Capabilities (4 features) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
              {/* Feature 1 */}
              <div className="p-6 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border text-center space-y-4">
                <div className="bg-primary/10 text-primary p-3.5 rounded-full w-fit mx-auto">
                  <SlidersHorizontal className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {t("landing.features.coordinateInput")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("landing.features.coordinateInputDesc")}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border text-center space-y-4">
                <div className="bg-primary/10 text-primary p-3.5 rounded-full w-fit mx-auto">
                  <Cpu className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {t("landing.features.metricComputation")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("landing.features.metricComputationDesc")}
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border text-center space-y-4">
                <div className="bg-primary/10 text-primary p-3.5 rounded-full w-fit mx-auto">
                  <BarChart className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {t("landing.features.interactiveVisuals")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("landing.features.interactiveVisualsDesc")}
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border text-center space-y-4">
                <div className="bg-primary/10 text-primary p-3.5 rounded-full w-fit mx-auto">
                  <Download className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {t("landing.features.exportEasily")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("landing.features.exportEasilyDesc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Us Section */}
        <section id="about" className="py-12 md:py-24 lg:py-32 bg-muted/30 border-t border-b">
          <div className="container max-w-5xl mx-auto px-4 space-y-12">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <span className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-bold text-primary uppercase tracking-wider">
                {t("landing.whyUs.tag")}
              </span>
              <h2 className="text-3xl font-black tracking-tight sm:text-5xl text-foreground">
                {t("landing.whyUs.title")}
              </h2>
              <p className="max-w-[900px] text-muted-foreground text-base md:text-lg mx-auto">
                {t("landing.whyUs.subtitle")}
              </p>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 max-w-3xl mx-auto mt-12">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-primary mr-3 shrink-0 mt-0.5" />
                <span className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  <strong>{t("landing.whyUs.point1")}</strong>
                </span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-primary mr-3 shrink-0 mt-0.5" />
                <span className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  <strong>{t("landing.whyUs.point2")}</strong>
                </span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-primary mr-3 shrink-0 mt-0.5" />
                <span className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  <strong>{t("landing.whyUs.point3")}</strong>
                </span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-primary mr-3 shrink-0 mt-0.5" />
                <span className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  <strong>{t("landing.whyUs.point4")}</strong>
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="py-6 border-t shrink-0 bg-background">
        <div className="container max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <nav className="flex gap-4 sm:gap-6">
            <Link
              href="#about"
              className="text-xs hover:underline underline-offset-4 text-muted-foreground font-bold"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {t("footer.about")}
            </Link>
            <Link
              href="#contact"
              className="text-xs hover:underline underline-offset-4 text-muted-foreground font-bold"
              onClick={(e) => {
                e.preventDefault();
                setContactOpen(true);
              }}
            >
              {t("footer.contact")}
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground text-center">
            {t("footer.copyright")}
          </p>
          <div className="w-6 hidden sm:block"></div> {/* Spacer to balance flexbox */}
        </div>
      </footer>

      {/* Slide-in Contact Sheet */}
      <ContactSheet open={isContactOpen} onOpenChange={setContactOpen} />

      {/* Floating Chatbot Assistant */}
      <Chatbot />
    </div>
  );
}
