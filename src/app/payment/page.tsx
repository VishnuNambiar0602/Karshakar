
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, CreditCard, Lock, Banknote, QrCode } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContactSheet } from '@/components/contact-sheet';

export default function PaymentPage() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [isContactOpen, setContactOpen] = useState(false);

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // This is a mock submission.
        toast({
            title: t('payment.success.title'),
            description: t('payment.success.description'),
        });
        // In a real app, you'd handle the Razorpay response and redirect.
    };
    
    const banks = ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra Bank"];

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <Header />
            <main className="flex-1 py-12 md:py-24">
                <div className="container grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-6">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('payment.title')}</CardTitle>
                                <CardDescription>{t('payment.description')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="card" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="card"><CreditCard className="mr-2 h-4 w-4" />{t('payment.card')}</TabsTrigger>
                                        <TabsTrigger value="upi"><Banknote className="mr-2 h-4 w-4" />{t('payment.upi')}</TabsTrigger>
                                        <TabsTrigger value="netbanking">{t('payment.netbanking')}</TabsTrigger>
                                    </TabsList>
                                    
                                    <form onSubmit={handlePaymentSubmit}>
                                        <TabsContent value="card" className="pt-6">
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="cardNumber">{t('payment.cardNumber')}</Label>
                                                    <div className="relative">
                                                        <Input 
                                                            id="cardNumber" 
                                                            placeholder="0000 0000 0000 0000" 
                                                            required 
                                                            inputMode="numeric"
                                                            autoComplete="cc-number"
                                                        />
                                                        <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="expiryDate">{t('payment.expiryDate')}</Label>
                                                        <Input 
                                                            id="expiryDate" 
                                                            placeholder="MM / YY" 
                                                            required 
                                                            inputMode="numeric"
                                                            autoComplete="cc-exp"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="cvc">{t('payment.cvc')}</Label>
                                                        <Input 
                                                            id="cvc" 
                                                            type="password" 
                                                            placeholder="CVC" 
                                                            required 
                                                            inputMode="numeric"
                                                            autoComplete="cc-csc"
                                                            maxLength={4}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="nameOnCard">{t('payment.nameOnCard')}</Label>
                                                    <Input 
                                                        id="nameOnCard" 
                                                        placeholder={t('payment.nameOnCardPlaceholder')} 
                                                        required 
                                                        autoComplete="cc-name"
                                                    />
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="upi" className="pt-6">
                                             <div className="space-y-4 text-center">
                                                <p className="text-sm text-muted-foreground">{t('payment.upi.scan')}</p>
                                                <div className="mx-auto flex justify-center">
                                                    <div className="bg-white p-2 rounded-lg inline-block">
                                                        <QrCode className="h-40 w-40" />
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                   <div className="absolute inset-0 flex items-center">
                                                        <span className="w-full border-t" />
                                                    </div>
                                                    <div className="relative flex justify-center text-xs uppercase">
                                                        <span className="bg-background px-2 text-muted-foreground">OR</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 text-left">
                                                    <Label htmlFor="upiId">{t('payment.upi.enterId')}</Label>
                                                    <Input id="upiId" placeholder="yourname@bank" />
                                                </div>
                                            </div>
                                        </TabsContent>
                                        
                                        <TabsContent value="netbanking" className="pt-6">
                                            <div className="space-y-4">
                                                <Label>{t('payment.netbanking.select')}</Label>
                                                 <Select>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('payment.netbanking.selectPlaceholder')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {banks.map(bank => <SelectItem key={bank} value={bank}>{bank}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-muted-foreground">{t('payment.netbanking.note')}</p>
                                            </div>
                                        </TabsContent>
                                        
                                        <CardFooter className="px-0 pt-8 pb-0">
                                            <Button type="submit" className="w-full">
                                                <Lock className="mr-2 h-4 w-4" />
                                                {t('payment.payButton', { amount: '$20' })}
                                                 <Image src="https://razorpay.com/assets/razorpay-logo.svg" alt="Razorpay" width={72} height={20} className="h-5 ml-4 w-auto" unoptimized />
                                            </Button>
                                        </CardFooter>
                                    </form>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <CardHeader>
                                <CardTitle>{t('payment.summary.title')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span>{t('payment.summary.plan')}</span>
                                    <span className="font-semibold">Pro Plan</span>
                                </div>
                                <div className="flex justify-between items-center font-bold text-lg">
                                    <span>{t('payment.summary.total')}</span>
                                    <span>$20.00</span>
                                </div>
                                <ul className="space-y-2 text-sm text-muted-foreground pt-4 border-t">
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Unlimited metric computations</li>
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> All Predictive Tools</li>
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Advanced AI Insights</li>
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Video Generation Feature</li>
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Priority email support</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
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
