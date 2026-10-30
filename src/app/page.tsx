import { SiteHeader } from "@/components/SiteHeader";
import { HeroSection } from "@/components/HeroSection";
import { TasteJourney } from "@/components/TasteJourney";
import { HowItWorks } from "@/components/HowItWorks";
import { AboutSection } from "@/components/AboutSection";
import { SiteFooter } from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <div id="top" className="min-h-screen overflow-x-hidden bg-bragi-cream">
      <SiteHeader />
      <div className="hero-surface relative -mt-[4.25rem] pt-[4.25rem]">
        <HeroSection />
      </div>
      <TasteJourney />
      <HowItWorks />
      <AboutSection />
      <SiteFooter />
    </div>
  );
}
