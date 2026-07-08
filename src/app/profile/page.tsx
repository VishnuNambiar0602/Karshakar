'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { ContactSheet } from '@/components/contact-sheet';
import { getFarmerProfileAction, updateFarmerProfileAction } from '@/lib/actions';
import { STATES_AND_DISTRICTS } from '@/lib/constants';
import { User, Loader2, Save } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isContactOpen, setContactOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    state: '',
    district: '',
    preferredLanguage: 'en',
  });

  useEffect(() => {
    getFarmerProfileAction().then(res => {
      if (!res.data) {
        toast({
          title: 'No Profile Found',
          description: 'Please complete onboarding first.',
          variant: 'destructive',
        });
        router.push('/onboarding');
        return;
      }
      setForm({
        name: res.data.name,
        phone: res.data.phone,
        state: res.data.state,
        district: res.data.district,
        preferredLanguage: res.data.preferredLanguage,
      });
      setLoading(false);
    });
  }, [router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await updateFarmerProfileAction(form);
    setSaving(false);

    if (res.error) {
      toast({
        title: 'Update Failed',
        description: res.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile Updated',
        description: 'Your account details have been saved.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary p-2 rounded-full">
                <User className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{t('profile.title') || 'My Profile'}</CardTitle>
                <CardDescription>
                  {t('profile.description') || 'Manage your account details and preferences.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
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
                <Label htmlFor="phone">Mobile Phone</Label>
                <Input
                  id="phone"
                  placeholder="e.g. +919876543210"
                  value={form.phone}
                  onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  Format must include `+` and country prefix (e.g., +91 for India).
                </p>
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
                    <SelectItem value="mr">മरാठी (Marathi)</SelectItem>
                    <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
                    <SelectItem value="kn">കന്നഡ (Kannada)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={saving} className="w-full bg-primary hover:bg-primary/90 mt-6">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <footer id="contact" className="py-6 w-full shrink-0 border-t">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <nav className="flex gap-4 sm:gap-6">
            <Link href="/#about" className="text-xs hover:underline underline-offset-4 text-muted-foreground">{t('footer.about')}</Link>
            <Link href="#contact" className="text-xs hover:underline underline-offset-4 text-muted-foreground" onClick={(e) => { e.preventDefault(); setContactOpen(true) }}>{t('footer.contact')}</Link>
          </nav>
          <p className="text-xs text-muted-foreground text-center">
            {t('footer.copyright')}
          </p>
          <div className="w-24 hidden sm:block"></div>
        </div>
      </footer>
      <ContactSheet open={isContactOpen} onOpenChange={setContactOpen} />
    </div>
  );
}
