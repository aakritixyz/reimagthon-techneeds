"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { requestOrigin } from "@/lib/api";
import { Icon } from "../shell/icons";
import styles from "./standings.module.css";

const periods = [["all", "All time"], ["month", "This month"], ["week", "This week"]];
const tracks = [["all", "All tracks"], ["web", "Web"], ["dsa", "DSA"], ["ml", "ML"], ["arvr", "AR/VR"], ["app", "App"]];
const pointsFormat = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });

function Filters({ label, options, value, onChange, disabled = false }) {
  return (
    <div className={styles.filters} role="group" aria-label={label}>
      {options.map(([key, name]) => (
        <button key={key} type="button" aria-pressed={value === key} disabled={disabled && key !== "all"} onClick={() => onChange(key)}>{name}</button>
      ))}
    </div>
  );
}

function Avatar({ name, rank }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  return <span className={styles.avatar} data-tone={rank % 3} aria-hidden="true">{initials}</span>;
}

function Streak({ days }) {
  const tier = days >= 30 ? 3 : days >= 14 ? 2 : days >= 7 ? 1 : 0;
  return <span className={styles.streak} data-tier={tier}><Icon name="flame" /> <span>{days} {days === 1 ? "day" : "days"}</span></span>;
}

function Movement({ value }) {
  if (!value) return null;
  const places = Math.abs(value);
  return (
    <span className={styles.movement} data-direction={value > 0 ? "up" : "down"} title="Change from last week">
      <span aria-hidden="true">{value > 0 ? "▲" : "▼"}{places}</span>
      <span className="visually-hidden">{value > 0 ? "Up" : "Down"} {places} {places === 1 ? "place" : "places"} since last week</span>
    </span>
  );
}

function Score({ value, progress }) {
  return (
    <span className={styles.score}>
      <span aria-hidden="true">{pointsFormat.format(progress === 1 ? value : Math.floor(value * progress))}</span>
      <span className="visually-hidden">{pointsFormat.format(value)} </span>
      <small> pts</small>
    </span>
  );
}

function Person({ row }) {
  return (
    <div className={styles.person}>
      <Avatar name={row.name} rank={row.rank} />
      <div className={styles.identity}>
        <strong>{row.name}{row.isYou && <span className={styles.youTag}>You</span>}</strong>
        <div className={styles.tags}>
          {row.tracks.map((track) => <span key={track} className={styles.trackTag}>{track}</span>)}
          {row.badges.map((badge) => <span key={badge} className={styles.badge}>{badge}</span>)}
        </div>
      </div>
    </div>
  );
}

function Podium({ rows, progress }) {
  return (
    <section aria-label="Top three mentees">
      <div className={styles.sectionLabel}><span>FIG. 01 / PODIUM</span><span>TOP {rows.length}</span></div>
      <ol className={styles.podium} data-animate={progress < 1 || undefined}>
        {rows.map((row) => (
          <li key={row.id} className={styles.podiumCard} data-rank={row.rank}>
            <div className={styles.podiumRank}>
              <span>{row.rank === 1 && <Icon name="crown" />} RANK {String(row.rank).padStart(2, "0")}</span>
              <Movement value={row.movement} />
            </div>
            <Person row={row} />
            <div className={styles.podiumStats}><Score value={row.score} progress={progress} /><Streak days={row.streak} /></div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Rows({ rows, leader, progress, searching }) {
  return (
    <section className={styles.rankSection} aria-labelledby="rank-title">
      <div className={styles.sectionLabel}><h2 id="rank-title">{searching ? "Search results" : "Rankings"}</h2><span>{rows.length} SHOWN</span></div>
      <ol className={styles.ranks}>
        {rows.map((row, index) => (
          <li key={row.id} className={styles.row} data-you={row.isYou || undefined} style={{ "--row-delay": `${Math.min(index, 7) * 33}ms` }}>
            <div className={styles.rank}><span>#{String(row.rank).padStart(2, "0")}</span><Movement value={row.movement} /></div>
            <Person row={row} />
            <div className={styles.rowScore}>
              <Score value={row.score} progress={progress} />
              <div className={styles.meter} aria-hidden="true"><span style={{ width: `${Math.min(100, row.score / leader * 100)}%` }} /></div>
            </div>
            <Streak days={row.streak} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function PersonalRank({ you }) {
  return (
    <aside className={styles.personal} aria-label="Your leaderboard position">
      <span className={styles.personalLabel}>YOU</span>
      <strong>{you.rank ? `Rank #${you.rank}` : "Unranked"}</strong>
      <span>{pointsFormat.format(you.score)} pts</span>
      <span className={styles.personalHint}>
        {you.pointsToPass !== null
          ? `${pointsFormat.format(you.pointsToPass)} pts to pass #${you.rank - 1}`
          : you.rank ? "You’re leading this board." : "Earn points to enter this ranking."}
      </span>
    </aside>
  );
}

function Skeleton() {
  return (
    <div className={styles.skeleton} role="status" aria-label="Loading leaderboard">
      {[0, 1, 2, 3].map((row) => <div key={row} aria-hidden="true"><i /><span /><span /></div>)}
    </div>
  );
}

export default function Leaderboard() {
  const [period, setPeriod] = useState("all");
  const [track, setTrack] = useState("all");
  const [search, setSearch] = useState("");
  const [retry, setRetry] = useState(0);
  const [response, setResponse] = useState(null);
  const [progress, setProgress] = useState(1);
  const animated = useRef(false);
  const params = new URLSearchParams({ period, track, search: search.trim() }).toString();
  const requestId = `${params}:${retry}`;
  const data = response?.id === requestId ? response.data : null;
  const error = response?.id === requestId && response.error;
  const hasScores = Boolean(data?.rows.length);
  const searching = Boolean(search.trim());
  const snapshot = Boolean(data?.snapshot);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem("menteeToken");
        const result = await fetch(`${requestOrigin()}/api/m/leaderboard/standings?${params}`, {
          signal: controller.signal,
          credentials: 'include',
          headers: token ? { "x-auth-token": token } : {},
        });
        if (!result.ok) throw new Error("Unable to load standings");
        const data = await result.json();
        if (!controller.signal.aborted) setResponse({ id: requestId, data });
      } catch {
        if (!controller.signal.aborted) setResponse({ id: requestId, error: true });
      }
    }, search.trim() ? 200 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [params, requestId, search]);

  useEffect(() => {
    if (!hasScores || animated.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }
    animated.current = true;
    const start = performance.now();
    let frame;
    function tick(now) {
      const elapsed = Math.min(1, (now - start) / 460);
      setProgress(1 - (1 - elapsed) ** 2);
      if (elapsed < 1) frame = requestAnimationFrame(tick);
    }
    setProgress(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [hasScores]);

  const podium = hasScores && !searching ? data.rows.filter((row) => row.rank <= 3) : [];
  const rows = hasScores ? data.rows.filter((row) => searching || row.rank > 3) : [];

  return (
    <main id="main-content" data-leaderboard className={styles.board}>
      <div className={styles.wrap}>
        <header className={styles.heading}>
          <div>
            <p className={styles.eyebrow}><span /> LEADERBOARD</p>
            <h1>Mentee Leaderboard</h1>
            <p className={styles.intro}>See how mentees are progressing across TechNeeds cohorts.</p>
          </div>
          {data && <p className={styles.updated}>{snapshot ? "IMPORTED" : "UPDATED"} {dateFormat.format(new Date(data.updatedAt))} IST</p>}
        </header>

        <div className={styles.controls}>
          <div className={styles.controlRow}>
            <Filters label="Ranking period" options={periods} value={snapshot ? "all" : period} onChange={setPeriod} disabled={snapshot} />
            <label className={styles.search}>
              <Icon name="search" />
              <span className="visually-hidden">Search by name</span>
              <input type="search" placeholder="Search by name" value={search} maxLength={80} onChange={(event) => setSearch(event.target.value)} />
            </label>
          </div>
          <Filters label="Filter by track" options={tracks} value={snapshot ? "all" : track} onChange={setTrack} disabled={snapshot} />
        </div>

        {snapshot && <p className={styles.sourceNote}>Published lifetime scores from the <a href={data.source}>original TechNeeds leaderboard</a>. Track and period breakdowns aren’t available in this snapshot.</p>}
        {data?.you && <PersonalRank you={data.you} />}
        {!data && !error && <Skeleton />}
        {error && (
          <div className={styles.state} role="alert">
            <span className={styles.stateIcon}><Icon name="chart" /></span>
            <h2>Couldn’t load the leaderboard</h2>
            <p>Check that the TechNeeds API is running, then try again.</p>
            <button className="tn-button tn-button-quiet" onClick={() => setRetry((value) => value + 1)}>Try again</button>
          </div>
        )}
        {data && !hasScores && (
          <div className={styles.state}>
            <span className={styles.stateIcon}><Icon name={searching ? "search" : "trophy"} /></span>
            <p className={styles.emptyLabel}>FIG. 01 / STANDINGS</p>
            <h2>{searching ? "No matching mentees" : "No scores yet"}</h2>
            <p>{searching ? "Try another name or broaden your filters." : period === "all" && track === "all" ? "Be the first on the board. Complete an activity in Techboard to earn points." : "Scores will appear here when mentees earn points in this selection."}</p>
            {searching
              ? <button className="tn-button tn-button-quiet" onClick={() => setSearch("")}>Clear search</button>
              : <Link className="tn-button tn-button-quiet" href="/techboard">Open Techboard <Icon name="arrow" /></Link>}
          </div>
        )}
        {podium.length > 0 && <Podium rows={podium} progress={progress} />}
        {rows.length > 0 && <Rows rows={rows} leader={data.leaderScore} progress={progress} searching={searching} />}
      </div>
    </main>
  );
}
