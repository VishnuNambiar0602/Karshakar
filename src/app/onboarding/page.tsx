'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { saveFarmerProfileAction, getFarmerProfileAction } from '@/lib/actions';
import { Sprout, Loader2 } from 'lucide-react';

import { STATES_AND_DISTRICTS } from '@/lib/constants';

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    phone: '',
    state: 'Punjab',
    district: 'Ludhiana',
    preferredLanguage: 'en',
  });

  useEffect(() => {
    // Check if farmer is already onboarded
    getFarmerProfileAction().then(res => {
      if (res.data) {
        toast({
          title: 'Already Registered',
          description: 'Redirecting to your dashboard...',
        });
        router.push('/dashboard');
      } else {
        setChecking(false);
      }
    });
  }, [router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await saveFarmerProfileAction(form);
    setSaving(false);

    if (res.error) {
      toast({
        title: 'Registration Failed',
        description: res.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Registration Successful',
        description: `Welcome to Kisan Alert, ${form.name}!`,
      });
      router.push('/dashboard');
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking registration status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-950/30 via-slate-950 to-background">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <Card className="max-w-md w-full border-primary/10 shadow-2xl backdrop-blur-xl bg-card/45 rounded-3xl overflow-hidden glass-card relative z-10">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="mx-auto bg-primary/10 border border-primary/20 text-primary p-4 rounded-2xl w-fit mb-4 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Sprout className="h-8 w-8 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80 dark:from-white dark:to-slate-200">
            Welcome to Kisan Alert
          </CardTitle>
          <CardDescription className="text-slate-400 mt-2 px-4">
            Configure your farm details to start receiving real-time soil, satellite, and weather advisories.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8 pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-slate-300">Farmer Name</Label>
              <Input
                id="name"
                placeholder="e.g. Gurpreet Singh"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                required
                className="rounded-xl border-emerald-950/20 bg-background/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-slate-300">Mobile Phone (with country code)</Label>
              <Input
                id="phone"
                placeholder="e.g. +919876543210"
                value={form.phone}
                onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                required
                className="rounded-xl border-emerald-950/20 bg-background/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-semibold text-slate-300">State</Label>
                <Select
                  value={form.state}
                  onValueChange={val =>
                    setForm(prev => ({
                      ...prev,
                      state: val,
                      district: STATES_AND_DISTRICTS[val]?.[0] || '',
                    }))
                  }
                >
                  <SelectTrigger id="state" className="rounded-xl border-emerald-950/20 bg-background/50 focus:ring-primary/20">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-background/95 backdrop-blur-md border-emerald-950/20">
                    {Object.keys(STATES_AND_DISTRICTS).map(st => (
                      <SelectItem key={st} value={st} className="hover:bg-primary/10 rounded-lg">
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="district" className="text-sm font-semibold text-slate-300">District</Label>
                <Select
                  value={form.district}
                  onValueChange={val => setForm(prev => ({ ...prev, district: val }))}
                >
                  <SelectTrigger id="district" className="rounded-xl border-emerald-950/20 bg-background/50 focus:ring-primary/20">
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-background/95 backdrop-blur-md border-emerald-950/20">
                    {(STATES_AND_DISTRICTS[form.state] || []).map(dt => (
                      <SelectItem key={dt} value={dt} className="hover:bg-primary/10 rounded-lg">
                        {dt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="text-sm font-semibold text-slate-300">Preferred Advisory Language</Label>
              <Select
                value={form.preferredLanguage}
                onValueChange={val => setForm(prev => ({ ...prev, preferredLanguage: val }))}
              >
                <SelectTrigger id="language" className="rounded-xl border-emerald-950/20 bg-background/50 focus:ring-primary/20">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-background/95 backdrop-blur-md border-emerald-950/20">
                  <SelectItem value="en" className="hover:bg-primary/10 rounded-lg">English</SelectItem>
                  <SelectItem value="hi" className="hover:bg-primary/10 rounded-lg">हिन्दी (Hindi)</SelectItem>
                  <SelectItem value="bn" className="hover:bg-primary/10 rounded-lg">বাংলা (Bengali)</SelectItem>
                  <SelectItem value="te" className="hover:bg-primary/10 rounded-lg">తెలుగు (Telugu)</SelectItem>
                  <SelectItem value="ta" className="hover:bg-primary/10 rounded-lg">தமிழ் (Tamil)</SelectItem>
                  <SelectItem value="mr" className="hover:bg-primary/10 rounded-lg">മराठी (Marathi)</SelectItem>
                  <SelectItem value="gu" className="hover:bg-primary/10 rounded-lg">ગુજરાતી (Gujarati)</SelectItem>
                  <SelectItem value="kn" className="hover:bg-primary/10 rounded-lg">കന്നಡ (Kannada)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              disabled={saving} 
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-12 rounded-xl mt-6 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                'Register & Complete Setup'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
