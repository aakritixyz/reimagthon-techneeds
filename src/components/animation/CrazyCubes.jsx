'use client';
import React, { useState } from 'react';
import styles from './CrazyCubes.module.scss';
import logo from '../../assets/logo.png';

const CrazyCubes = () => {
  const [useAltAnimation, setUseAltAnimation] = useState(false);

  const toggleAnimation = () => {
    setUseAltAnimation(!useAltAnimation);
  };

  const animationClass = useAltAnimation ? styles.rot2 : styles.rot;

  return (
    <div className={styles.wrapper}>

      <div className={`${styles.box} ${styles.rad}`}>
      <button  onClick={toggleAnimation}>
        <div className={`${styles.cube} ${animationClass} ${styles.r3}`}>
          <div className={`${styles.face} ${styles.f1}`}><img src={logo.src} alt="logo" className={styles.logo} /></div>
          <div className={`${styles.face} ${styles.f2}`}><img src={logo.src} alt="logo" className={styles.logo} /></div>
          <div className={`${styles.face} ${styles.f3}`}><img src={logo.src} alt="logo" className={styles.logo} /></div>
          <div className={`${styles.face} ${styles.f4}`}><img src={logo.src} alt="logo" className={styles.logo} /></div>
          <div className={`${styles.face} ${styles.f5}`}><img src={logo.src} alt="logo" className={styles.logo} /></div>
          <div className={`${styles.face} ${styles.f6}`}><img src={logo.src} alt="logo" className={styles.logo} /></div>

          <div className={`${styles.cube} ${styles.inside} ${animationClass}`}>
            <div className={`${styles.face} ${styles.f1}`}><img src={logo.src} alt="logo" className={styles.logo} /></div>
            <div className={`${styles.face} ${styles.f2}`}><img src={logo.src} alt="logo" className={styles.logo} /></div>
            <div className={`${styles.face} ${styles.f3}`}><img src={logo.src} alt="logo" className={styles.logo} /></div>
            <div className={`${styles.face} ${styles.f4}`}><img src={logo.src} alt="logo" className={styles.logo} /></div>
            <div className={`${styles.face} ${styles.f5}`}><img src={logo.src} alt="logo" className={styles.logo} /></div>
            <div className={`${styles.face} ${styles.f6}`}><img src={logo.src} alt="logo" className={styles.logo} /></div>
          </div>

          <div className={`${styles.cube} ${styles.inside} ${animationClass} ${styles.r3}`}>
            <div className={`${styles.face} ${styles.f1} ${styles.rad}`}><img src={logo.src} alt="logo" className={styles.logo} /></div>
            <div className={`${styles.face} ${styles.f2} ${styles.rad}`}><img src={logo.src} alt="logo" className={styles.logo} /></div>
            <div className={`${styles.face} ${styles.f3} ${styles.rad}`}><img src={logo.src} alt="logo" className={styles.logo} /></div>
            <div className={`${styles.face} ${styles.f4} ${styles.rad}`}><img src={logo.src} alt="logo" className={styles.logo} /></div>
            <div className={`${styles.face} ${styles.f5} ${styles.rad}`}><img src={logo.src} alt="logo" className={styles.logo} /></div>
            <div className={`${styles.face} ${styles.f6} ${styles.rad}`}><img src={logo.src} alt="logo" className={styles.logo} /></div>
          </div>
        </div>
        </button>
      </div>
    
    </div>
  );
};

export default CrazyCubes;
