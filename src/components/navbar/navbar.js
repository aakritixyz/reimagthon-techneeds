"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "../shell/icons";

const links = [
  { href: "/", label: "Home" },
  { href: "/#mentorship", label: "Mentorship" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/team", label: "Team" },
  { href: "/faq", label: "FAQs" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="tn-header">
      <div className="tn-header-inner">
        <Link className="tn-brand" href="/" onClick={() => setMenuOpen(false)}>
          <svg className="tn-brand-mark" viewBox="0 0 40 40" width="40" height="40" fill="none" aria-hidden="true">
            <rect width="40" height="40" rx="10" fill="#16466e" />
            <circle cx="20" cy="20" r="10" stroke="#aaddff" strokeWidth="1.5" />
            <path d="M11 23h6l4-6h8M20 10v4m0 12v4" stroke="#aaddff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="11" cy="23" r="2" fill="#eef8ff" />
            <circle cx="29" cy="17" r="2" fill="#eef8ff" />
          </svg>
          <span><strong>TechNeeds</strong><small>IGDTUW</small></span>
        </Link>
        <button className="tn-menu" type="button" aria-expanded={menuOpen} aria-controls="tn-nav" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>
          <Icon name={menuOpen ? "close" : "menu"} />
        </button>
        <nav id="tn-nav" aria-label="Main navigation" className={menuOpen ? "tn-nav tn-nav-open" : "tn-nav"}>
          {links.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setMenuOpen(false)}>
              {label}
            </Link>
          ))}
          <Link className="tn-nav-signin" href="/techboard" aria-current={pathname === "/techboard" ? "page" : undefined} onClick={() => setMenuOpen(false)}>
            Sign in <Icon name="diagonal" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
