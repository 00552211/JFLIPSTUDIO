import type { Metadata } from "next";
import { StudioPage } from "@/components/studio-page";
import { IKEBUKURO } from "@/lib/studios";

export const metadata: Metadata = {
  title: IKEBUKURO.title,
  description: IKEBUKURO.description,
  openGraph: { type: "website", title: IKEBUKURO.title, description: IKEBUKURO.description, images: ["/connect/og.jpg"] },
  twitter: { card: "summary_large_image", images: ["/connect/og.jpg"] },
};

export default function IkebukuroPage() {
  return <StudioPage studio={IKEBUKURO} />;
}
