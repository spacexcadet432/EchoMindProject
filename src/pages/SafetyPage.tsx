import Navbar from "@/components/echomind/Navbar";
import Footer from "@/components/echomind/Footer";

const SafetyPage = () => {
  return (
    <main className="bg-background text-foreground min-h-screen antialiased">
      <Navbar />
      <section className="pt-28 pb-20">
        <div className="container max-w-4xl">
          <p className="eyelet mb-4">Safety</p>
          <h1 className="font-display font-light text-foreground leading-[1.05] tracking-[-0.01em] text-[44px] sm:text-[56px]">
            Conversation, with clear boundaries.
          </h1>
          <p className="mt-6 text-[16px] leading-relaxed text-muted-foreground max-w-3xl">
            EchoMind is designed for conversation and reflection. It is not equipped to help in situations involving immediate danger, self-harm, or crisis.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Reflections are stored in this browser only. They are not encrypted or synced to other devices, and anyone with access to this browser may be able to read them. Clear them from the app menu or your browser data.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="container grid gap-6 md:grid-cols-3">
          <article className="rounded-lg border border-border bg-surface p-6">
            <p className="eyelet mb-3">Product boundaries</p>
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              EchoMind is a local reflection space. It does not provide emergency intervention or urgent response.
            </p>
          </article>
          <article className="rounded-lg border border-border bg-surface p-6">
            <p className="eyelet mb-3">Crisis support</p>
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              If you may be in immediate danger, please contact local emergency services or a trusted person right away.
            </p>
          </article>
          <article className="rounded-lg border border-border bg-surface p-6">
            <p className="eyelet mb-3">Emergency resources</p>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted-foreground">
              <p>
                iCall India: <a className="text-foreground hover:underline" href="https://icallhelpline.org/">icallhelpline.org</a>
              </p>
              <p>
                Vandrevala Foundation: <a className="text-foreground hover:underline" href="https://www.vandrevalafoundation.com/">vandrevalafoundation.com</a>
              </p>
            </div>
          </article>
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default SafetyPage;
