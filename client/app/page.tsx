import type { Metadata } from "next";
import { TrinetraDashboard } from "./trinetra-dashboard";

export const metadata: Metadata = {
  title: "Trinetra Operations Console",
  description: "MVP dashboard mapped to the Trinetra surveillance backend.",
};

export default function Home() {
  return <TrinetraDashboard />;
}
