import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { AnalyzeFlow } from "@/components/analyze/AnalyzeFlow";

export const metadata: Metadata = {
  title: "Find your color season",
  description: "Free on-device AI color analysis. Use your camera or a selfie — your photo never leaves your phone.",
  alternates: { canonical: "/analyze" },
};

/** The only page that loads the AI models (lazily, after the user picks camera or upload). */
export default function AnalyzePage() {
  return (
    <Container className="max-w-md py-8 sm:py-12">
      <AnalyzeFlow />
    </Container>
  );
}
