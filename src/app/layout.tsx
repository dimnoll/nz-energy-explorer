import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "nz-energy-explorer",
  description:
    "Weekday evening New Zealand wholesale electricity spikes and generation mix.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>
          <nav>
            <Link href="/">Home</Link>
            <Link href="/spikes">Spikes</Link>
            <Link href="/mix">Mix</Link>
          </nav>
        </header>
        {children}
        <footer>
          Price and generation figures are derived from EMI data. Attribution:
          www.emi.ea.govt.nz provided by the Electricity Authority (New
          Zealand), CC BY 4.0. Until a Gold snapshot is exported, pages use a
          tiny fixture, not the lakehouse tables.
        </footer>
      </body>
    </html>
  );
}
