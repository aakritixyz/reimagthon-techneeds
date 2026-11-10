import Link from "next/link";
import { Icon } from "../shell/icons";
import styles from "./faq.module.css";

const questions = [
  {
    question: "What is TechNeeds?",
    answer: "TechNeeds is a technical community at IGDTUW that brings students together through mentorship, workshops, hackathons, and speaker sessions.",
  },
  {
    question: "Which mentorship tracks can I explore?",
    answer: "Explore Web Development, App Development, DSA in C/C++, DSA in Java, Machine Learning, and AR/VR. Each track page introduces its topics and the basics that will help you get started.",
  },
  {
    question: "Can I join if I’m new to coding?",
    answer: "Several tracks are beginner friendly. Check the experience tag and prerequisites on each track page, or use the track finder to explore options based on your interests.",
  },
  {
    question: "How do I join a mentorship cohort?",
    answer: "Follow TechNeeds’ official announcements for cohort applications. Once you’re enrolled, your mentor will provide an enrollment number and an initial password for Techboard.",
  },
  {
    question: "What is Techboard?",
    answer: "Techboard is the learning workspace for mentors and mentees. Mentees can access assigned videos, quizzes, projects, deadlines, and their progress. Mentors manage their cohorts and learning resources.",
  },
  {
    question: "How do I sign in as a mentee?",
    answer: "Open Techboard, choose Mentee, and enter the enrollment number and password provided by your mentor. Contact your mentor if you haven’t received your credentials.",
  },
  {
    question: "What if I forget my password?",
    answer: "Contact your assigned mentor for help with account access. Include your name and enrollment number so they can identify your account.",
  },
  {
    question: "How do videos, quizzes, and projects work?",
    answer: "Your mentor publishes resources with deadlines and maximum scores. Follow the video completion flow, submit quiz answers, or send your project links and description from your learning dashboard.",
  },
  {
    question: "How are scores and leaderboard ranks calculated?",
    answer: "Scores come from completed learning activities and mentor-reviewed projects. The leaderboard shows earned points and streaks. Check the source label when viewing the imported original-site leaderboard.",
  },
  {
    question: "Can I submit an assignment after its deadline?",
    answer: "The local portal enforces assignment deadlines. Check the due date in your dashboard and contact your mentor if you need help before a deadline.",
  },
  {
    question: "How can I get involved beyond mentorship?",
    answer: "Look out for TechNeeds hackathons, workshops, speaker sessions, and team recruitment announcements on its official channels.",
  },
  {
    question: "How can I contact TechNeeds?",
    answer: "Email techneedsigdtuw@gmail.com or contact your cohort mentor for questions specific to your program.",
  },
];

export default function Faq() {
  return (
    <main id="main-content" className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <p className={styles.eyebrow}><span /> HELP & SUPPORT</p>
          <h1>Frequently asked questions.</h1>
          <p>Everything you need to get started with TechNeeds and your mentorship journey.</p>
        </header>
        <div className={styles.layout}>
          <aside className={styles.help}>
            <span className={styles.figure}>FIG. 01 / QUICK HELP</span>
            <h2>Need a hand?</h2>
            <p>Reach out to your cohort mentor for learning and account questions, or email the community team.</p>
            <a href="mailto:techneedsigdtuw@gmail.com">Email TechNeeds <Icon name="diagonal" /></a>
            <Link href="/techboard">Open Techboard <Icon name="arrow" /></Link>
          </aside>
          <div className={styles.questions}>
            {questions.map(({ question, answer }, index) => (
              <details className={styles.item} key={question}>
                <summary><span className={styles.index}>{String(index + 1).padStart(2, "0")}</span><span>{question}</span><span className={styles.plus} aria-hidden="true" /></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
