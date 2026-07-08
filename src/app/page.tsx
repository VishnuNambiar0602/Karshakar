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
    <div className="flex flex-col min-h-screen bg-background select-none">
      {/* Sticky Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[85vh] md:h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Animated Starfield Background */}
          <GeometricBackground />
          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/60 via-slate-950/80 to-background pointer-events-none" />

          {/* Glowing Ambient Blob */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />

          {/* Hero Content */}
          <div className="container relative z-10 max-w-5xl mx-auto px-4 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-mono tracking-widest uppercase mb-4 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {t("landing.whyUs.tag") || "Next-Gen Agri-Tech"}
            </div>
            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-100 to-emerald-400">
                {t("landing.hero.title")}
              </span>
            </h1>
            <p className="max-w-[750px] text-lg md:text-2xl text-slate-300 mx-auto leading-relaxed font-normal">
              {t("landing.hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-5 pt-6">
              <Button
                onClick={() => router.push("/login")}
                size="lg"
                className="relative group bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-14 px-8 rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.55)] flex items-center gap-2 overflow-hidden hover:scale-105"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                <span className="relative z-10 flex items-center gap-2 text-base">
                  {t("landing.hero.login") || "Login"} <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
              <Button
                onClick={() => router.push("/register")}
                variant="secondary"
                size="lg"
                className="relative group bg-slate-950/40 hover:bg-slate-900/60 text-white font-bold h-14 px-8 rounded-2xl border border-emerald-500/25 hover:border-emerald-500/50 backdrop-blur-md transition-all duration-300 shadow-lg flex items-center gap-2 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2 text-base">
                  {t("landing.hero.register") || "Create Account"} <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative py-20 md:py-32 bg-background border-t border-emerald-950/30 overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="container max-w-6xl mx-auto px-4 space-y-16">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <span className="inline-block rounded-full bg-primary/10 border border-primary/20 px-4 py-1 text-xs font-bold text-primary uppercase tracking-widest">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="glass-card glass-card-hover p-8 rounded-3xl border border-primary/5 text-center space-y-4 group">
                <div className="bg-primary/10 text-primary p-4 rounded-2xl w-fit mx-auto group-hover:scale-110 group-hover:bg-primary/25 transition-all duration-300">
                  <SlidersHorizontal className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {t("landing.features.coordinateInput")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("landing.features.coordinateInputDesc")}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-card glass-card-hover p-8 rounded-3xl border border-primary/5 text-center space-y-4 group">
                <div className="bg-primary/10 text-primary p-4 rounded-2xl w-fit mx-auto group-hover:scale-110 group-hover:bg-primary/25 transition-all duration-300">
                  <Cpu className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {t("landing.features.metricComputation")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("landing.features.metricComputationDesc")}
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-card glass-card-hover p-8 rounded-3xl border border-primary/5 text-center space-y-4 group">
                <div className="bg-primary/10 text-primary p-4 rounded-2xl w-fit mx-auto group-hover:scale-110 group-hover:bg-primary/25 transition-all duration-300">
                  <BarChart className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {t("landing.features.interactiveVisuals")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("landing.features.interactiveVisualsDesc")}
                </p>
              </div>

              {/* Feature 4 */}
              <div className="glass-card glass-card-hover p-8 rounded-3xl border border-primary/5 text-center space-y-4 group">
                <div className="bg-primary/10 text-primary p-4 rounded-2xl w-fit mx-auto group-hover:scale-110 group-hover:bg-primary/25 transition-all duration-300">
                  <Download className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
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
        <section id="about" className="relative py-20 md:py-32 bg-gradient-to-b from-background via-emerald-950/5 to-background border-t border-emerald-950/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="container max-w-5xl mx-auto px-4 space-y-16">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <span className="inline-block rounded-full bg-primary/10 border border-primary/20 px-4 py-1 text-xs font-bold text-primary uppercase tracking-widest">
                {t("landing.whyUs.tag") || "ABOUT US"}
              </span>
              <h2 className="text-3xl font-black tracking-tight sm:text-5xl text-foreground">
                {t("landing.whyUs.title")}
              </h2>
              <p className="max-w-[900px] text-muted-foreground text-base md:text-lg mx-auto">
                {t("landing.whyUs.subtitle")}
              </p>
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="flex items-start p-6 rounded-2xl border border-primary/5 bg-card/60 backdrop-blur-sm hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300">
                <CheckCircle className="h-6 w-6 text-primary mr-4 shrink-0 mt-0.5" />
                <span className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  <strong>{t("landing.whyUs.point1")}</strong>
                </span>
              </div>
              <div className="flex items-start p-6 rounded-2xl border border-primary/5 bg-card/60 backdrop-blur-sm hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300">
                <CheckCircle className="h-6 w-6 text-primary mr-4 shrink-0 mt-0.5" />
                <span className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  <strong>{t("landing.whyUs.point2")}</strong>
                </span>
              </div>
              <div className="flex items-start p-6 rounded-2xl border border-primary/5 bg-card/60 backdrop-blur-sm hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300">
                <CheckCircle className="h-6 w-6 text-primary mr-4 shrink-0 mt-0.5" />
                <span className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  <strong>{t("landing.whyUs.point3")}</strong>
                </span>
              </div>
              <div className="flex items-start p-6 rounded-2xl border border-primary/5 bg-card/60 backdrop-blur-sm hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300">
                <CheckCircle className="h-6 w-6 text-primary mr-4 shrink-0 mt-0.5" />
                <span className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  <strong>{t("landing.whyUs.point4")}</strong>
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="py-8 border-t border-emerald-950/20 bg-background/50 backdrop-blur-md">
        <div className="container max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <nav className="flex gap-6">
            <Link
              href="#about"
              className="text-sm hover:text-primary transition-colors text-muted-foreground font-bold"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {t("footer.about")}
            </Link>
            <Link
              href="#contact"
              className="text-sm hover:text-primary transition-colors text-muted-foreground font-bold"
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
          <div className="w-6 hidden sm:block"></div> {/* Spacer */}
        </div>
      </footer>

      {/* Slide-in Contact Sheet */}
      <ContactSheet open={isContactOpen} onOpenChange={setContactOpen} />

      {/* Floating Chatbot Assistant */}
      <Chatbot />
    </div>
  );
}
