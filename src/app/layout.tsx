
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers";

export const metadata: Metadata = {
  title: "Kisan Alert - Smart Farmer Advisory",
  description: "Real-time satellite weather, soil moisture analysis and pest diagnostics for farmers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('SW registered:', reg.scope);
                  }).catch(function(err) {
                    console.error('SW failed:', err);
                  });
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
