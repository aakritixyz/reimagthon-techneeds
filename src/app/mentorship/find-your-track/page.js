import Link from "next/link";
import TrackFinder from "@/components/Home/trackFinder";
import styles from "@/components/Home/reimagine.module.css";

export const metadata = {
  title: "Find your mentorship track | TechNeeds IGDTUW",
  description: "Find a mentorship track based on your interests and coding experience.",
};

export default function FindYourTrackPage() {
  return (
    <main id="main-content" className={styles.trackPage}>
      <div className={styles.trackPageInner}>
        <Link className={styles.backLink} href="/#mentorship">← All mentorship tracks</Link>
        <header className={styles.trackPageHeader}>
          <p className={styles.eyebrow}><span /> TRACK FINDER</p>
          <h1>Find your mentorship track.</h1>
          <p>Tell us what you want to explore and how much coding you’ve done.</p>
        </header>
        <TrackFinder />
      </div>
    </main>
  );
}
