"use client";

import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faInstagram, faLinkedin, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import "../../lib/fontawesome";
import { Icon } from "../shell/icons";
import { teamGroups } from "./members";
import styles from "./directory.module.css";

const socialProfiles = [
  { key: "linkedin", name: "LinkedIn", icon: faLinkedin },
  { key: "github", name: "GitHub", icon: faGithub },
  { key: "instagram", name: "Instagram", icon: faInstagram },
  { key: "x", name: "X", icon: faXTwitter },
];

const [founders, ...coreGroups] = teamGroups;
const coreCount = coreGroups.reduce((total, group) => total + group.members.length, 0);

function portraitUrl(member, width) {
  const cloud = member.cloud ?? "dcec61lxq";
  return `https://res.cloudinary.com/${cloud}/image/upload/c_fill,g_auto,w_${width},h_${width * 1.25},q_auto,f_auto/${member.photo}`;
}

function MemberCard({ member, index, founder }) {
  const profiles = socialProfiles.filter(({ key }) => member.socials?.[key]);
  const initials = member.name.split(" ").slice(0, 2).map((word) => word[0]).join("");
  const roleTag = founder ? "FOUNDER" : "CORE TEAM";
  const eager = founder && index < 2;

  return (
    <article className={styles.card} data-team-card style={{ "--reveal-delay": `${(index % (founder ? 2 : 4)) * 45}ms` }}>
      <div className={styles.portrait}>
        <span className={styles.initials} aria-hidden="true">{initials}</span>
        <img
          src={portraitUrl(member, 320)}
          srcSet={`${portraitUrl(member, 320)} 320w, ${portraitUrl(member, 640)} 640w`}
          sizes={founder ? "(max-width: 620px) 46vw, 270px" : "(max-width: 620px) 46vw, (max-width: 940px) 31vw, 270px"}
          width="320"
          height="400"
          alt={member.name}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={(event) => { event.currentTarget.hidden = true; }}
        />
        <span className={styles.index} aria-hidden="true">{String(index + 1).padStart(2, "0")} / {roleTag}</span>
      </div>
      <div className={styles.details}>
        {founder ? <h3>{member.name}</h3> : <h4>{member.name}</h4>}
        <p className={styles.role}>{member.role}</p>
        <p className={styles.domain}>{member.domain}</p>
        <div className={styles.socials}>
          {profiles.map(({ key, name, icon }) => (
            <a key={key} href={member.socials[key]} aria-label={`${member.name} on ${name}`} title={name} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={icon} aria-hidden="true" />
            </a>
          ))}
          {profiles.length > 0 && <Icon name="diagonal" />}
        </div>
      </div>
    </article>
  );
}

function MemberGrid({ group, founder = false, offset = 0 }) {
  return (
    <div className={founder ? styles.founderGrid : styles.coreGrid}>
      {group.members.map((member, index) => <MemberCard key={member.name} member={member} founder={founder} index={offset + index} />)}
    </div>
  );
}

export default function MeetOurTeam() {
  const page = useRef(null);

  useEffect(() => {
    if (!window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.dataset.revealed = "true";
        observer.unobserve(entry.target);
      }
    }, { threshold: .16 });

    page.current.querySelectorAll("[data-team-card]").forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <main id="main-content" className={styles.team} ref={page}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}><span /> THE TEAM</p>
            <h1>The people behind TechNeeds.</h1>
            <p className={styles.lead}>Meet the founders and team members who helped build TechNeeds at IGDTUW, from mentorship to events, media, and outreach.</p>
          </div>
          <nav className={styles.directory} aria-label="Team sections">
            <p>FIG. 01 / TEAM DIRECTORY</p>
            <a href="#founders"><strong>{String(founders.members.length).padStart(2, "0")}</strong><span>Founders</span><Icon name="diagonal" /></a>
            <a href="#core-team"><strong>{coreCount}</strong><span>Core team</span><Icon name="diagonal" /></a>
          </nav>
        </header>

        <section className={styles.founders} id="founders" aria-labelledby="founders-title">
          <div className={styles.sectionHead}>
            <p className={styles.sectionIndex}>01 / FOUNDERS</p>
            <h2 id="founders-title">{founders.title}</h2>
            <p>{founders.intro}</p>
          </div>
          <MemberGrid group={founders} founder />
        </section>

        <section className={styles.core} id="core-team" aria-labelledby="core-title">
          <div className={styles.sectionHead}>
            <p className={styles.sectionIndex}>02 / CORE TEAM</p>
            <h2 id="core-title">Core team</h2>
            <p>Explore the teams that run the community and its programs.</p>
          </div>
          {coreGroups.map((group, index) => (
            <section className={styles.domainSection} key={group.id} aria-labelledby={`${group.id}-title`}>
              <header className={styles.domainHead}>
                <span className={styles.sectionIndex}>{String(index + 1).padStart(2, "0")} / DOMAIN</span>
                <h3 id={`${group.id}-title`}>{group.title}</h3>
                <p>{group.intro}</p>
              </header>
              <MemberGrid group={group} offset={index * 4} />
            </section>
          ))}
        </section>

        <section className={styles.join} aria-labelledby="join-title">
          <div>
            <p className={styles.eyebrow}><span /> GET INVOLVED</p>
            <h2 id="join-title">Want to join the core team?</h2>
            <p>Follow TechNeeds for recruitment announcements and ways to get involved.</p>
          </div>
          <a className="tn-button tn-button-light" href="https://www.linkedin.com/company/techneeds-igdtuw/">Follow TechNeeds <Icon name="diagonal" /></a>
        </section>
      </div>
    </main>
  );
}
