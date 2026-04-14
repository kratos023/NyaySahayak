// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import AnimatedBackground from "@/components/AnimatedBackground";
import FloatingToasts from "@/components/FloatingToasts";

export const metadata: Metadata = {
  title: "Nyay-Sahayak — AI Legal Assistant",
  description: "Multilingual AI-powered legal assistance for India",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-screen overflow-hidden relative">
        <AnimatedBackground />
        <LanguageProvider>
          <AuthProvider>
            <div className="relative z-10 h-screen">
              {children}
            </div>
            <FloatingToasts />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
