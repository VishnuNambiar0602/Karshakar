
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
    <header className={cn(navClass, "backdrop-blur-md border-emerald-950/10")}>
      <div className="container flex h-16 items-center px-4 md:px-6">
        <div className="mr-auto flex items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="bg-primary/10 p-2 rounded-xl border border-primary/20 group-hover:bg-primary/20 transition-all duration-300">
              <Globe2 className="h-5 w-5 text-primary group-hover:rotate-45 transition-transform duration-500" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 dark:from-white dark:to-slate-200">
              {t('header.title')}
            </span>
          </Link>
        </div>

        {isLandingPage ? (
          /* Landing page: Logo + Login/Register buttons */
          <div className="flex items-center space-x-3">
            <LanguageSwitcher className={cn(buttonLinkClass, "rounded-xl hover:bg-primary/5")} />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className={cn(buttonLinkClass, "font-bold rounded-xl hover:bg-primary/5 hover:text-primary transition-all duration-200")}
              onClick={() => router.push("/login")}
            >
              Login
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300"
              onClick={() => router.push("/register")}
            >
              Create Account
            </Button>
          </div>
        ) : (
          /* Internal pages: Full nav */
          <>
            <nav className="hidden md:flex items-center space-x-1.5">
              {navItems.map(item => (
                <Button
                  key={item.href}
                  variant="ghost"
                  asChild
                  className={cn(
                    "rounded-xl transition-all duration-300 hover:bg-primary/5 hover:text-primary",
                    buttonLinkClass,
                    pathname === item.href 
                      ? "bg-primary/10 text-primary dark:text-primary font-bold border border-primary/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                      : "text-muted-foreground"
                  )}
                >
                  <Link href={item.href} className="flex items-center">
                    <item.icon className="mr-1.5 h-4 w-4 transition-transform duration-300 group-hover:scale-110"/>
                    {t(item.labelKey) || item.fallback}
                  </Link>
                </Button>
              ))}
            </nav>

            <div className="flex items-center justify-end space-x-2 md:ml-4">
              <div className="hidden sm:flex items-center space-x-2">
                  <LanguageSwitcher className={cn(buttonLinkClass, "rounded-xl")} />
                  <ThemeToggle />
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="rounded-xl border hover:bg-primary/5 hover:text-primary transition-all duration-300"
                    onClick={() => setContactOpen(true)}
                  >
                      <Mail className="mr-1.5 h-4 w-4" />
                      {t('header.contact')}
                  </Button>
              </div>

              <div className="md:hidden flex items-center gap-2">
                  <ThemeToggle />
                  <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                      <SheetTrigger asChild>
                          <Button variant="ghost" size="icon" className={cn(buttonLinkClass, "rounded-xl")}>
                              <Menu className="h-6 w-6" />
                              <span className="sr-only">Open menu</span>
                          </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-[300px] border-emerald-950/20 bg-background/95 backdrop-blur-xl">
                          <nav className="flex flex-col gap-4 mt-8">
                            {navItems.map(item => (
                              <SheetClose asChild key={item.href}>
                                <Link
                                  href={item.href}
                                  className={cn(
                                    "flex items-center gap-3 text-base font-bold py-2 px-3 rounded-xl transition-all duration-200",
                                    pathname === item.href 
                                      ? "bg-primary/10 text-primary border border-primary/20" 
                                      : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                                  )}
                                >
                                  <item.icon className="h-5 w-5" /> {t(item.labelKey) || item.fallback}
                                </Link>
                              </SheetClose>
                            ))}
                            <SheetClose asChild>
                                <Button 
                                  variant="ghost" 
                                  className="w-full justify-start gap-3 text-base font-bold py-2 px-3 h-auto rounded-xl hover:bg-primary/5 hover:text-primary" 
                                  onClick={() => setContactOpen(true)}
                                >
                                    <Mail className="h-5 w-5" /> {t('header.contact')}
                                </Button>
                            </SheetClose>
                            <div className="flex items-center justify-between pt-4 border-t border-emerald-950/10">
                                <LanguageSwitcher />
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
