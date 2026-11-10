"use client";

import Link from "next/link";
import WorkspaceBrand from "../shell/WorkspaceBrand";
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

  const menteeArea = pathname === '/dashboard' || pathname.startsWith('/mentee') || pathname === '/change-password';
  const currentLinks = links.map(link => link.label === 'Profile' && menteeArea ? { ...link, href: '/mentee/profile' } : link);

  return (
    <header className="tn-header">
      <div className="tn-header-inner">
        <WorkspaceBrand onClick={() => setMenuOpen(false)} />
        <button className="tn-menu" type="button" aria-expanded={menuOpen} aria-controls="tn-nav" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>
          <Icon name={menuOpen ? "close" : "menu"} />
        </button>
        <nav id="tn-nav" aria-label="Main navigation" className={menuOpen ? "tn-nav tn-nav-open" : "tn-nav"}>
          {currentLinks.map(({ href, label }) => (
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
