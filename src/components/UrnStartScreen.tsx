import React, { useEffect, useRef, useState } from 'react';

interface UrnStartScreenProps {
  onStartComplete: () => void;
  title?: string;
  subtitle?: string;
}

export const UrnStartScreen: React.FC<UrnStartScreenProps> = ({
  onStartComplete,
  title = 'OSSUARIAN',
  subtitle = 'FIRST URN',
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [statusText, setStatusText] = useState('Awaiting Mortician...');
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const handleStartClick = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setStatusText('Loading...');

    const fadeId = window.setTimeout(() => {
      setStatusText('Settled.');
      setIsFadingOut(true);

      const doneId = window.setTimeout(() => {
        onStartComplete();
      }, 700);
      timersRef.current.push(doneId);
    }, 2300);
    timersRef.current.push(fadeId);
  };

  return (
    <div className={`splash-screen ${isFadingOut ? 'fade-out' : ''}`}>
      <style>{`
        .splash-screen {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          padding:
            max(2rem, env(safe-area-inset-top, 0px), var(--safe-area-inset-top, 0px))
            max(1rem, env(safe-area-inset-right, 0px), var(--safe-area-inset-right, 0px))
            max(2rem, env(safe-area-inset-bottom, 0px), var(--safe-area-inset-bottom, 0px))
            max(1rem, env(safe-area-inset-left, 0px), var(--safe-area-inset-left, 0px));
          background-color: #08080a;
          color: #ebe6dd;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          transition: opacity 0.7s ease;
          user-select: none;
          text-align: center;
        }

        .splash-screen.fade-out {
          opacity: 0;
          pointer-events: none;
        }

        .urn-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: min(100%, 22rem);
          margin: 0 auto;
        }

        .urn-svg {
          width: min(52vw, 210px);
          height: auto;
          aspect-ratio: 210 / 220;
          overflow: visible;
          display: block;
          margin: 0 auto;
        }

        .splash-title {
          margin: 1rem 0 0;
          width: 100%;
          font-family: 'Cinzel', Georgia, 'Times New Roman', serif;
          font-size: clamp(1.45rem, 7vw, 2rem);
          font-weight: 600;
          letter-spacing: 0.18em;
          /* letter-spacing adds trailing space — pad left so the block stays optically centered */
          padding-left: 0.18em;
          color: #ebe6dd;
          text-align: center;
          line-height: 1.15;
        }

        .splash-subtitle {
          margin: 0.45rem 0 0;
          width: 100%;
          font-family: 'Cinzel', Georgia, 'Times New Roman', serif;
          font-size: clamp(0.85rem, 3.8vw, 1.05rem);
          font-weight: 600;
          letter-spacing: 0.28em;
          padding-left: 0.28em;
          color: #c89d66;
          text-align: center;
          text-transform: uppercase;
        }

        .splash-status {
          margin-top: 0.75rem;
          width: 100%;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          padding-left: 0.2em;
          color: #9a958c;
          min-height: 1.2em;
          text-align: center;
        }

        .start-btn {
          margin-top: 1.35rem;
          padding: 0.7rem 1.85rem;
          border-radius: 8px;
          background: #141419;
          border: 1px solid #c89d66;
          color: #ebe6dd;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 0 18px rgba(200, 157, 102, 0.15);
          transition: transform 0.15s ease, background-color 0.2s ease, opacity 0.25s ease;
        }

        .start-btn:active {
          transform: scale(0.96);
          background: #1f1d24;
        }

        .start-btn.hidden-btn {
          opacity: 0;
          pointer-events: none;
        }

        .ash-puff-1, .ash-puff-2, .ash-puff-3 {
          opacity: 0;
        }

        @keyframes urnRock {
          0%, 100% { transform: rotate(0deg); }
          12% { transform: rotate(-6deg); }
          24% { transform: rotate(5.5deg); }
          36% { transform: rotate(-4.5deg); }
          48% { transform: rotate(4deg); }
          60% { transform: rotate(-2.5deg); }
          72% { transform: rotate(1.8deg); }
          84% { transform: rotate(-0.8deg); }
          92% { transform: rotate(0deg); }
        }

        @keyframes lidRattle {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-2px, -3px) rotate(-4deg); }
          20% { transform: translate(2px, -4px) rotate(4.5deg); }
          30% { transform: translate(-1.5px, -2px) rotate(-3deg); }
          40% { transform: translate(2px, -3.5px) rotate(3.5deg); }
          50% { transform: translate(-1px, -2.5px) rotate(-2.5deg); }
          60% { transform: translate(1.5px, -1.5px) rotate(2deg); }
          72% { transform: translate(-0.8px, -1px) rotate(-1deg); }
          85% { transform: translate(0, 0) rotate(0deg); }
        }

        @keyframes ashPuffLeft {
          0% { opacity: 0; transform: translate(0, 0) scale(0.4); }
          20% { opacity: 0.85; }
          75% { opacity: 0.45; }
          100% { opacity: 0; transform: translate(-34px, -26px) scale(1.65); }
        }

        @keyframes ashPuffRight {
          0% { opacity: 0; transform: translate(0, 0) scale(0.4); }
          20% { opacity: 0.85; }
          75% { opacity: 0.45; }
          100% { opacity: 0; transform: translate(34px, -28px) scale(1.7); }
        }

        @keyframes ashPuffCenter {
          0% { opacity: 0; transform: translate(0, 0) scale(0.35); }
          25% { opacity: 0.75; }
          100% { opacity: 0; transform: translate(4px, -38px) scale(1.8); }
        }

        .anim-active .boot-urn-rock {
          transform-origin: 50% 88%;
          animation: urnRock 2.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
        }

        .anim-active .boot-lid-rattle {
          transform-origin: 50% 30%;
          animation: lidRattle 2.2s ease-in-out forwards;
        }

        .anim-active .ash-puff-1 {
          animation: ashPuffLeft 1.1s ease-out 0.25s 2 forwards;
        }

        .anim-active .ash-puff-2 {
          animation: ashPuffRight 1.1s ease-out 0.4s 2 forwards;
        }

        .anim-active .ash-puff-3 {
          animation: ashPuffCenter 1.2s ease-out 0.55s 2 forwards;
        }
      `}</style>

      <div className={`urn-wrapper ${isAnimating ? 'anim-active' : ''}`}>
        <svg viewBox="0 0 200 210" className="urn-svg" aria-hidden="true">
          <defs>
            <radialGradient id="urnMetal" cx="38%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#d4b07c" />
              <stop offset="45%" stopColor="#8c683e" />
              <stop offset="100%" stopColor="#3a2918" />
            </radialGradient>
            <radialGradient id="ashDust" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e5e0d8" stopOpacity="0.75" />
              <stop offset="60%" stopColor="#9a958c" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#9a958c" stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="100" cy="182" rx="44" ry="8" fill="#000000" opacity="0.65" />

          <g className="ash-puff-1">
            <circle cx="72" cy="56" r="11" fill="url(#ashDust)" />
            <circle cx="62" cy="48" r="7" fill="url(#ashDust)" />
          </g>
          <g className="ash-puff-2">
            <circle cx="128" cy="56" r="11" fill="url(#ashDust)" />
            <circle cx="138" cy="47" r="7" fill="url(#ashDust)" />
          </g>
          <g className="ash-puff-3">
            <circle cx="100" cy="46" r="9" fill="url(#ashDust)" />
          </g>

          <g className="boot-urn-rock">
            <path
              d="M74 176 L126 176 L120 164 L80 164 Z"
              fill="url(#urnMetal)"
              stroke="#24190d"
              strokeWidth="1.5"
            />
            <rect
              x="70"
              y="175"
              width="60"
              height="6"
              rx="2"
              fill="#5e4326"
              stroke="#24190d"
              strokeWidth="1.2"
            />
            <path
              d="M80 164 C65 138, 56 105, 68 78 C72 68, 78 64, 78 60 L122 60 C122 64, 128 68, 132 78 C144 105, 135 138, 120 164 Z"
              fill="url(#urnMetal)"
              stroke="#24190d"
              strokeWidth="1.8"
            />
            <path
              d="M67 96 Q100 103 133 96"
              fill="none"
              stroke="#e4c796"
              strokeWidth="2"
              opacity="0.7"
            />
            <path
              d="M68 102 Q100 109 132 102"
              fill="none"
              stroke="#24190d"
              strokeWidth="1.2"
              opacity="0.7"
            />
            <ellipse
              cx="100"
              cy="60"
              rx="23"
              ry="5"
              fill="#4f3820"
              stroke="#24190d"
              strokeWidth="1.5"
            />

            <g className="boot-lid-rattle">
              <path
                d="M74 58 C76 47, 86 43, 100 43 C114 43, 124 47, 126 58 Z"
                fill="url(#urnMetal)"
                stroke="#24190d"
                strokeWidth="1.6"
              />
              <circle
                cx="100"
                cy="37"
                r="6"
                fill="#c89d66"
                stroke="#24190d"
                strokeWidth="1.5"
              />
              <ellipse cx="100" cy="43" rx="8" ry="2.5" fill="#705130" />
            </g>
          </g>
        </svg>

        <h1 className="splash-title">{title}</h1>
        {subtitle ? <p className="splash-subtitle">{subtitle}</p> : null}
        <p className="splash-status">{statusText}</p>

        <button
          type="button"
          onClick={handleStartClick}
          onPointerDown={handleStartClick}
          className={`start-btn ${isAnimating ? 'hidden-btn' : ''}`}
        >
          Start
        </button>
      </div>
    </div>
  );
};
