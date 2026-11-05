import { Suspense } from "react";
import { Cormorant_Garamond, Jost, Pinyon_Script } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AnnouncementBar, AnnouncementShell } from "@/components/layout/AnnouncementBar";
import IntroLoader, { INTRO_SCRIPT } from "@/components/layout/IntroLoader";
import RevealObserver from "@/components/layout/RevealObserver";
import ChatLauncher from "@/components/chat/ChatLauncher";
import LiveUpdates from "@/components/layout/LiveUpdates";
import { getFooterPages, getShellCategories, getShellContent } from "@/lib/api/server";
import { footerShopFromCategories, navFromCategories } from "@/lib/content";
import { SITE_URL, STORE_NAME, STORE_TAGLINE } from "@/lib/config";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-display", display: "swap" });
const body = Jost({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-body", display: "swap" });
const accent = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--font-accent", display: "swap", preload: false });

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${STORE_NAME} — Premium Home Décor & Home Living`, template: `%s · ${STORE_NAME}` },
  description: "Thoughtfully curated home décor — vases, wall décor, candle stands, planters, photo frames and more — to make every corner beautiful. UPI and Cash on Delivery across India.",
  applicationName: STORE_NAME,
  openGraph: { siteName: STORE_NAME, type: "website", locale: "en_IN", description: STORE_TAGLINE },
};

export const viewport = {
  themeColor: "#252525",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  const [navigation, footer, footerPages, categories] = await Promise.all([getShellContent("navigation"), getShellContent("footer"), getFooterPages(), getShellCategories()]);
  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable} ${accent.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="sr-only z-[90] bg-olive-900 px-4 py-2 text-cream-50 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
          Skip to content
        </a>
        <IntroLoader />
        <Providers>
          <Suspense fallback={<AnnouncementShell />}>
            <AnnouncementBar />
          </Suspense>
          <Header nav={navigation?.items?.length ? navigation.items : navFromCategories(categories)} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer content={footer} extraLinks={footerPages} shopLinks={footerShopFromCategories(categories)} />
          <ChatLauncher />
          <LiveUpdates />
        </Providers>
        <RevealObserver />
      </body>
    </html>
  );
}
