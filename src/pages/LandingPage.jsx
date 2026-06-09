import React, { useEffect, useState } from 'react'

// Floating particles — green palette
function generateParticles(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 4,
    duration: Math.random() * 6 + 5,
    opacity: Math.random() * 0.5 + 0.1,
    color: ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#065f46'][Math.floor(Math.random() * 5)],
  }))
}

const PARTICLES = generateParticles(55)

function LandingPage({ onComplete }) {
  const [phase, setPhase] = useState('init') // init → logoIn → sloganIn → fadeOut

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('logoIn'),   100)
    const t2 = setTimeout(() => setPhase('sloganIn'), 900)
    const t3 = setTimeout(() => setPhase('fadeOut'),  4000)
    const t4 = setTimeout(() => onComplete(),          4600)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [onComplete])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'radial-gradient(ellipse at 50% 40%, #071a0f 0%, #020c06 70%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        opacity: phase === 'fadeOut' ? 0 : 1,
        transition: 'opacity 0.6s ease',
      }}
    >
      {/* ── Floating particles ── */}
      {PARTICLES.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
          width: `${p.size}px`, height: `${p.size}px`, borderRadius: '50%',
          background: p.color, opacity: p.opacity,
          animation: `particleFloat ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
        }} />
      ))}

      {/* ── Sweeping light beam ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(105deg, transparent 30%, rgba(34,197,94,0.06) 50%, transparent 70%)',
        animation: 'shimmerSweep 3.5s ease-in-out 1s infinite',
        pointerEvents: 'none',
      }} />

      {/* ── Pulsing glow rings (green) ── */}
      <div style={{
        position: 'absolute',
        width: '440px', height: '440px',
        border: '1px solid rgba(34,197,94,0.18)',
        borderRadius: '50%',
        animation: 'ringPulse 2.8s ease-out 0.4s infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: '350px', height: '350px',
        border: '1px solid rgba(74,222,128,0.12)',
        borderRadius: '50%',
        animation: 'ringPulse 2.8s ease-out 1s infinite',
        pointerEvents: 'none',
      }} />

      {/* ── Central radial green glow ── */}
      <div style={{
        position: 'absolute', width: '380px', height: '380px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,0.14) 0%, rgba(6,78,59,0.12) 50%, transparent 80%)',
        pointerEvents: 'none',
        animation: 'glowPulse 3s ease-in-out infinite',
      }} />

      {/* ── LOGO ── */}
      <div style={{
        position: 'relative',
        opacity: phase === 'init' ? 0 : 1,
        transform: phase === 'init' ? 'scale(0.6) translateY(30px)' : 'scale(1) translateY(0)',
        transition: 'opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {/* Shimmer pass over logo */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.07) 50%, transparent 60%)',
          animation: 'logoShimmer 3.5s ease-in-out 1.8s infinite',
          pointerEvents: 'none',
        }} />
        <img
          src="/garuda-logo-green.png"
          alt="GARUDA ERP"
          style={{
            width: '310px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 28px rgba(34,197,94,0.5)) drop-shadow(0 0 60px rgba(34,197,94,0.2))',
            animation: phase !== 'init' ? 'logoFloat 4s ease-in-out infinite' : 'none',
            display: 'block',
          }}
        />
      </div>

      {/* ── Slogan ── */}
      <div style={{
        marginTop: '10px', textAlign: 'center',
        opacity: (phase === 'sloganIn' || phase === 'fadeOut') ? 1 : 0,
        transform: (phase === 'sloganIn' || phase === 'fadeOut') ? 'translateY(0)' : 'translateY(18px)',
        transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
      }}>
        <p style={{
          color: '#22c55e',
          fontSize: '12px', fontWeight: '800',
          letterSpacing: '0.4em', textTransform: 'uppercase',
          fontFamily: '"Segoe UI", sans-serif',
          textShadow: '0 0 20px rgba(34,197,94,0.7), 0 0 40px rgba(34,197,94,0.3)',
          margin: 0,
        }}>
          The Wings of Logistics
        </p>
        {/* Animated expanding underline */}
        <div style={{
          margin: '10px auto 0',
          height: '1.5px',
          background: 'linear-gradient(to right, transparent, #22c55e, #86efac, #22c55e, transparent)',
          width: (phase === 'sloganIn' || phase === 'fadeOut') ? '220px' : '0px',
          transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1) 0.2s',
          boxShadow: '0 0 8px rgba(34,197,94,0.7)',
        }} />
      </div>

      {/* ── Bottom progress bar ── */}
      <div style={{
        position: 'absolute', bottom: '48px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
        opacity: (phase === 'sloganIn' || phase === 'fadeOut') ? 1 : 0,
        transition: 'opacity 0.6s ease 0.5s',
      }}>
        <div style={{
          width: '160px', height: '2px',
          background: 'rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(to right, #16a34a, #22c55e, #86efac)',
            borderRadius: '4px',
            animation: 'loadBar 3.5s ease forwards',
            boxShadow: '0 0 8px rgba(34,197,94,0.8)',
          }} />
        </div>
        <p style={{
          color: 'rgba(255,255,255,0.3)', fontSize: '9px',
          letterSpacing: '0.35em', fontWeight: '700',
          textTransform: 'uppercase', fontFamily: '"Segoe UI", sans-serif', margin: 0,
        }}>
          Initializing System
        </p>
      </div>

      <style>{`
        @keyframes particleFloat {
          from { transform: translateY(0px) translateX(0px); }
          to   { transform: translateY(-28px) translateX(10px); }
        }
        @keyframes shimmerSweep {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        @keyframes ringPulse {
          0%   { transform: scale(0.85); opacity: 0.7; }
          100% { transform: scale(1.5);  opacity: 0; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; transform: scale(1);   }
          50%       { opacity: 1;   transform: scale(1.1); }
        }
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-8px); }
        }
        @keyframes logoShimmer {
          0%   { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%)  skewX(-15deg); }
        }
        @keyframes loadBar {
          0%   { width: 0%;   }
          10%  { width: 15%;  }
          40%  { width: 50%;  }
          70%  { width: 78%;  }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  )
}

export default LandingPage
