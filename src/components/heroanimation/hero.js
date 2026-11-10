'use client';
import { useEffect, useRef } from 'react';

const ParticleAnimation = () => {
  const canvasRef = useRef(null);
  const pointRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef([]);
  const hueRef = useRef(0);
  const max = 200;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    pointRef.current = { x: width / 2, y: height / 2 };

    const { random, atan2, cos, sin, hypot } = Math;

    class Particle {
      init() {
        this.hue = hueRef.current;
        this.alpha = 0;
        this.size = this.random(1, 5);
        this.x = this.random(0, width);
        this.y = this.random(0, height);
        this.velocity = this.random(0.1, 0.3);
        this.changed = null;
        this.changedFrame = 0;
        this.maxChangedFrames = 50;
        this.angle = random(0, 2 * Math.PI);
        return this;
      }

      draw() {
        // Use dark stroke colors for visibility on white background
        ctx.strokeStyle = Math.random() < 0.5
  ? `hsla(210, 100%, 85%, ${this.alpha})`
  : `hsla(0, 0%, 100%, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx.stroke();
        this.update();
      }

      update() {
        const point = pointRef.current;
        
          let dx = point.x - this.x;
          let dy = point.y - this.y;
          let angle = atan2(dy, dx);

          this.alpha = Math.min(this.alpha + 0.01, 1);
  this.x += this.velocity * Math.cos(this.angle);
  this.y += this.velocity * Math.sin(this.angle);


        if(this.x < 0 || this.x > width || this.y < 0 || this.y > height){
            this.reset();
        }
      }

      reset() {
        this.init();
      }

      distance(x, y) {
        return hypot(x - this.x, y - this.y);
      }

      random(min, max) {
        return random() * (max - min) + min;
      }
    }

    const animate = () => {
      // White semi-transparent background to create a trailing effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(0, 0, width, height);
      particlesRef.current.forEach(p => p.draw());
      hueRef.current += 0.3;
      requestAnimationFrame(animate);
    };

    const touches = (e) => {
      const touch = e.touches ? e.touches[0] : e;
      pointRef.current.x = touch.clientX;
      pointRef.current.y = touch.clientY;
    };

    for (let i = 0; i < max; i++) {
      setTimeout(() => {
        let p = new Particle().init();
        particlesRef.current.push(p);
      }, i * 10);
    }

    canvas.addEventListener('mousemove', touches);
    canvas.addEventListener('touchmove', touches);
    canvas.addEventListener('mouseleave', () => {
      pointRef.current = { x: width / 2, y: height / 2 };
    });

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      pointRef.current = { x: width / 2, y: height / 2 };
    };

    window.addEventListener('resize', handleResize);

    animate();

    return () => {
      canvas.removeEventListener('mousemove', touches);
      canvas.removeEventListener('touchmove', touches);
      canvas.removeEventListener('mouseleave', () => {});
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        background: 'white',
        zIndex: -1,
      }}
    />
  );
};

export default ParticleAnimation;
