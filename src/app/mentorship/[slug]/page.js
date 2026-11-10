import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tracks } from "@/lib/mentorship";
import { Icon } from "@/components/shell/icons";
import styles from "@/components/Home/reimagine.module.css";

export function generateStaticParams() {
  return tracks.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const track = tracks.find((entry) => entry.slug === slug);
  if (!track) return {};
  return { title: `${track.name} | TechNeeds IGDTUW`, description: track.description };
}

export default async function TrackPage({ params }) {
  const { slug } = await params;
  const track = tracks.find((entry) => entry.slug === slug);
  if (!track) notFound();
  const related = tracks.find((entry) => entry.group === track.group && entry.slug !== track.slug);

  return (
    <main id="main-content" className={styles.trackPage}>
      <div className={styles.trackPageInner}>
        <Link className={styles.backLink} href="/#mentorship">← All mentorship tracks</Link>
        <header className={styles.trackPageHeader}>
          <span className={styles.tileIcon}><Icon name={track.icon} /></span>
          <p className={styles.number}>{track.group}</p>
          <h1>{track.name}</h1>
          <p className={styles.trackMentor}>By {track.mentor}</p>
          <p>{track.description}</p>
          <div className={styles.trackMeta}><span>{track.level}</span><span>{track.focus}</span></div>
        </header>
        <div className={styles.trackDetailVisual}>
          <Image src={track.image} alt={track.imageAlt} fill sizes="(max-width: 880px) 94vw, 880px" />
        </div>
        <div className={styles.trackDetails}>
          <section>
            <h2>What you’ll practice</h2>
            <ul>{track.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
          </section>
          <section>
            <h2>Before you start</h2>
            <p>{track.preparation}</p>
            <h2>Example project</h2>
            <p>{track.project}</p>
          </section>
        </div>
        <div className={styles.trackPageActions}>
          <Link className="tn-button" href="/techboard">Sign in to Techboard <Icon name="arrow" /></Link>
          {related && <Link className={styles.backLink} href={`/mentorship/${related.slug}`}>Also explore {related.name} <Icon name="diagonal" /></Link>}
        </div>
      </div>
    </main>
  );
}
