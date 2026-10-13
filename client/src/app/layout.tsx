import type { Metadata } from "next";
import type { ReactNode } from "react";
import Providers from "@/components/Providers";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@carbon/styles/css/styles.css";
import "./styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Folio · Your next chapter", template: "%s · Folio" },
  description: "Give your experience a home. Build thoughtful, tailored CVs from your own career library.",
};
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}
