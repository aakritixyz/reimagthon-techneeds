"use client";

import dynamic from 'next/dynamic';
import Image from 'next/image';
import './homepage.css' ;
import './mobileview.css';
import rocket from "../../assets/rocket.png";
import animation from "../../assets/animation.json";
const Lottie = dynamic(() => import('lottie-react'), {
  ssr: false // Disable SSR for this component
});
import about1 from "../../assets/about1.png";
import about2 from "../../assets/about2.png";
import about3 from "../../assets/about3.png";
import about4 from "../../assets/about4.png";



export default function About () {
  

  return (
    <div>
       <div id="about" className="about-section">
          <div className="lottie-animation">
            <Lottie animationData={animation} loop={false} />
          </div>
          <div className="about-content-container">
            <div className="about-content">
              <h2>About Us</h2>
              <hr className="star-light"></hr>
              <p>IGDTUW Students' first Choice</p>
            </div>
            <div className="box">
              <div className="box1">
                <div className="box11">
                  <Image src={about1} alt="Trained Mentees" width={'auto'} height={'auto'} />
                  <div className="box-cont">
                    <h2>1200+</h2>
                    <p>Trained Mentee</p>
                  </div>
                </div>
                <div className="box12">
                  <Image src={about2} alt="Professional Mentors" width={'auto'} height={'auto'} />
                  <div className="box-cont">
                    <h2>50+</h2>
                    <p>Professional Mentors</p>
                  </div>
                </div>
              </div>
              <div className="box2">
                <div className="box21">
                  <Image src={about3} alt="Mentorship Cohorts" width={'auto'} height={'auto'} />
                  <div className="box-cont">
                    <h2>10+</h2>
                    <p>Mentorship Cohorts</p>
                  </div>
                </div>
                <div className="box22">
                  <Image src={about4} alt="Amazing Events" width={'auto'} height={'auto'} />
                  <div className="box-cont">
                    <h2>100+</h2>
                    <p>Amazing Events</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="about-box">
              <div className="about-1">
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
                <h2>Our Mission :</h2>
                <p>To be the go-to resource for anyone seeking to understand, explore, and stay updated on the ever-evolving world of technology.</p>
              </div>
              <div className="about-2">
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
                <h2>What We Offer :</h2>
                <ul className="about-list">
                  <li className='about-li'><Image src={rocket} alt="rocket" width={'auto'} height={'auto'} />&nbsp;In-Depth Insights</li>
                  <li className='about-li'><Image src={rocket} alt="rocket" width={'auto'} height={'auto'} />&&nbsp;Educational Content</li>
                  <li className='about-li'><Image src={rocket} alt="rocket" width={'auto'} height={'auto'} />&&nbsp;Community Engagement</li>
                  <li className='about-li'><Image src={rocket} alt="rocket" width={'auto'} height={'auto'} />&&nbsp;Hackathons</li>
                  <li className='about-li'><Image src={rocket} alt="rocket" width={'auto'} height={'auto'} />&&nbsp;Speaker Sessions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};
