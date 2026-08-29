import React from "react";
import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";
import DiscoverSection from "./DiscoverSection";
import CallToActionSections from "./CallToActionSections";
import FooterSection from "./FooterSection";
import FirstVisitModal from "@/components/FirstVisitModal";

const Landing = () => {
  return (
    <div>
      <FirstVisitModal />
      <HeroSection />
      <FeaturesSection />
      <DiscoverSection />
      <CallToActionSections />
      <FooterSection />
    </div>
  );
};

export default Landing;
