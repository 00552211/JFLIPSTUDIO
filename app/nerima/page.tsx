import type { Metadata } from "next";
import { StudioPage } from "@/components/studio-page";
import { NERIMA } from "@/lib/studios";

export const metadata: Metadata = {
  title: NERIMA.title,
  description: NERIMA.description,
  openGraph: { type: "website", title: NERIMA.title, description: NERIMA.description, images: ["/connect/og.jpg"] },
  twitter: { card: "summary_large_image", images: ["/connect/og.jpg"] },
};

export default function NerimaPage() {
  return <StudioPage studio={NERIMA} />;
}
