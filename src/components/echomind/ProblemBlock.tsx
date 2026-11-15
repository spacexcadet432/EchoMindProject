import Reveal from "./Reveal";

const items = [
  {
    quote: "Some thoughts only show up late at night.",
    caption: "You should still have somewhere to put them when they do.",
  },
  {
    quote: "You don't need to explain everything perfectly.",
    caption: "You can start in the middle and keep going from there.",
  },
  {
    quote: "Some conversations need more than one moment.",
    caption: "EchoMind keeps the thread so you can return when you're ready.",
  },
];

const ProblemBlock = () => {
  return (
    <section className="py-24 sm:py-32 border-t border-border">
      <div className="container">
        <Reveal>
          <p className="eyelet mb-16">A place to say what&apos;s been sitting with you</p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x md:divide-border divide-y md:divide-y-0 divide-border">
          {items.map((item, i) => (
            <Reveal key={i} delay={i * 0.08} className="px-0 py-10 md:py-0 md:px-10 first:md:pl-0 last:md:pr-0">
              <p className="font-display text-[28px] sm:text-[32px] leading-[1.18] text-foreground tracking-[-0.005em]">
                {item.quote}
              </p>
              <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
                {item.caption}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemBlock;
