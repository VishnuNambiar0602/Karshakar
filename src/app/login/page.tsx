'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { sendOtpAction, verifyOtpAction, checkSessionAction, devBypassLoginAction } from '@/lib/actions';
import { ShieldAlert, Loader2, Phone, KeyRound, ArrowRight, Zap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sandboxMode, setSandboxMode] = useState(false);
  const [devBypassing, setDevBypassing] = useState(false);

  const handleDevBypass = async () => {
    setDevBypassing(true);
    const res = await devBypassLoginAction();
    setDevBypassing(false);
    if (res.error) {
      toast({ title: 'Bypass Failed', description: res.error, variant: 'destructive' });
    } else {
      toast({ title: 'Logged In (Dev)', description: 'Skipping OTP for testing...' });
      if (res.data?.hasProfile) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    }
  };

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
          ? 'Sandbox Mode: Twilio keys absent. Use code 123456 to proceed.'
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
        description: 'Redirecting...',
      });
      const session = await checkSessionAction();
      if (session.data?.hasProfile) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
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

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-center text-sm text-muted-foreground mb-3">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                Create one here
              </Link>
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleDevBypass}
              disabled={devBypassing}
              className="w-full border-dashed border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            >
              {devBypassing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Quick Login (Dev - Skip OTP)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
