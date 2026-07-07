
"use client";

import Link from "next/link";
import React, { useState } from 'react';
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { Badge } from "@/components/ui/badge";
import { ContactSheet } from "@/components/contact-sheet";

export default function PricingPage() {
    const { t } = useLanguage();
    const [isContactOpen, setContactOpen] = useState(false);

    const tiers = [
        {
            name: "Free",
            price: "$0",
            priceDetails: "/ month",
            description: "For individuals and hobbyists starting out.",
            features: [
                "Basic dashboard access",
                "Limited metric computations (5/day)",
                "Standard AI insights",
                "Community support"
            ],
            buttonText: "Go to Dashboard",
            buttonLink: "/dashboard"
        },
        {
            name: "Pro",
            price: "$20",
            priceDetails: "/ month",
            description: "For professionals and researchers requiring more power.",
            features: [
                "Everything in Free, plus:",
                "Unlimited metric computations",
                "All Predictive Tools",
                "Advanced AI Insights & 'What-If' Scenarios",
                "Video Generation Feature",
                "Priority email support"
            ],
            buttonText: "Upgrade to Pro",
            buttonLink: "/payment",
            popular: true
        },
        {
            name: "Enterprise",
            price: "Custom",
            priceDetails: "",
            description: "For large organizations with custom needs.",
            features: [
                "Everything in Pro, plus:",
                "Team management features",
                "Custom model integration",
                "Dedicated account manager",
                "24/7 priority support"
            ],
            buttonText: "Contact Sales",
            buttonLink: "#",
            isContact: true
        }
    ];

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
                <section className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">{t('pricing.title')}</h1>
                                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                    {t('pricing.subtitle')}
                                </p>
                            </div>
                        </div>
                        <div className="mx-auto grid max-w-sm items-start gap-8 mt-12 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3">
                            {tiers.map((tier) => (
                                <Card key={tier.name} className={`flex flex-col ${tier.popular ? 'border-primary border-2' : ''}`}>
                                    {tier.popular && (
                                        <Badge className="absolute -top-3 right-4">{t('pricing.popular')}</Badge>
                                    )}
                                    <CardHeader className="pb-4">
                                        <CardTitle>{tier.name}</CardTitle>
                                        <CardDescription>{tier.description}</CardDescription>
                                        <div className="flex items-baseline">
                                            <span className="text-4xl font-bold">{tier.price}</span>
                                            {tier.priceDetails && <span className="text-muted-foreground ml-1">{tier.priceDetails}</span>}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <ul className="grid gap-2 text-sm text-muted-foreground">
                                            {tier.features.map((feature, index) => (
                                                <li key={index} className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-primary" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button asChild className="w-full" onClick={tier.isContact ? (e) => {e.preventDefault(); setContactOpen(true)} : undefined}>
                                            <Link href={tier.buttonLink}>{tier.buttonText} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
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

    