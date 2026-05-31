import React, { useEffect, useState } from 'react';

interface HTMLAnimationPlayerProps {
  type: 'neon-city' | 'digital-rain' | 'abstract-grid' | 'space-voyage' | 'minimal-geometry' | 'eco-future';
  isPlaying: boolean;
}

export default function HTMLAnimationPlayer({ type, isPlaying }: HTMLAnimationPlayerProps) {
  const [dots, setDots] = useState<{ x: number; y: number; size: number; speed: number; opacity: number }[]>([]);

  // Seed some coordinates for moving elements to keep it deterministic but lively
  useEffect(() => {
    const d = Array.from({ length: 35 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 2 + 1,
      opacity: Math.random() * 0.8 + 0.2
    }));
    setDots(d);
  }, [type]);

  // Handle dynamic coordinate movement if playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setDots(prev =>
        prev.map(dot => {
          let newY = dot.y + dot.speed * 0.3;
          let newX = dot.x;
          if (type === 'digital-rain') {
            if (newY > 100) newY = 0;
          } else if (type === 'space-voyage') {
            newY = dot.y + (dot.y - 50) * 0.04;
            newX = dot.x + (dot.x - 50) * 0.04;
            if (newY > 100 || newY < 0 || newX > 100 || newX < 0) {
              newY = 45 + Math.random() * 10;
              newX = 45 + Math.random() * 10;
            }
          } else {
            if (newY > 100) newY = 0;
          }
          return { ...dot, y: newY, x: newX };
        })
      );
    }, 45);
    return () => clearInterval(interval);
  }, [isPlaying, type]);

  const renderAnimationContent = () => {
    switch (type) {
      case 'digital-rain':
        return (
          <div className="absolute inset-0 bg-[#060e20] overflow-hidden font-mono text-[10px] text-[#4cd7f6]/80 flex justify-between px-4">
            {Array.from({ length: 15 }).map((_, colIndex) => {
              const activeDot = dots[colIndex * 2 % dots.length] || { y: 0 };
              return (
                <div key={colIndex} className="relative h-full flex flex-col justify-start">
                  <div 
                    className="absolute transition-all duration-75 flex flex-col items-center gap-1.5"
                    style={{ top: `${activeDot.y}%` }}
                  >
                    <span className="text-white animate-pulse">0</span>
                    <span className="opacity-80">1</span>
                    <span className="opacity-60">X</span>
                    <span className="opacity-40">[]</span>
                  </div>
                </div>
              );
            })}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#060e20]/10 to-[#060e20]/60 pointer-events-none"></div>
          </div>
        );

      case 'neon-city':
        return (
          <div className="absolute inset-0 bg-[#0b1326] flex items-center justify-center overflow-hidden">
            {/* Perspective Grid Floor */}
            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#ddb7ff]/20 to-transparent opacity-60 overflow-hidden">
              <div 
                className="w-full h-96 border-t-2 border-[#ddb7ff]/30 origin-bottom"
                style={{
                  backgroundImage: 'radial-gradient(circle, transparent 20%, #0b1326 20%), linear-gradient(to right, rgba(221,183,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(221,183,255,0.1) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                  transform: 'perspective(180px) rotateX(65deg) scale(2)',
                  animation: isPlaying ? 'gridMove 10s linear infinite' : 'none'
                }}
              ></div>
            </div>

            {/* Glowing neon skyline wireframes */}
            <div className="absolute bottom-1/4 left-0 right-0 h-40 flex items-end justify-around px-8 scale-110">
              <div className="w-16 h-36 border border-[#ddb7ff]/60 border-b-0 bg-[#0b1326]/80 flex flex-col justify-between p-1.5 shadow-[0_0_15px_rgba(221,183,255,0.15)] animate-pulse">
                <div className="h-4 border border-[#ddb7ff]/20"></div>
                <div className="h-6 border border-[#ddb7ff]/20"></div>
                <div className="h-10 border border-[#ddb7ff]/20"></div>
              </div>
              <div className="w-24 h-48 border border-[#4cd7f6]/60 border-b-0 bg-[#0b1326]/80 p-2 shadow-[0_0_20px_rgba(76,215,246,0.15)]">
                <div className="grid grid-cols-2 gap-1 h-32">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="border border-[#4cd7f6]/30 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="w-12 h-28 border border-[#b76dff]/60 border-b-0 bg-[#0b1326]/80 p-1 flex items-center justify-center shadow-[0_0_15px_rgba(183,109,255,0.15)]">
                <div className="w-full h-full bg-[#b76dff]/10 border border-dashed border-[#b76dff]"></div>
              </div>
              <div className="w-20 h-40 border border-[#ddb7ff]/60 border-b-0 bg-[#0b1326]/80 p-1.5 shadow-[0_0_15px_rgba(221,183,255,0.1)]">
                <div className="h-full border-l border-r border-[#ddb7ff]/20 flex flex-col justify-between py-1">
                  <div className="h-1 bg-[#ddb7ff]/45"></div>
                  <div className="h-1 bg-[#ddb7ff]/45"></div>
                  <div className="h-1 bg-[#ddb7ff]/45"></div>
                </div>
              </div>
            </div>

            {/* Pulsing sky neon sun */}
            <div className="absolute top-12 w-32 h-32 rounded-full bg-gradient-to-b from-[#ddb7ff]/80 to-[#b76dff]/15 border border-[#ddb7ff]/40 shadow-[0_0_30px_rgba(221,183,255,0.3)] flex flex-col justify-between overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-1.5 w-full bg-[#0b1326] opacity-90" style={{ transform: `translateY(${i * 6}px)` }}></div>
              ))}
            </div>
            
            {/* Moving particles */}
            <div className="absolute inset-0 pointer-events-none">
              {dots.slice(0, 15).map((dot, k) => (
                <div 
                  key={k} 
                  className="absolute bg-[#ddb7ff] rounded-full filter blur-[0.5px]"
                  style={{
                    left: `${dot.x}%`,
                    top: `${dot.y * 0.6}%`,
                    width: `${dot.size}px`,
                    height: `${dot.size}px`,
                    opacity: dot.opacity
                  }}
                />
              ))}
            </div>
          </div>
        );

      case 'abstract-grid':
        return (
          <div className="absolute inset-0 bg-[#060e20] overflow-hidden flex items-center justify-center">
            {/* Big rotating wireframe cube/octahedron */}
            <div 
              className="absolute w-56 h-56 border-2 border-dashed border-[#4cd7f6]/40 rounded-full flex items-center justify-center"
              style={{
                transform: `rotate(${isPlaying ? dots[0]?.y * 4 : 45}deg)`,
                transition: 'transform 0.1s linear'
              }}
            >
              <div 
                className="w-40 h-40 border-2 border-[#ddb7ff]/50 rounded-xl flex items-center justify-center"
                style={{
                  transform: `rotate(${isPlaying ? -dots[0]?.y * 2 : -30}deg)`,
                  transition: 'transform 0.1s linear'
                }}
              >
                <div className="w-24 h-24 border border-[#4cd7f6] bg-[#4cd7f6]/10 transform rotate-45 flex items-center justify-center shadow-[0_0_20px_rgba(76,215,246,0.3)]">
                  <div className="w-10 h-10 border border-[#ddb7ff] bg-[#ddb7ff]/20 animate-ping"></div>
                </div>
              </div>
            </div>

            {/* Scanning radar line */}
            <div 
              className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-r from-transparent via-[#4cd7f6] to-transparent pointer-events-none"
              style={{
                left: `${isPlaying ? (Date.now() / 25) % 100 : 50}%`,
                boxShadow: '0 0 15px rgba(76,215,246,0.8)'
              }}
            ></div>

            {/* Flowing horizontal vectors */}
            <div className="absolute inset-x-0 top-1/4 h-1/2 border-t border-b border-[#1e293b]/50 pointer-events-none">
              <svg className="w-full h-full text-[#4cd7f6]/30">
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" />
                <path d="M 0,20 Q 250,150 500,20 T 1000,20" fill="none" stroke="#ddb7ff" strokeWidth="2" className="opacity-70" />
              </svg>
            </div>
          </div>
        );

      case 'space-voyage':
        return (
          <div className="absolute inset-0 bg-[#020617] overflow-hidden flex items-center justify-center">
            {/* Center Nebula */}
            <div className="absolute w-64 h-64 rounded-full bg-gradient-to-tr from-[#ddb7ff]/10 to-[#4cd7f6]/10 blur-[80px]"></div>

            {/* Flying Stars */}
            {dots.map((dot, k) => (
              <div 
                key={k} 
                className="absolute bg-white rounded-full transition-all duration-75"
                style={{
                  left: `${dot.x}%`,
                  top: `${dot.y}%`,
                  width: `${dot.size * 1.5}px`,
                  height: `${dot.size * 1.5}px`,
                  opacity: dot.opacity,
                  boxShadow: dot.size > 2 ? '0 0 8px rgba(255,255,255,0.8)' : 'none'
                }}
              />
            ))}

            {/* Central Planet Wireframe */}
            <div className="w-48 h-48 rounded-full border border-dashed border-[#4cd7f6]/50 flex items-center justify-center relative">
              <div className="absolute inset-y-0 w-12 border-l border-r border-[#4cd7f6]/30 rounded-full"></div>
              <div className="absolute inset-x-0 h-12 border-t border-b border-[#4cd7f6]/30 rounded-full"></div>
              <div className="w-16 h-16 bg-[#b76dff]/20 border border-[#ddb7ff] rounded-full shadow-[0_0_25px_rgba(221,183,255,0.4)] animate-pulse"></div>
            </div>
          </div>
        );

      case 'minimal-geometry':
        return (
          <div className="absolute inset-0 bg-[#0f172a] overflow-hidden flex items-center justify-center">
            <div className="grid grid-cols-3 gap-6 p-10 max-w-lg w-full">
              {Array.from({ length: 6 }).map((_, index) => {
                const rotation = isPlaying ? (Date.now() / 20 + index * 45) % 360 : index * 45;
                const scale = 0.8 + Math.sin((Date.now() / 500) + index) * 0.15;
                return (
                  <div 
                    key={index} 
                    className="aspect-square flex items-center justify-center transition-all duration-100"
                    style={{
                      transform: isPlaying ? `scale(${scale})` : 'none'
                    }}
                  >
                    {index % 3 === 0 && (
                      <div 
                        className="w-16 h-16 border-2 border-[#ddb7ff] bg-transparent"
                        style={{ transform: `rotate(${rotation}deg)` }}
                      ></div>
                    )}
                    {index % 3 === 1 && (
                      <div 
                        className="w-16 h-16 rounded-full border-2 border-[#4cd7f6] flex items-center justify-center"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#4cd7f6]/30"></div>
                      </div>
                    )}
                    {index % 3 === 2 && (
                      <div 
                        style={{ transform: `rotate(${rotation}deg)` }}
                        className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[50px] border-b-[#b76dff] opacity-80"
                      ></div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Bauhaus side decoration info readouts */}
            <div className="absolute bottom-4 left-4 font-mono text-[9px] text-[#cfc2d6]/40 uppercase tracking-widest flex flex-col gap-0.5">
              <span>grid system : active</span>
              <span>ratio : 1.618 (golden rule)</span>
            </div>
          </div>
        );

      case 'eco-future':
        return (
          <div className="absolute inset-0 bg-[#06100c] overflow-hidden flex items-center justify-center">
            {/* Holographic growing plant stem / grids */}
            <div className="absolute inset-x-0 bottom-0 h-2/3 flex flex-col items-center justify-end">
              <svg className="w-64 h-full text-emerald-400/30">
                {/* Simulated stem */}
                <path d="M 128,400 Q 110,250 128,100 T 110,20" fill="none" stroke="#4cd7f6" strokeWidth="2" strokeDasharray="3,3" />
                
                {/* Pulse node glowing */}
                <circle cx="128" cy="200" r={isPlaying ? 6 + Math.abs(Math.sin(Date.now() / 300)) * 5 : 6} fill="#4cd7f6" className="shadow-[0_0_15px_#4cd7f6]" />
                <circle cx="121" cy="90" r="5" fill="#ddb7ff" />

                {/* Leaves circles */}
                <path d="M 128,200 C 50,180 80,120 128,200" fill="#4cd7f6/10" stroke="#4cd7f6" strokeWidth="1" />
                <path d="M 128,200 C 206,180 176,120 128,200" fill="rgb(221,183,255,0.1)" stroke="#ddb7ff" strokeWidth="1" />
              </svg>
            </div>
            
            {/* Small glowing bio nutrient pods ascending */}
            <div className="absolute inset-0">
              {dots.map((dot, k) => (
                <div 
                  key={k} 
                  className="absolute rounded-full transition-all duration-75 text-emerald-400 border border-emerald-400/20 shadow-[0_0_10px_rgba(76,215,246,0.3)] flex items-center justify-center"
                  style={{
                    left: `${dot.x}%`,
                    top: `${dot.y}%`,
                    width: `${dot.size * 3}px`,
                    height: `${dot.size * 3}px`,
                    opacity: dot.opacity,
                    backgroundColor: dot.size > 2.5 ? 'rgba(76, 215, 246, 0.2)' : 'rgba(183, 109, 255, 0.2)'
                  }}
                />
              ))}
            </div>

            <div className="absolute top-4 right-4 font-mono text-[9px] text-emerald-400/60 uppercase border border-emerald-400/20 rounded px-2 py-0.5 bg-emerald-900/10">
              BIO_GENESIS_SYSTEM // LIVE
            </div>
          </div>
        );

      default:
        return (
          <div className="absolute inset-0 bg-[#0f172a] flex items-center justify-center">
            <p className="text-sm font-mono text-[#ddb7ff]">PREVIEW CANVAS ACTIVE</p>
          </div>
        );
    }
  };

  return (
    <div id="html-animation-viewport" className="relative w-full h-full select-none">
      {renderAnimationContent()}
    </div>
  );
}
