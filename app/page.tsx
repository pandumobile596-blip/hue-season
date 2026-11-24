import { site } from "@/config/site";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { PrivacyHighlight } from "@/components/marketing/PrivacyHighlight";
import { SeasonGrid } from "@/components/marketing/SeasonGrid";
import { Faq, type FaqItem } from "@/components/marketing/Faq";
import { FinalCta } from "@/components/marketing/FinalCta";

const faq: FaqItem[] = [
  {
    q: "Is it accurate?",
    a: "It's a well-informed starting point, not a final verdict. The AI measures your skin undertone, eye color, hair color and contrast, then matches them to the closest of the 12 seasons. Lighting matters a lot — daylight from a window gives the best result. We also show your second-closest season so you can compare both palettes on yourself with live draping.",
  },
  {
    q: "Is it really free?",
    a: `Yes. ${site.name} is completely free, with no sign-up, no trial and no payment details. Just open the page and start.`,
  },
  {
    q: "Do you store my photo?",
    a: "No. Your camera feed and photos are processed entirely inside your browser on your own device. Nothing is uploaded to a server, saved, or shared — we never see your face. Only your season result is remembered on your phone so a refresh doesn't lose it.",
  },
  {
    q: "Does it work for every skin tone?",
    a: "Yes. The analysis is designed for the full range of skin tones, from very fair to very deep. Any skin depth can belong to many seasons — undertone, contrast and how soft or bright your coloring is matter just as much as depth.",
  },
  {
    q: "What are the 12 seasons?",
    a: "Seasonal color analysis groups people into Spring, Summer, Autumn and Winter, each split into three sub-seasons (like Soft Autumn or Bright Winter). Each season has a palette of colors that harmonize with your natural coloring.",
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <PrivacyHighlight />
      <SeasonGrid />
      <Faq items={faq} />
      <FinalCta />
    </>
  );
}
