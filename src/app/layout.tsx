import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationBanner } from "@/components/notifications/NotificationBanner";

export const metadata: Metadata = {
  title: "Signal.会員サイト",
  description: "Signal. 会員サイトです",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <NotificationBanner />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
