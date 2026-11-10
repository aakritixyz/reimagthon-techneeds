"use client";

import Link from "next/link";
import { useState } from "react";
import { trackGroups, tracks } from "@/lib/mentorship";
import { Icon } from "../shell/icons";
import styles from "./reimagine.module.css";

export default function TrackFinder() {
  const [matches, setMatches] = useState(null);

  function recommend(event) {
    event.preventDefault();
    const answers = new FormData(event.currentTarget);
    const group = answers.get("interest");
    const firstLanguage = answers.get("experience") === "new";
    const related = tracks.filter((track) => track.group === group);
    setMatches(firstLanguage
      ? [...related].sort((a, b) => Number(b.level === "Beginner friendly") - Number(a.level === "Beginner friendly"))
      : related);
  }

  return (
    <>
      <form className={styles.finderForm} onSubmit={recommend}>
        <label>What interests you?
          <select name="interest" required defaultValue="">
            <option value="" disabled>Choose an area</option>
            {trackGroups.map((group) => <option key={group}>{group}</option>)}
          </select>
        </label>
        <label>How much coding have you done?
          <select name="experience" required defaultValue="">
            <option value="" disabled>Choose your experience</option>
            <option value="new">I’m just starting</option>
            <option value="basics">I know the basics</option>
          </select>
        </label>
        <button className="tn-button" type="submit">Show my matches <Icon name="arrow" /></button>
      </form>
      <div className={styles.finderResults} aria-live="polite">
        {matches && (
          <>
            <h2>Your matches</h2>
            <ul>
              {matches.map((track) => (
                <li key={track.slug}>
                  <Link href={`/mentorship/${track.slug}`}>{track.name} <Icon name="arrow" /></Link>
                  <p>{track.level} · {track.focus}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
