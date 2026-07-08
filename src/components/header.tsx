
"use client";

import Link from "next/link";
import { Globe2, LayoutDashboard, Settings, Mail, Menu, Sprout, Bell, Camera, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "./ui/button";
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { ContactSheet } from "./contact-sheet";
import { LanguageSwitcher } from "./language-switcher";
import { useLanguage } from "@/hooks/use-language";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

export function Header() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const [isContactOpen, setContactOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navClass = cn(
    "sticky top-0 z-50 w-full transition-all duration-300",
    isLandingPage && !isScrolled ? "bg-transparent text-white" : "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 text-foreground"
  );

  const buttonLinkClass = cn(
    isLandingPage && !isScrolled ? "text-white hover:bg-white/20" : ""
  );

  const navItems = [
    { href: "/", labelKey: "header.home", fallback: "Home", icon: Globe2 },
    { href: "/plots", labelKey: "header.plots", fallback: "Plots", icon: Sprout },
    { href: "/alerts", labelKey: "header.alerts", fallback: "Alerts", icon: Bell },
    { href: "/pest-check", labelKey: "header.pestCheck", fallback: "Pest Diagnostics", icon: Camera },
    { href: "/dashboard", labelKey: "header.dashboard", fallback: "Satellite View", icon: LayoutDashboard },
    { href: "/profile", labelKey: "header.profile", fallback: "Profile", icon: User },
    { href: "/settings", labelKey: "header.settings", fallback: "Settings", icon: Settings },
  ];

  return (
    <header className={navClass}>
      <div className="container flex h-16 items-center">
        <div className="mr-auto flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Globe2 className="h-6 w-6" />
            <span className="font-bold text-lg">{t('header.title')}</span>
          </Link>
        </div>

        {isLandingPage ? (
          /* Landing page: Logo + Login/Register buttons */
          <div className="flex items-center space-x-3">
            <LanguageSwitcher className={buttonLinkClass} />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className={cn(buttonLinkClass, "font-bold")}
              onClick={() => router.push("/login")}
            >
              Login
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              onClick={() => router.push("/register")}
            >
              Create Account
            </Button>
          </div>
        ) : (
          /* Internal pages: Full nav */
          <>
            <nav className="hidden md:flex items-center space-x-2">
              {navItems.map(item => (
                <Button
                  key={item.href}
                  variant="ghost"
                  asChild
                  className={cn(
                    buttonLinkClass,
                    pathname === item.href && "bg-primary/10 text-primary dark:text-primary font-bold"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4"/>
                    {t(item.labelKey) || item.fallback}
                  </Link>
                </Button>
              ))}
            </nav>

            <div className="flex items-center justify-end space-x-2 md:ml-4">
              <div className="hidden sm:flex items-center space-x-2">
                  <LanguageSwitcher className={buttonLinkClass} />
                  <ThemeToggle />
                  <Button variant="secondary" size="sm" onClick={() => setContactOpen(true)}>
                      <Mail className="mr-2 h-4 w-4" />
                      {t('header.contact')}
                  </Button>
              </div>

              <div className="md:hidden">
                  <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                      <SheetTrigger asChild>
                          <Button variant="ghost" size="icon" className={buttonLinkClass}>
                              <Menu className="h-6 w-6" />
                              <span className="sr-only">Open menu</span>
                          </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-[300px]">
                          <nav className="flex flex-col gap-4 mt-8">
                            {navItems.map(item => (
                              <SheetClose asChild key={item.href}>
                                <Link
                                  href={item.href}
                                  className={cn(
                                    "flex items-center gap-2 text-lg font-medium",
                                    pathname === item.href && "text-primary dark:text-primary font-bold"
                                  )}
                                >
                                  <item.icon className="h-5 w-5" /> {t(item.labelKey) || item.fallback}
                                </Link>
                              </SheetClose>
                            ))}
                            <SheetClose asChild>
                                <Button variant="ghost" className="w-full justify-start gap-2 text-lg font-medium p-0 h-auto" onClick={() => setContactOpen(true)}>
                                    <Mail className="h-5 w-5" /> {t('header.contact')}
                                </Button>
                            </SheetClose>
                            <div className="flex items-center justify-between pt-4 border-t">
                                <LanguageSwitcher />
                                <ThemeToggle />
                            </div>
                          </nav>
                      </SheetContent>
                  </Sheet>
              </div>
            </div>
          </>
        )}
      </div>
      <ContactSheet open={isContactOpen} onOpenChange={setContactOpen} />
    </header>
  );
}
