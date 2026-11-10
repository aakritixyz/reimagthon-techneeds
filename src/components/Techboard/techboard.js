"use client";

import Link from "next/link";
import DemoNotice from "../shell/DemoNotice";
import DemoReset from "../shell/DemoReset";
import {IS_DEMO,DEMO_ACCOUNTS} from "@/lib/demo";
import { useEffect, useState } from "react";
import { Icon } from "../shell/icons";
import styles from "./workspace.module.css";

const roles = [
  { href: "/admin", title: "Admin", icon: "layers", description: "Create cohorts, onboard mentors, and manage program allocations." },
  { href: "/mentee", title: "Mentee", icon: "cap", description: "Access your cohort’s resources, complete assignments, and track your progress." },
  { href: "/mentor", title: "Mentor", icon: "people", description: "Manage your cohort, share learning resources, and review mentee work." },
];

export default function Techboard() {
  const [menteeHref, setMenteeHref] = useState("/mentee");

  useEffect(() => {
    if (localStorage.getItem("menteeToken")) setMenteeHref("/dashboard");
  }, []);

  return (
    <main id="main-content" className={styles.workspace}>
      <div className={styles.content}>
        <Link className={styles.back} href="/">← Back to home</Link>
        <p className={styles.label}><span /> TECHNEEDS WORKSPACE</p>
        <h1>Welcome to Techboard.</h1>
        <p className={styles.intro}>{IS_DEMO?"Open any role independently. Any email and password works for this walkthrough.":"Choose your role to open your workspace."}</p><DemoNotice/>
          <div className={styles.roles}>
            {roles.map((role) => (
              <Link className={styles.role} href={role.title === "Mentee" ? menteeHref : role.href} key={role.href}>
                <span className={styles.roleIcon}><Icon name={role.icon} /></span>
                <h2>{IS_DEMO?`Demo ${role.title}`:role.title}</h2>
                <p>{role.description}</p>
                {IS_DEMO&&<p className={styles.demoAccount}><code>{DEMO_ACCOUNTS[role.title.toLowerCase()].email}</code><small>Any password · prefilled for you</small></p>}<span className={styles.continue}>Continue as {role.title.toLowerCase()} <Icon name="arrow" /></span>
              </Link>
            ))}
          </div>
          <DemoReset/>
      </div>
    </main>
  );
}
