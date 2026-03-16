import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthProvider from "@/providers/AuthProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Paddy AyG",
    default: "Paddy AyG",
  },
  description: "Sistema de gestión administrativa para Arrocera Aparicio y García Ltda. Control de ventas, inventario, clientes y finanzas.",
  applicationName: "Paddy AyG",
  authors: [{ name: "Arrocera Aparicio y García Ltda." }],
  keywords: ["ventas", "inventario", "gestión", "arroz", "ERP", "administración"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Paddy AyG",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1C2046",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
