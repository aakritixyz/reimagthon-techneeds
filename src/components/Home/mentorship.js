"use client";

import Image from 'next/image';
import React, { useState } from 'react';
import './homepage.css' ;
import ML from "../../assets/ML.png";
import Web from "../../assets/WEB.jpeg";
import Java from "../../assets/JAVA.jpeg";
import AR from "../../assets/ar.png";
import C from "../../assets/C.png";
import app from "../../assets/app.jpg";


const courses = [
    { title: 'Web Development', instructor: 'Vidusi Agarwal', image: Web, backgroundColor: '#bfffd4' },
    { title: 'DSA in C/C++', instructor: 'Shefali Kaushal', image: C, backgroundColor: '#ffe8c9' },
    { title: 'Machine Learning', instructor: 'Sripriya Aggarwal', image: ML, backgroundColor: '#ffecf4' },
    { title: 'DSA in Java', instructor: 'Tavleen Kaur', image: Java, backgroundColor: '#fffcdc' },
    { title: 'AR/VR Mentorship', instructor: 'Snighdha', image: AR, backgroundColor: '#d4f5ff' },
    { title: 'App Development', instructor: 'Muskan Manvi', image: app, backgroundColor: '#f6d8ff' }
  ];

  export default function Mentorship() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const coursesPerPage = 2;
    const totalPages = Math.ceil(courses.length / coursesPerPage);
  
    const handleNext = () => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalPages);
    };
  
    const handlePrev = () => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + totalPages) % totalPages);
    };
  
    const currentCourses = courses.slice(currentIndex * coursesPerPage, (currentIndex + 1) * coursesPerPage);

  return (
    <div>
       
       <div id="Mentorship">
          <div className="Course">
            <h2>Our Mentorship Cohorts</h2>
            <hr className="star-light"></hr>
            <div className="courses-container">
              <div className="courses-wrapper">
                {currentCourses.map((course, index) => (
                  <div
                    key={index}
                    className="course-card"
                    style={{ backgroundColor: '#64a0cc' }}
                  >
                    <div className="course-img">
                      <Image src={course.image} className="icon" alt={`${course.title} Image`} width={'auto'} height={'auto'} />&
                    </div>
                    <div className="course-content">
                      <h2>{course.title}</h2>
                      <p>By {course.instructor}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="carousel-button left" onClick={handlePrev}>&#9664;</button>
              <button className="carousel-button right" onClick={handleNext}>&#9654;</button>
            </div>
            <div className="know-more-btn">
              <button type="button" id="KnowMore"><a href="/techboard">Know More</a></button>
            </div>
          </div>
        </div>
    </div>
  );
};

