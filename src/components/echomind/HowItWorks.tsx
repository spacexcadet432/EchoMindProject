import Reveal from "./Reveal";

const steps = [
  {
    n: "01",
    title: "Open EchoMind",
    body: "No setup. No pressure. Just open the conversation.",
  },
  {
    n: "02",
    title: "Say what's on your mind",
    body: "Messy thoughts, relationship confusion, overthinking, things you never sent — all of it belongs here.",
  },
  {
    n: "03",
    title: "Return on this device",
    body: "Your reflections are saved in this browser. They do not sync across devices and can be cleared at any time.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-28 sm:py-36 bg-foreground text-background">
      <div className="container">
        <Reveal>
          <p
            className="font-mono text-[11px] tracking-[0.18em] uppercase mb-16"
            style={{ color: "hsl(var(--background) / 0.55)" }}
          >
            Simple by design.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div className="relative">
                <span
                  className="font-display text-[120px] leading-none absolute -top-8 -left-2 select-none"
                  style={{ color: "hsl(var(--background) / 0.08)" }}
                  aria-hidden="true"
                >
                  {s.n}
                </span>
                <div className="relative pt-12">
                  <h3 className="font-display text-[28px] leading-tight tracking-[-0.005em]">
                    {s.title}
                  </h3>
                  <p
                    className="mt-5 text-[15px] leading-relaxed max-w-sm"
                    style={{ color: "hsl(var(--background) / 0.65)" }}
                  >
                    {s.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
