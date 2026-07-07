'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { sendOtpAction, verifyOtpAction } from '@/lib/actions';
import { ShieldAlert, Loader2, Phone, KeyRound, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sandboxMode, setSandboxMode] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setSending(true);
    const res = await sendOtpAction(phone);
    setSending(false);

    if (res.error) {
      toast({
        title: 'Error sending OTP',
        description: res.error,
        variant: 'destructive',
      });
    } else {
      setSandboxMode(!!res.data?.sandbox);
      setStep('otp');
      toast({
        title: 'OTP Dispatched',
        description: res.data?.sandbox
          ? 'Sandbox Mode: Twilio keys absent. Use any code or 123456.'
          : 'Please check your mobile phone for verification code.',
      });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setVerifying(true);
    const res = await verifyOtpAction({ phone, code });
    setVerifying(false);

    if (res.error) {
      toast({
        title: 'Verification Failed',
        description: res.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Verified Successfully',
        description: 'Redirecting to Home page...',
      });
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-950/20 to-blue-950/25 bg-background">
      <Card className="max-w-md w-full border-primary/10 shadow-2xl backdrop-blur-md bg-card/95">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-3">
            <KeyRound className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight">Kisan Portal Login</CardTitle>
          <CardDescription>
            Verify your identity with secure OTP verification to access land plots and alerts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Phone (with country code)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                  </span>
                  <Input
                    id="phone"
                    placeholder="e.g. +919876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Format must include `+` and country prefix (e.g., +91 for India).
                </p>
              </div>

              <Button type="submit" disabled={sending} className="w-full bg-primary hover:bg-primary/90 h-11 text-sm font-bold shadow-lg">
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP Verification <ArrowRight className="h-4 w-4 ml-1.5" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Enter 6-Digit OTP</Label>
                <Input
                  id="code"
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="text-center tracking-widest font-bold text-lg h-12"
                  required
                />
              </div>

              {sandboxMode && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 rounded-xl text-xs flex gap-2">
                  <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5 text-amber-500" />
                  <div>
                    <span className="font-bold">Sandbox Mode Enabled:</span>
                    <p className="text-[11px] mt-0.5">Twilio is not configured. Use the mock code generated in the server logs (or bypass with 123456).</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('phone')}
                  className="flex-1 border-primary/20 text-primary hover:bg-primary/5"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={verifying}
                  className="flex-[2] bg-primary hover:bg-primary/90 font-bold"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Log In'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
