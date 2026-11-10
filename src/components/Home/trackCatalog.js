"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { trackGroups, tracks } from "@/lib/mentorship";
import { Icon } from "../shell/icons";
import styles from "./reimagine.module.css";

export default function TrackCatalog() {
  const [group, setGroup] = useState("All");
  const grid = useRef(null);
  const visibleTracks = group === "All" ? tracks : tracks.filter((track) => track.group === group);

  useEffect(() => {
    if (!window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.dataset.revealed = "true";
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.18 });

    grid.current.querySelectorAll("li:not([data-revealed])").forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [group]);

  return (
    <>
      <div className={styles.catalogControls}>
        <div className={styles.filters} role="group" aria-label="Filter mentorship tracks">
          {["All", ...trackGroups].map((option) => (
            <button type="button" aria-pressed={group === option} key={option} onClick={() => setGroup(option)}>
              {option}
            </button>
          ))}
        </div>
        <span className={styles.trackCount} role="status">{visibleTracks.length} tracks</span>
      </div>
      <ul className={styles.trackGrid} ref={grid} key={group}>
        {visibleTracks.map((track) => (
          <li key={track.slug}>
            <Link className={styles.track} href={`/mentorship/${track.slug}`} aria-labelledby={`track-${track.slug}`} aria-describedby={`intro-${track.slug} meta-${track.slug}`}>
              <div className={styles.trackVisual}>
                <Image src={track.image} alt={track.imageAlt} fill sizes="(max-width: 620px) 92vw, (max-width: 940px) 46vw, 380px" />
              </div>
              <div className={styles.trackTop}>
                <span className={styles.tileIcon}><Icon name={track.icon} /></span>
                <span className={styles.number}>{track.group}</span>
              </div>
              <h3 id={`track-${track.slug}`}>{track.name}</h3>
              <p className={styles.trackMentor}>By {track.mentor}</p>
              <p id={`intro-${track.slug}`}>{track.description}</p>
              <div className={styles.trackFooter}>
                <div className={styles.trackMeta} id={`meta-${track.slug}`}><span>{track.level}</span><span>{track.focus}</span></div>
                <span className={styles.trackAction} aria-hidden="true">View track <Icon name="arrow" /></span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
