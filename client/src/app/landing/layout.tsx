import type { Metadata } from "next";
import type { ReactNode } from "react";
export const metadata: Metadata = { title: "Your story. Your next chapter.", description: "Give your experience a home. Try Folio and shape a thoughtful CV for your next opportunity.", openGraph: { title: "Folio · Your next chapter", description: "A home for your experience. A starting point for what comes next.", images: [{ url: "/images/career-desk.png", width: 1536, height: 1024 }] } };
export default function LandingLayout({ children }: { children: ReactNode }) { return children; }
