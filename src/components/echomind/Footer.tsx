import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border py-8">
      <div className="container flex flex-col sm:flex-row items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            EchoMind
          </span>
          <p className="text-sm text-muted-foreground">Some thoughts take longer to say.</p>
          <p className="text-sm text-muted-foreground">
            Built for the conversations people usually keep to themselves.
          </p>
          <p className="text-sm text-muted-strong">Local. Personal. On this device.</p>
        </div>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/safety" className="hover:text-foreground transition-colors duration-150">Safety</Link>
          <Link to="/app/conversations" className="hover:text-foreground transition-colors duration-150">Start talking</Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
