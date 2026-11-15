import Reveal from "./Reveal";

const MemoryStrip = () => {
  return (
    <section id="memory" className="py-24 sm:py-28">
      <div className="container">
        <Reveal>
          <div className="rounded-lg border border-border bg-surface-2 p-10 md:p-14 grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8">
              <p className="eyelet mb-5">Memory / continuity</p>
              <h3 className="font-display text-[32px] sm:text-[36px] leading-[1.15] tracking-[-0.005em] text-foreground">
                The difference is that it remembers.
              </h3>
              <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground max-w-xl">
                Most apps reset every conversation. EchoMind keeps the thread alive.
                The people you mention, the situations that keep returning, the things
                you&apos;re still trying to untangle — they stay part of the conversation.
              </p>
            </div>
            <div className="md:col-span-4 md:text-right">
              <p className="text-sm text-muted-foreground">Memory is part of the premium experience.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default MemoryStrip;
