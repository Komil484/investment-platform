import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  return {
    // Production builds go to their own folder so `npm run dev` and a
    // production server can run side by side without overwriting each other.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next" : ".next-prod",
  };
}
