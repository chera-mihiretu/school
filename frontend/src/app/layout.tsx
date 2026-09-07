import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Newsreader,
  Spline_Sans,
  Spline_Sans_Mono,
} from "next/font/google";
import { ThemeProvider } from "@/features/ui/theme-provider";
import { THEME_BOOTSTRAP_SCRIPT } from "@/features/ui/theme-script";
import "./globals.css";

const splineSans = Spline_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-spline-sans",
});

const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-spline-mono",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bricolage",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: "School",
  description: "One platform, many independent schools.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/logo/favicon.svg", type: "image/svg+xml" },
      { url: "/logo/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/logo/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${splineSans.variable} ${splineMono.variable} ${bricolage.variable} ${newsreader.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
