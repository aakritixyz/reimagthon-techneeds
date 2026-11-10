import Image from "next/image";
import LogoOrbit from "@/components/LogoOrbit";
import Link from "next/link";
import glimpses from "@/assets/Glimpse.png";
import rocket from "@/assets/rocket.png";
import connectedTech from "@/assets/hero-connected-tech.png";
import { tracks } from "@/lib/mentorship";
import TrackCatalog from "./trackCatalog";
import StudentReviews from "./studentReviews";
import { Icon } from "../shell/icons";
import styles from "./reimagine.module.css";

const event = {
  title: "InnoVortex 4.0",
  dates: "Nov 14–15 at IGDTUW",
  endsAt: "2026-11-15T10:00:00+05:30",
  url: "https://www.communityx.in/events/innovortex-40",
};

const offerings = [
  "In-Depth Insights",
  "Educational Content",
  "Community Engagement",
  "Hackathons",
  "Speaker Sessions",
];

const milestones = [
  { value: "1,200+", label: "Mentees trained" },
  { value: "50+", label: "Mentors" },
  { value: "10+", label: "Mentorship cohorts" },
  { value: String(tracks.length), label: "Learning tracks" },
];

export default function Homepage() {
  return (
    <main id="main-content" className={styles.home}>
      {Date.now() < Date.parse(event.endsAt) && (
        <aside className={styles.announcement} aria-label="Upcoming event">
          <div className={styles.wrap}>
            <p><span>UPCOMING</span> <strong>{event.title}</strong> <span className={styles.eventDates}>{event.dates}</span></p>
            <a href={event.url}>Event details <Icon name="diagonal" /></a>
          </div>
        </aside>
      )}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}><span /> THE TECH COMMUNITY AT IGDTUW</p>
            <h1 id="hero-title">Learn tech.<br /><em>Build together.</em></h1>
            <p className={styles.lead}>Find your direction in tech with peer mentorship and hands-on projects at IGDTUW.</p>
            <div className={styles.actions}>
              <a className={styles.primaryAction} href="#mentorship">
                <span className={styles.actionIcon}><Icon name="layers" /></span>
                <span><strong>Explore mentorship</strong><small>Find your learning track</small></span>
                <Icon name="arrow" />
              </a>
              <Link className={styles.secondaryAction} href="/techboard">
                <span className={styles.actionIcon}><Icon name="chart" /></span>
                <span><strong>Open Techboard</strong><small>Workspace for current cohorts</small></span>
                <Icon name="diagonal" />
              </Link>
            </div>
          </div>

          <figure className={styles.foregroundArt}>
            <Image src={connectedTech} alt="Hands connecting vintage computers and telephones through a network of wires." sizes="(max-width: 620px) 90vw, 420px" priority />
            <figcaption><span>CONNECTED BY TECH</span><span>FIG. 01</span></figcaption>
          </figure>

          <aside className={styles.glance} aria-labelledby="glance-title">
            <div className={styles.glanceHead}>
              <h2 id="glance-title">TechNeeds at a glance</h2>
              <span aria-hidden="true">OUR COMMUNITY</span>
            </div>
            <dl>
              {milestones.map(({ value, label }) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </aside>


        </div>
      </section>

      <section className={styles.mission} aria-labelledby="mission-title">
        <div className={`${styles.wrap} ${styles.missionGrid}`}>
          <div className={styles.animationSpace} data-animation-slot="mission">
            <LogoOrbit />
          </div>
          <div className={styles.missionContent}>
            <p className={styles.eyebrow}><span /> ABOUT TECHNEEDS</p>
            <h2 id="mission-title">Our Mission</h2>
            <p className={styles.missionStatement}>To be the go-to resource for anyone seeking to understand, explore, and stay updated on the ever-evolving world of technology.</p>
            <h3>What We Offer</h3>
            <ul className={styles.offerings}>
              {offerings.map((offering) => (
                <li key={offering}><Image src={rocket} alt="" width={23} height={23} /><span>{offering}</span></li>
              ))}
            </ul>
            <p className={styles.communityVision}>As the community grows and prepares for upcoming high-impact mentorship programs, the platform requires a modern, seamless, and scalable overhaul to accommodate multi-tiered role hierarchies, granular resource tracking, and personalized AI-driven participant profiles.</p>
          </div>
        </div>
      </section>

      <section className={styles.tracks} id="mentorship" aria-labelledby="tracks-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}><span /> MENTORSHIP TRACKS</p>
            <h2 id="tracks-title">Find what you want to build.</h2>
            <p className={styles.sectionIntro}>Compare tracks by topic and experience level, then see what you could build in each one.</p>
          </div>
          <TrackCatalog />
        </div>
      </section>

      <section className={styles.next} aria-labelledby="next-title">
        <div className={styles.wrap}>
          <div className={styles.nextCard}>
            <div>
              <p className={styles.eyebrow}><span /> TRACK FINDER</p>
              <h2 id="next-title">Not sure where to start?</h2>
              <p>Answer two quick questions to find tracks that fit your interests.</p>
            </div>
            <Link className="tn-button tn-button-light" href="/mentorship/find-your-track">Help me choose <Icon name="arrow" /></Link>
          </div>
        </div>
      </section>
      <section className={styles.gallery} id="glimpses" aria-labelledby="glimpses-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}><span /> LIFE AT TECHNEEDS</p>
            <h2 id="glimpses-title">A glimpse of our community.</h2>
            <p className={styles.sectionIntro}>Workshops, coding sessions, and the people who make learning together possible.</p>
          </div>
          <figure className={styles.galleryFrame}>
            <div className={styles.galleryCaption}><span>FIG. 02 / COMMUNITY ARCHIVE</span><span>TECHNEEDS IGDTUW</span></div>
            <Image src={glimpses} alt="A collage from TechNeeds events, featuring classroom workshops, community group photos, speakers, online learning sessions, and the Summer Skill Sprint Challenge." sizes="(max-width: 1050px) 96vw, 1216px" />
            <figcaption>Moments from TechNeeds workshops, events, and online sessions.</figcaption>
          </figure>
        </div>
      </section>
      <StudentReviews />
    </main>
  );
}
