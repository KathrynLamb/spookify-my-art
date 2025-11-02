import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";
import "../globals.css"

// import Footer from "./spookify/components/footer";
import SiteHeader from "./components/site-header";
// import { Providers } from "./components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Spookify',
  description: 'Turn your art spooky, then print.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-900`}
      >
      {/* <Providers> */}
      <SiteHeader />
      <main className="flex-grow">
        {children}
        </main>
        {/* <Footer /> */}
        {/* </Providers> */}
      </body>
    </html>
  );
}






