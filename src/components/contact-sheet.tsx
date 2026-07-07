"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { CheckCircle, Mail } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface ContactSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ContactSheet({ open, onOpenChange }: ContactSheetProps) {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setTimeout(() => {
        setSubmitted(false);
      }, 300);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('contact.title')}</SheetTitle>
          <SheetDescription>
            {t('contact.description')}
          </SheetDescription>
        </SheetHeader>
        {submitted ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <CheckCircle className="h-20 w-20 text-green-500" />
                <h3 className="text-xl font-semibold">{t('contact.submitted.title')}</h3>
                <p className="text-muted-foreground">{t('contact.submitted.description')}</p>
                 <Button onClick={() => handleOpenChange(false)}>{t('contact.submitted.close')}</Button>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">{t('contact.name')}</Label>
                    <Input id="name" placeholder={t('contact.namePlaceholder')} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">{t('contact.email')}</Label>
                    <Input id="email" type="email" placeholder={t('contact.emailPlaceholder')} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="phone">{t('contact.phone')}</Label>
                    <Input id="phone" type="tel" placeholder={t('contact.phonePlaceholder')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="message">{t('contact.message')}</Label>
                    <Textarea id="message" placeholder={t('contact.messagePlaceholder')} required />
                </div>
                 <SheetFooter>
                    <SheetClose asChild>
                        <Button type="button" variant="outline">{t('contact.cancel')}</Button>
                    </SheetClose>
                    <Button type="submit">
                        <Mail className="mr-2 h-4 w-4" />
                        {t('contact.send')}
                    </Button>
                </SheetFooter>
            </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
