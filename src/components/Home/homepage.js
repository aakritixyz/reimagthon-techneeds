import Link from "next/link";
import TrackCatalog from "./trackCatalog";
import { Icon } from "../shell/icons";
import styles from "./reimagine.module.css";

const event = {
  title: "InnoVortex 4.0",
  dates: "Nov 14–15 at IGDTUW",
  endsAt: "2026-11-15T10:00:00+05:30",
  url: "https://www.communityx.in/events/innovortex-40",
};

const benefits = [
  { icon: "people", title: "Learn with peers", description: "Get guidance from mentors and learn alongside your cohort." },
  { icon: "layers", title: "Build hands-on projects", description: "Put your skills to work on projects you can show." },
  { icon: "chart", title: "Track your progress", description: "See what you’ve finished and what’s due next." },
];

const previewResources = [
  { icon: "play", type: "VIDEO", title: "Responsive layouts", status: "Complete", done: true },
  { icon: "checklist", type: "QUIZ", title: "CSS fundamentals", status: "Complete", done: true },
  { icon: "code", type: "PROJECT", title: "Build a portfolio", status: "Next up" },
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
      <section className={styles.hero}>
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}><span /> THE TECH COMMUNITY AT IGDTUW</p>
            <h1>Learn tech.<br /><em>Build together.</em></h1>
            <p className={styles.lead}>Find your direction in tech with peer mentorship and hands-on projects at IGDTUW.</p>
            <div className={styles.actions}>
              <a className="tn-button" href="#mentorship">Explore mentorship <Icon name="arrow" /></a>
              <div className={styles.portal}>
                <Link href="/techboard" aria-describedby="techboard-description">Open Techboard <Icon name="diagonal" /></Link>
                <span id="techboard-description">Workspace for current cohorts</span>
              </div>
            </div>
            <ul className={styles.proof} aria-label="TechNeeds community milestones">
              <li><strong>1,200+</strong> mentees trained</li>
              <li><strong>50+</strong> mentors</li>
              <li><strong>10+</strong> cohorts</li>
            </ul>
          </div>

          <ul className={styles.benefits} aria-label="What you can do at TechNeeds">
            {benefits.map(({ icon, title, description }) => (
              <li key={title}>
                <span className={styles.benefitIcon}><Icon name={icon} /></span>
                <div><strong>{title}</strong><p>{description}</p></div>
              </li>
            ))}
          </ul>

          <figure className={styles.preview}>
            <figcaption className={styles.previewCaption}>
              <span><i /> TECHBOARD / COHORT PREVIEW</span>
              <span aria-hidden="true">FIG. 01</span>
            </figcaption>
            <div className={styles.board} aria-hidden="true">
              <div className={styles.boardHeader}>
                <span className={styles.boardIcon}><Icon name="code" /></span>
                <div className={styles.boardTitle}><small>MENTORSHIP TRACK</small><strong>Web Development</strong></div>
                <span className={styles.example}>SAMPLE</span>
              </div>
              <div className={styles.progress}>
                <div><span>Cohort progress</span><span>2 of 3 complete</span></div>
                <div className={styles.progressTrack}><span /></div>
              </div>
              <ul className={styles.boardTasks}>
                {previewResources.map(({ icon, type, title, status, done }) => (
                  <li key={type}>
                    <span className={styles.taskIcon}><Icon name={icon} /></span>
                    <div className={styles.taskTitle}><small>{type}</small><strong>{title}</strong></div>
                    <span className={done ? styles.done : styles.upNext}>{done && <Icon name="check" />}{status}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className={styles.previewNote} aria-hidden="true"><span>TECHNEEDS IGDTUW</span><span>01 VIDEO · 01 QUIZ · 01 PROJECT</span></p>
          </figure>
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
    </main>
  );
}
