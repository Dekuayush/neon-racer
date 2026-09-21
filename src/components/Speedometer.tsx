import React, { useEffect, useState, useRef, useMemo } from 'react';

interface SpeedometerProps {
  currentSpeed: number; // Actual physical velocity in KM/H
  topSpeed: number;     // Car baseline top speed
  rpmRatio: number;     // 0 - 1
  gear: number;
  isNitro: boolean;
}

export const Speedometer: React.FC<SpeedometerProps> = React.memo(({
  currentSpeed,
  topSpeed,
  rpmRatio,
  gear,
  isNitro,
}) => {
  // Smoothly interpolated speed needle
  const [displaySpeed, setDisplaySpeed] = useState<number>(0);
  const animRef = useRef<number | null>(null);
  const currentSpeedRef = useRef(currentSpeed);
  currentSpeedRef.current = currentSpeed;

  useEffect(() => {
    let lastTime = performance.now();
    const update = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      setDisplaySpeed(prev => {
        const diff = currentSpeedRef.current - prev;
        return Math.abs(diff) < 0.2 ? currentSpeedRef.current : prev + diff * Math.min(1, dt * 16);
      });

      animRef.current = requestAnimationFrame(update);
    };

    animRef.current = requestAnimationFrame(update);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  let maxScale = 280;
  if (topSpeed > 320) maxScale = 360;
  else if (topSpeed > 300) maxScale = 340;
  else if (topSpeed > 280) maxScale = 320;
  else if (topSpeed > 250) maxScale = 300;
  else maxScale = 280;

  const cx = 160;
  const cy = 160;
  const radius = 120;

  const startAngle = -220;
  const endAngle = 40;
  const totalAngleSpan = endAngle - startAngle; // 260 deg

  const clampedSpeed = Math.max(0, Math.min(maxScale, displaySpeed));
  const speedRatio = clampedSpeed / maxScale;
  const needleAngle = startAngle + speedRatio * totalAngleSpan;

  const redlineThreshold = maxScale * 0.85;

  const polarToCartesian = (centerX: number, centerY: number, rad: number, angleDeg: number) => {
    const angleRad = ((angleDeg - 0) * Math.PI) / 180.0;
    return {
      x: centerX + rad * Math.cos(angleRad),
      y: centerY + rad * Math.sin(angleRad),
    };
  };

  const describeArc = (x: number, y: number, rad: number, startA: number, endA: number) => {
    const start = polarToCartesian(x, y, rad, endA);
    const end = polarToCartesian(x, y, rad, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', rad, rad, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  // Precomputed static SVG paths for zero overhead per frame
  const bgArcPath = useMemo(() => describeArc(cx, cy, radius, startAngle, endAngle), [cx, cy, radius]);
  const redlineStartAngle = startAngle + 0.85 * totalAngleSpan;
  const redlineArcPath = useMemo(() => describeArc(cx, cy, radius, redlineStartAngle, endAngle), [cx, cy, radius, redlineStartAngle, endAngle]);

  const activeArcEndAngle = startAngle + Math.max(0.01, speedRatio * totalAngleSpan);
  const activeArcPath = describeArc(cx, cy, radius, startAngle, activeArcEndAngle);

  // Tick marks precomputed once
  const ticks = useMemo(() => {
    const items = [];
    const step = 20;
    for (let s = 0; s <= maxScale; s += step) {
      const ratio = s / maxScale;
      const angle = startAngle + ratio * totalAngleSpan;
      const isMajor = s % 40 === 0;
      const isRedline = s >= redlineThreshold;

      const innerR = isMajor ? radius - 16 : radius - 10;
      const outerR = radius - 2;

      const p1 = polarToCartesian(cx, cy, innerR, angle);
      const p2 = polarToCartesian(cx, cy, outerR, angle);

      const labelR = radius - 30;
      const labelPos = polarToCartesian(cx, cy, labelR, angle);

      items.push({
        val: s,
        p1,
        p2,
        isMajor,
        isRedline,
        labelPos,
      });
    }
    return items;
  }, [maxScale, redlineThreshold, startAngle, totalAngleSpan, radius, cx, cy]);

  return (
    <div id="vehicle-speedometer" className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 select-none">
      <svg
        viewBox="0 0 320 320"
        className="w-full h-full drop-shadow-[0_0_25px_rgba(0,240,255,0.4)]"
      >
        <defs>
          <radialGradient id="bezelGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#08101e" />
            <stop offset="85%" stopColor="#04070d" />
            <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.4" />
          </radialGradient>
          <radialGradient id="dialBgGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#060b14" />
            <stop offset="80%" stopColor="#020408" />
            <stop offset="100%" stopColor="#001827" />
          </radialGradient>
          <linearGradient id="needleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="70%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id="activeArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="70%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor={displaySpeed >= redlineThreshold ? '#f43f5e' : '#a855f7'} />
          </linearGradient>
          <linearGradient id="glassReflection" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="40%" stopColor="#00f0ff" stopOpacity="0.04" />
            <stop offset="80%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Outer Dark Bezel */}
        <circle cx={cx} cy={cy} r={radius + 32} fill="url(#bezelGrad)" stroke="#00f0ff" strokeOpacity="0.35" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={radius + 29} fill="url(#dialBgGrad)" stroke="#00f0ff" strokeOpacity="0.15" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={radius + 24} fill="none" stroke="#00f0ff" strokeOpacity="0.25" strokeWidth="1.2" strokeDasharray="3 4" />

        {/* 2. Glass Face Specular Reflection */}
        <path d={`M ${cx - radius - 20} ${cy} A ${radius + 20} ${radius + 20} 0 0 1 ${cx + radius + 20} ${cy} Z`} fill="url(#glassReflection)" />

        {/* 3. Base Track Arc */}
        <path d={bgArcPath} fill="none" stroke="#131e33" strokeWidth="11" strokeLinecap="round" />

        {/* 4. Redline Section Background */}
        <path d={redlineArcPath} fill="none" stroke="#ef4444" strokeOpacity="0.3" strokeWidth="11" strokeLinecap="round" />

        {/* 5. Dynamic Lit Velocity Ribbon */}
        <path
          d={activeArcPath}
          fill="none"
          stroke="url(#activeArcGrad)"
          strokeWidth="11"
          strokeLinecap="round"
          className="filter drop-shadow-[0_0_10px_#00f0ff]"
        />

        {/* 6. Calibration Ticks & Numbers */}
        {ticks.map(t => (
          <g key={`tick-${t.val}`}>
            <line
              x1={t.p1.x}
              y1={t.p1.y}
              x2={t.p2.x}
              y2={t.p2.y}
              stroke={t.isRedline ? '#ef4444' : t.isMajor ? '#00f0ff' : '#64748b'}
              strokeWidth={t.isMajor ? 2.5 : 1.2}
              strokeLinecap="round"
              strokeOpacity={t.isRedline ? 0.95 : t.isMajor ? 0.9 : 0.6}
            />
            {t.isMajor && (
              <text
                x={t.labelPos.x}
                y={t.labelPos.y + 4}
                textAnchor="middle"
                fontSize="11"
                fontFamily="'Orbitron', sans-serif"
                fontWeight="bold"
                fill={t.isRedline ? '#f87171' : '#94a3b8'}
                className="select-none pointer-events-none"
              >
                {t.val}
              </text>
            )}
          </g>
        ))}

        {/* 7. Secondary Inner RPM Bar */}
        <circle cx={cx} cy={cy} r={radius - 48} fill="none" stroke="#0a1424" strokeWidth="3.5" />
        <circle
          cx={cx}
          cy={cy}
          r={radius - 48}
          fill="none"
          stroke={rpmRatio > 0.88 ? '#ef4444' : '#00f0ff'}
          strokeWidth="3.5"
          strokeDasharray={`${2 * Math.PI * (radius - 48)}`}
          strokeDashoffset={`${2 * Math.PI * (radius - 48) * (1 - rpmRatio * 0.72)}`}
          className="transition-all duration-75 filter drop-shadow-[0_0_6px_#00f0ff]"
        />

        {/* 8. Animated Tachometer / Speed Needle */}
        <g transform={`rotate(${needleAngle}, ${cx}, ${cy})`}>
          <polygon points={`${cx - 18},${cy} ${cx - 5},${cy - 3} ${cx - 5},${cy + 3}`} fill="#1e293b" />
          <polygon
            points={`${cx - 4},${cy - 3} ${cx + radius - 10},${cy - 1} ${cx + radius - 4},${cy} ${cx + radius - 10},${cy + 1} ${cx - 4},${cy + 3}`}
            fill="url(#needleGrad)"
            className="filter drop-shadow-[0_0_8px_#00f0ff]"
          />
          <line x1={cx} y1={cy} x2={cx + radius - 6} y2={cy} stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx={cx + radius - 5} cy={cy} r="3.2" fill="#ffffff" />
          <circle cx={cx + radius - 5} cy={cy} r="1.5" fill="#00f0ff" />
        </g>

        {/* 9. Center Metallic Hub */}
        <circle cx={cx} cy={cy} r="32" fill="#050914" stroke="#1e293b" strokeWidth="2.5" />
        <circle cx={cx} cy={cy} r="28" fill="#0a1222" stroke="#00f0ff" strokeOpacity="0.4" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r="10" fill="#00f0ff" fillOpacity="0.2" stroke="#00f0ff" strokeWidth="1.2" className="animate-pulse" />
      </svg>

      {/* 10. Large Central Digital Readout & Gear Indicator */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-10 pointer-events-none">
        <div className="flex items-baseline space-x-1.5">
          <span
            id="speedometer-value"
            className={`font-['Orbitron'] font-black tracking-tight text-5xl sm:text-6xl tabular-nums drop-shadow-[0_0_15px_rgba(0,0,0,0.9)] ${
              isNitro
                ? 'text-cyan-300 drop-shadow-[0_0_16px_rgba(0,240,255,0.95)]'
                : displaySpeed >= redlineThreshold
                ? 'text-rose-400 drop-shadow-[0_0_16px_rgba(244,63,94,0.95)]'
                : 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]'
            }`}
          >
            {Math.round(displaySpeed)}
          </span>
          <span className="font-['Orbitron'] font-black italic text-cyan-400 text-sm sm:text-base tracking-wider">
            KM/H
          </span>
        </div>

        <div className="flex items-center space-x-2 mt-1">
          <div className="bg-slate-950/90 border border-cyan-500/40 px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(0,240,255,0.25)]">
            <span className="font-['Orbitron'] font-black text-cyan-300 text-[11px] tracking-widest">
              GEAR {gear}
            </span>
          </div>

          {isNitro && (
            <div className="bg-rose-950/90 border border-rose-500/60 px-2.5 py-0.5 rounded-full animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.6)]">
              <span className="font-['Orbitron'] font-black text-rose-300 text-[11px] tracking-widest">
                NITRO
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

Speedometer.displayName = 'Speedometer';
