import type { Metadata } from 'next';
import Script from 'next/script';
import {
  Geist,
  Geist_Mono,
  Playfair_Display,
  Instrument_Sans,
  Instrument_Serif,
} from 'next/font/google';
import './globals.css';
import { AuthProviderClient } from '@/lib/providers/AuthProvider.client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { WorkspaceProviderClient } from '@/lib/providers/WorkspaceProvider.client';
import { ToastProvider } from '@/lib/contexts/ToastContext';
import { ToastContainer } from '@/components/ui/ToastContainer';
import SettingsProviderWrapper from '@/lib/providers/SettingsProvider.client';
import { ReferenceProviderClient } from '@/lib/providers/ReferenceProvider.client';
import { SocketProvider } from '@/lib/contexts/SocketContext';
import QueryProvider from '@/lib/providers/QueryProvider';
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal';
import { GlobalShortcutsProvider } from '@/components/ui/GlobalShortcutsProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const playfairDisplay = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
});

const instrumentSans = Instrument_Sans({
  variable: '--font-instrument-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
});

export const metadata: Metadata = {
  title: 'Lawvriksh - Legal Content Platform',
  description: 'Your rightful place in the creator economy',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        {/* Google Translate Scripts - must load before hydration */}
        <Script src="/assets/scripts/lang-config.js" strategy="beforeInteractive" />
        <Script src="/assets/scripts/translation.js" strategy="beforeInteractive" />
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=TranslateInit"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${instrumentSans.variable} ${instrumentSerif.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <QueryProvider>
          {/* Hidden Google Translate element - required for translation engine, placed at end of body */}
          <div
            id="google_translate_element"
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-9999px',
              left: '-9999px',
              width: '0',
              height: '0',
              overflow: 'hidden',
              visibility: 'hidden',
              pointerEvents: 'none',
            }}
          />
          <SettingsProviderWrapper>
            <ReferenceProviderClient>
              <ToastProvider>
                <SocketProvider>
                  <WorkspaceProviderClient>
                    <ProtectedRoute>
                      <GlobalShortcutsProvider>
                        {children}
                        <KeyboardShortcutsModal />
                        <ToastContainer />
                      </GlobalShortcutsProvider>
                    </ProtectedRoute>
                  </WorkspaceProviderClient>
                </SocketProvider>
              </ToastProvider>
            </ReferenceProviderClient>
          </SettingsProviderWrapper>
        </QueryProvider>
      </body>
    </html>
  );
}
