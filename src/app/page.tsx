import { SiteHeader } from "@/components/SiteHeader";
import { HeroSection } from "@/components/HeroSection";
import { DiscoveryWorkspace } from "@/components/DiscoveryWorkspace";
import { HowItWorks } from "@/components/HowItWorks";
import { AboutSection } from "@/components/AboutSection";
import { SiteFooter } from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <div id="top" className="min-h-screen bg-bragi-cream">
      <div className="hero-surface">
        <SiteHeader />
        <HeroSection />
      </div>
      <DiscoveryWorkspace />
      <HowItWorks />
      <AboutSection />
      <SiteFooter />
    </div>
  );
}
