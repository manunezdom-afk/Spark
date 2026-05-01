import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spark — Entrenador cognitivo",
  description: "Motor de aprendizaje activo. Cinco engines para construir memoria duradera.",
  manifest: "/manifest.json",
  applicationName: "Spark",
  appleWebApp: { capable: true, title: "Spark", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#07080B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="bg-spark-radial min-h-full antialiased">
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "rgba(12, 14, 19, 0.92)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgb(245,246,248)",
              backdropFilter: "blur(16px)",
            },
          }}
        />
      </body>
    </html>
  );
}
