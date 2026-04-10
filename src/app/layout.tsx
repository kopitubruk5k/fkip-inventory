import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FKIP UMS — Sistem Peminjaman Alat & Ruangan",
  description:
    "Platform digital untuk peminjaman alat laboratorium dan ruangan di Fakultas Keguruan dan Ilmu Pendidikan Universitas Muhammadiyah Surakarta.",
  keywords: ["FKIP", "UMS", "peminjaman alat", "booking ruangan", "inventaris"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}>
        {children}
      </body>
    </html>
  );
}
