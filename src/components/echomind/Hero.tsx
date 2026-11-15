import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import AmbientVisual from "./AmbientVisual";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16">
      <div className="container grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-7"
        >
          <p className="eyelet mb-8">A quiet place to talk honestly</p>

          <h1 className="font-display font-light text-foreground leading-[1.02] tracking-[-0.01em] text-[44px] sm:text-[56px] lg:text-[72px]">
            Someone who
            <br />
            actually <em className="italic font-normal">listens.</em>
          </h1>

          <p className="mt-8 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
            EchoMind is a personal reflection space saved in this browser for the
            moments you can&apos;t keep everything in your head anymore.
          </p>

          <div className="mt-10 flex items-center gap-6 flex-wrap">
            <Link
              to="/app/conversations"
              className="group inline-flex items-center h-12 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium tracking-tight transition-all duration-150 hover:bg-primary-hover hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Start talking
              <span className="ml-2 transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </Link>
            <a href="#how-it-works" className="text-xs text-muted-strong tracking-wide hover:text-foreground transition-colors duration-150">
              See how it works
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="lg:col-span-5"
        >
          <AmbientVisual />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
