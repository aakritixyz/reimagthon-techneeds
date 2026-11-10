"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../shell/icons";
import styles from "./workspace.module.css";

const roles = [
  { href: "/mentee", title: "Mentee", icon: "cap", description: "Access your cohort’s resources, complete assignments, and track your progress." },
  { href: "/mentor", title: "Mentor", icon: "people", description: "Manage your cohort, share learning resources, and review mentee work." },
];

export default function Techboard() {
  const router = useRouter();
  const [showRoles, setShowRoles] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("menteeToken")) {
      router.replace("/dashboard");
    } else if (localStorage.getItem("token")) {
      router.replace("/mentor");
    } else {
      setShowRoles(true);
    }
  }, [router]);

  return (
    <main id="main-content" className={styles.workspace}>
      <div className={styles.content}>
        <Link className={styles.back} href="/">← Back to home</Link>
        <p className={styles.label}><span /> TECHNEEDS WORKSPACE</p>
        <h1>Welcome to Techboard.</h1>
        <p className={styles.intro}>Choose your role to access your cohort.</p>
        {showRoles ? (
          <div className={styles.roles}>
            {roles.map((role) => (
              <Link className={styles.role} href={role.href} key={role.href}>
                <span className={styles.roleIcon}><Icon name={role.icon} /></span>
                <h2>{role.title}</h2>
                <p>{role.description}</p>
                <span className={styles.continue}>Continue as {role.title.toLowerCase()} <Icon name="arrow" /></span>
              </Link>
            ))}
          </div>
        ) : <p role="status">Opening your workspace…</p>}
        {showRoles && <Link className={styles.admin} href="/admin">Admin access</Link>}
      </div>
    </main>
  );
}
