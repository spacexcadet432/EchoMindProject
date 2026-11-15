import Navbar from "@/components/echomind/Navbar";
import Hero from "@/components/echomind/Hero";
import ProblemBlock from "@/components/echomind/ProblemBlock";
import HowItWorks from "@/components/echomind/HowItWorks";
import OnboardingFlow from "@/components/echomind/OnboardingFlow";
import MemoryStrip from "@/components/echomind/MemoryStrip";
import FinalCTA from "@/components/echomind/FinalCTA";
import Footer from "@/components/echomind/Footer";

const Index = () => {
  return (
    <main className="bg-background text-foreground min-h-screen antialiased">
      <Navbar />
      <Hero />
      <ProblemBlock />
      <HowItWorks />
      <OnboardingFlow />
      <MemoryStrip />
      <FinalCTA />
      <Footer />
    </main>
  );
};

export default Index;
