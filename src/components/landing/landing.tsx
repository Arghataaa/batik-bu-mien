"use client";

import { HeroSection } from "./hero-section";
import { CategoriesSection } from "./categories-section";
import { CatalogPreviewSection } from "./catalog-preview-section";
import { StorySection } from "./story-section";
import { CTASection } from "./cta-section";
import { LandingFooter } from "./landing-footer";
import { LandingNavbar } from "./landing-navbar";

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <LandingNavbar />
      <main className="flex-1">
        <HeroSection />
        <CategoriesSection />
        <CatalogPreviewSection />
        <StorySection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
