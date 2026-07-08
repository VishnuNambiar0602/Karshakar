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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-950/20 to-blue-950/25 bg-background">
      <Card className="max-w-md w-full border-primary/10 shadow-2xl backdrop-blur-md bg-card/95">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-3">
            <Sprout className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-foreground">Welcome to Kisan Alert</CardTitle>
          <CardDescription>
            Configure your farm details to start receiving real-time soil, satellite, and weather advisories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Farmer Name</Label>
              <Input
                id="name"
                placeholder="e.g. Gurpreet Singh"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Phone (with country code)</Label>
              <Input
                id="phone"
                placeholder="e.g. +919876543210"
                value={form.phone}
                onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
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
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(STATES_AND_DISTRICTS).map(st => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Select
                  value={form.district}
                  onValueChange={val => setForm(prev => ({ ...prev, district: val }))}
                >
                  <SelectTrigger id="district">
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent>
                    {(STATES_AND_DISTRICTS[form.state] || []).map(dt => (
                      <SelectItem key={dt} value={dt}>
                        {dt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Preferred Advisory Language</Label>
              <Select
                value={form.preferredLanguage}
                onValueChange={val => setForm(prev => ({ ...prev, preferredLanguage: val }))}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                  <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                  <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                  <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                  <SelectItem value="mr">മराठी (Marathi)</SelectItem>
                  <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
                  <SelectItem value="kn">കന്നഡ (Kannada)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={saving} className="w-full bg-primary hover:bg-primary/90 mt-6">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
