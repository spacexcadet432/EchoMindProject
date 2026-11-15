import Reveal from "./Reveal";
import { Link } from "react-router-dom";

const steps = [
  "You don't have to phrase it perfectly.",
  "The conversation continues when you come back.",
  "Start anywhere.",
];

const OnboardingFlow = () => {
  return (
    <section className="py-24 sm:py-28 border-t border-border">
      <div className="container">
        <Reveal>
          <p className="eyelet mb-12">Onboarding</p>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, idx) => (
            <Reveal key={step} delay={idx * 0.08}>
              <article className="rounded-lg border border-border bg-surface p-6">
                <p className="font-display text-[20px] leading-[1.3] text-foreground">{step}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.2}>
          <div className="mt-8">
            <Link
              to="/app/conversations"
              className="inline-flex items-center h-11 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium tracking-tight transition-all duration-150 hover:bg-primary-hover hover:-translate-y-px"
            >
              Start a local reflection
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default OnboardingFlow;
