import Link from "next/link";
import { Icon } from "../shell/icons";

export default function Footer() {
  return (
    <footer className="tn-footer">
      <div className="tn-footer-inner">
        <div>
          <Link className="tn-footer-brand" href="/">TechNeeds IGDTUW</Link>
          <p>The peer-led tech community at IGDTUW.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/#mentorship">Mentorship</Link>
          <Link href="/team">Team</Link>
          <Link href="/faq">FAQs</Link>
          <a href="mailto:techneedsigdtuw@gmail.com">Contact <Icon name="diagonal" /></a>
        </nav>
      </div>
    </footer>
  );
}
