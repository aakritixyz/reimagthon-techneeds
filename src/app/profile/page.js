"use client";
import ParticleAnimation from "@/components/heroanimation/hero";

export default function ComingSoon() {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#296c9e',
        padding: '1rem',
        textAlign: 'center'
      }}>

        <ParticleAnimation/>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          animation: 'pulse 2s infinite'
        }}>
          Coming Soon...
        </h1>
        <p style={{
          fontSize: '1.2rem',
          opacity: 0.85,
          maxWidth: '600px',
          marginTop: '1rem'
        }}>
          We're working hard to bring you something amazing. Stay tuned!
        </p>
        <style jsx>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }
        `}</style>
      </div>
    );
  }
  