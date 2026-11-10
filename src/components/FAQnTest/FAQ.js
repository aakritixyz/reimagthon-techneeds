"use client";

import React, { useState } from 'react';
import './FAQ.css';


const Faq = () => {
    const [activeIndex, setActiveIndex] = useState(null);

    const faqs = [
        { question: "What is TechNeeds?", answer: "TechNeeds is a platform that provides technology solutions and support for various needs." },
        { question: "How can I contact support?", answer: "You can contact support via our official WhatsApp group or email us at techneedsigdtuw@gmail.com." },
        { question: "What services do you offer?", answer: "We offer a range of services including hackathon, tech introductory sessions, mentorship programs, tech engagement competition and speaker sessions." },
        { question: "Where is TechNeeds located?", answer: "TechNeeds is based in the heart of IGDTUW founded in 2023." },
        { question: "Can I track my mentorship journey?", answer: "Yes, you can track your journey through our online portal." },
    ];

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <div>
            <div className="faq-container">
                <h2 className="faq-title">Frequently Asked Questions</h2>
                <div className="faq-list">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`faq-item ${activeIndex === index ? 'active' : ''}`}
                            onClick={() => toggleFAQ(index)}
                        >
                            <div className="faq-question">
                                {faq.question}
                            </div>
                            {activeIndex === index && (
                                <div className="faq-answer">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
           
        </div>
    );
};

export default Faq;
