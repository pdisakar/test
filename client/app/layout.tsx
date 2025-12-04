import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";  // ← change here
import "./globals.css";
import Header from "@/components/Utils/Header/Header";

const instrumentSans = Instrument_Sans({                // ← and here
  variable: "--primaryfont",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TravelApp - Explore the World",
  description: "Discover amazing travel packages and destinations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} antialiased`}>
        <Header />
        {children}
      </body>
    </html>
  );
}
