
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { ContactSheet } from "@/components/contact-sheet";

export default function SettingsPage() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isContactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleNotificationToggle = async (checked: boolean) => {
    if (!("Notification" in window)) {
      toast({ title: t('settings.notifications.unsupported.title'), description: t('settings.notifications.unsupported.description'), variant: "destructive" });
      return;
    }

    if (checked) {
      if (permission === "granted") {
        setNotificationsEnabled(true);
      } else if (permission !== "denied") {
        const newPermission = await Notification.requestPermission();
        setPermission(newPermission);
        if (newPermission === "granted") {
          setNotificationsEnabled(true);
          toast({ title: t('settings.notifications.success.title'), description: t('settings.notifications.success.description') });
        } else {
            toast({ title: t('settings.notifications.blocked.title'), description: t('settings.notifications.blocked.info'), variant: "destructive" });
        }
      } else {
         toast({ title: t('settings.notifications.blocked.title'), description: t('settings.notifications.blocked.description'), variant: "destructive" });
      }
    } else {
      setNotificationsEnabled(false);
      toast({ title: t('settings.notifications.disabled.title'), description: t('settings.notifications.disabled.description') });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-4 md:p-6">
            <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>{t('settings.title')}</CardTitle>
                <CardDescription>
                {t('settings.description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">{t('settings.darkMode')}</Label>
                <ThemeToggle />
                </div>
                <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <Label htmlFor="notifications">{t('settings.satelliteAlerts.label')}</Label>
                    <p className="text-xs text-muted-foreground">{t('settings.satelliteAlerts.description')}</p>
                </div>
                <Switch 
                    id="notifications" 
                    checked={notificationsEnabled}
                    onCheckedChange={handleNotificationToggle}
                />
                </div>

                <div className="space-y-2 pt-6">
                <h3 className="text-lg font-semibold">{t('settings.about.title')}</h3>
                <p className="text-sm text-muted-foreground">
                    <strong>{t('header.title')}</strong>
                </p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {t('footer.copyright')}
                </p>
                </div>
            </CardContent>
            </Card>
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
