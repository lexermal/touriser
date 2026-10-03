import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";

// Landing page only: characterful serif headlines, clean body, mono for "ticket" details.
export const displayFont = Fraunces({ subsets: ["latin"], variable: "--font-display", axes: ["SOFT", "WONK", "opsz"] });
export const bodyFont = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-body" });
export const monoFont = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
