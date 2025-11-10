// import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";

// import Footer from "./spookify/components/footer";
// import { Providers } from "./spookify/components/Providers";
// import SiteHeaderClient from "./spookify/components/site-header-client";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// export const metadata: Metadata = {
//   title: 'Ai gifts',
//   description: 'Turn your art and ideas and transform with AI, then print.',
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body
//         className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-900`}
//       >
//       <Providers>
//       <SiteHeaderClient />
//       <main className="flex-grow">
//         {children}
//         </main>
//         <Footer />
//         </Providers>
//       </body>
//     </html>
//   );
// }


 import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
 import "./globals.css";

import Footer from "./spookify/components/footer";
import { Providers } from "./spookify/components/Providers";
import SiteHeaderClient from "./spookify/components/site-header-client";


import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Ai gifts',
  description: 'Turn your art and ideas and transform with AI, then print.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-900`}>
        <Providers >
          <SiteHeaderClient session={session} />   {/* ✅ pass it here */}
          <main className="flex-grow">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

