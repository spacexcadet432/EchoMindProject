import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import { useAuth } from "@/contexts/AuthContext";

const FinalCTA = () => {
  const { user } = useAuth();
  const startTalkingTo = user ? "/app/conversations" : "/auth/sign-in";

  return (
    <section id="safety" className="py-32 sm:py-40 border-t border-border">
      <div className="container max-w-3xl">
        <Reveal>
          <p className="eyelet mb-10">Safety</p>
          <h2 className="font-display text-[44px] sm:text-[60px] leading-[1.05] tracking-[-0.01em] text-foreground">
            Quiet, present, and clear about <em className="italic font-normal">boundaries.</em>
          </h2>
          <p className="mt-6 text-[15px] text-muted-foreground max-w-2xl leading-relaxed">
            EchoMind is designed for conversation and reflection. It is not equipped
            to help in situations involving immediate danger, self-harm, or crisis.
          </p>
          <div className="mt-10 flex items-center gap-6">
            <a href="/safety" className="text-sm text-primary hover:text-primary-hover transition-colors duration-150">
              Read safety information
            </a>
            <Link to={startTalkingTo} className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150">
              Start talking
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default FinalCTA;
