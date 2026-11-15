import Reveal from "./Reveal";

const MemoryStrip = () => {
  return (
    <section id="memory" className="py-24 sm:py-28">
      <div className="container">
        <Reveal>
          <div className="rounded-lg border border-border bg-surface-2 p-10 md:p-14 grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8">
              <p className="eyelet mb-5">Memory / on this device</p>
              <h3 className="font-display text-[32px] sm:text-[36px] leading-[1.15] tracking-[-0.005em] text-foreground">
                Your reflections stay in this browser.
              </h3>
              <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground max-w-xl">
                EchoMind saves your reflections on this device so you can return to them
                in this browser. There is no account or cloud sync.
              </p>
            </div>
            <div className="md:col-span-4 md:text-right">
              <p className="text-sm text-muted-foreground">Local storage is not encrypted.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default MemoryStrip;
