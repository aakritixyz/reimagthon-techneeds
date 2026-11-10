import styles from "./reimagine.module.css";

const reviews = [
  {
    "name": "Kanika Chauhan",
    "rating": 5,
    "quote": "TechNeeds has been my go-to platform for staying updated on the latest tech trends. The community is incredibly supportive, and the content is top-notch. It’s a must-visit for anyone passionate about technology!"
  },
  {
    "name": "Khushi Sharma",
    "rating": 5,
    "quote": "The learning experience at TechNeeds is exceptional. The senior mentors offer detailed explanations and practical advice that make complex tech topics easier to grasp. The supportive community is an added bonus."
  },
  {
    "name": "Komal Maurya",
    "rating": 5,
    "quote": "TechNeeds offers a wealth of information and a supportive community. The senior-led mentorship has been particularly valuable, providing me with expert advice and helping me navigate my tech career path."
  },
  {
    "name": "Chahal Jain",
    "rating": 5,
    "quote": "Joining TechNeeds has been a rewarding experience. The community is welcoming, and the seniors are genuinely invested in helping you succeed. The courses are comprehensive and cater to all levels of expertise."
  },
  {
    "name": "Mansi Solanki",
    "rating": 4,
    "quote": "I've been using TechNeeds for several months now, and it's been an excellent resource. The courses are well-structured, and the senior mentors are always ready to help with any questions."
  },
  {
    "name": "Sagar",
    "rating": 5,
    "quote": "I love how TechNeeds brings together tech enthusiasts from all backgrounds. The guidance from senior members has been instrumental in helping me understand complex topics and apply them effectively."
  },
  {
    "name": "Julie",
    "rating": 4,
    "quote": "TechNeeds stands out for its dedication to empowering individuals with tech knowledge. The senior mentors are approachable and provide valuable insights that have helped me advance in my tech career."
  },
  {
    "name": "Tanishka Manwal",
    "rating": 4,
    "quote": "Joining TechNeeds was one of the best decisions I made for my tech career. The seniors offer insights that you can't get from textbooks alone, and the community vibe is both supportive and motivating."
  }
];

export default function StudentReviews() {
  return (
    <section className={styles.reviews} id="student-reviews" aria-labelledby="reviews-title">
      <div className={styles.wrap}>
        <div className={styles.sectionHead}>
          <h2 id="reviews-title">Student Reviews</h2>
        </div>
        <div className={styles.reviewGrid}>
          {reviews.map((review) => (
            <figure className={styles.reviewCard} key={review.name}>
              <span className={styles.reviewStars} aria-label={`${review.rating} out of 5 stars`}>
                <span aria-hidden="true">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
              </span>
              <blockquote>{review.quote}</blockquote>
              <figcaption>{review.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
