import React, { useState, useEffect, useRef, useId, CSSProperties, useMemo, useCallback } from 'react';



// --- Configuration Interface & Defaults ---
export interface LightningParams {
  maxParticles: number;
  lifeBase: number;
  lifeVariance: number;
  borderOffset: number;
  boltAngleBias: number; // Angle offset in radians
  segmentLength: number;
  segmentVariance: number;
  jaggedness: number;     // How much segments deviate *from the main bolt angle*
  glowSize: number;
  glowVariance: number;
  lineWidthBase: number;
  lineWidthVariance: number;
  opacityFadeRate: number;
  color: string;
  glowColor: string;
}
const defaultLightningParams: LightningParams = {
  maxParticles: 350,
  lifeBase: 9,
  lifeVariance: 16,
  borderOffset: 0,
  boltAngleBias: 0,
  segmentLength: 4.5,
  segmentVariance: 4.5,
  jaggedness: 0.8,
  glowSize: 4.0,
  glowVariance: 2.0,
  lineWidthBase: 1.0,
  lineWidthVariance: 0.5,
  opacityFadeRate: 0.04,
  color: 'rgba(255, 175, 50, 1.0)',
  glowColor: 'rgba(255, 145, 20, 0.75)',
};

const LOCALSTORAGE_KEY = 'thinkingUISettings';

// --- Helper Function to Load Settings ---
const loadSettingsFromStorage = (): LightningParams => {
  try {
    const storedSettings = localStorage.getItem(LOCALSTORAGE_KEY);
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      return { ...defaultLightningParams, ...parsed };
    }
  } catch (error) {
    console.error("Error loading ThinkingUI settings from localStorage:", error);
  }
  return defaultLightningParams;
};

// --- Particle Interface ---
interface Particle {
  x: number; y: number;
  life: number; maxLife: number; opacity: number;
  angle: number; // Base angle for the entire bolt (includes bias)
}

// --- ThinkingUI Component ---
export interface ThinkingUIProps {
  tokens: string;
  thinkingDuration: number;
  collapsedHeightClass?: string;
}

export const ThinkingUI: React.FC<ThinkingUIProps> = ({
  tokens,
  thinkingDuration,
  collapsedHeightClass = 'h-28',
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const [lightningParams, setLightningParams] = useState<LightningParams>(loadSettingsFromStorage);
  const paramsRef = useRef<LightningParams>(lightningParams); // Keep this ref for animation loop
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const uniqueId = useId();

  // Update paramsRef whenever lightningParams state changes
  useEffect(() => {
    paramsRef.current = lightningParams;
  }, [lightningParams]);


  const toggleExpand = () => setIsExpanded(!isExpanded);
  const toggleSettings = () => setIsSettingsOpen(prev => !prev);

  // Effect to save settings
  useEffect(() => {
    try {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(lightningParams));
    } catch (error) { console.error("Error saving settings:", error); }
  }, [lightningParams]);

  // Effect for text scrolling/overflow
  useEffect(() => {
    const element = contentRef.current; if (!element) return;
    const checkAndSetOverflow = () => {
        const currentlyOverflowing = element.scrollHeight > element.clientHeight;
        if (currentlyOverflowing !== isOverflowing) setIsOverflowing(currentlyOverflowing);
    }; checkAndSetOverflow();
    if (!isExpanded) element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
  }, [tokens, isExpanded, isOverflowing, collapsedHeightClass]);

  // Helper: Add Particle
  // Use useCallback as it's used in the sync effect
  const addParticle = useCallback(() => {
    const currentParams = paramsRef.current;
    const particles = particlesRef.current;
    const canvas = canvasRef.current; if (!canvas) return;
    const width = canvas.offsetWidth; const height = canvas.offsetHeight;
    if (width === 0 || height === 0) return;

    const sideChoice = Math.random();
    let x = 0, y = 0; let baseAngle = 0;
    if (sideChoice < 0.25) { x = Math.random() * width; y = currentParams.borderOffset; baseAngle = Math.PI / 2; }
    else if (sideChoice < 0.5) { x = width - currentParams.borderOffset; y = Math.random() * height; baseAngle = Math.PI; }
    else if (sideChoice < 0.75) { x = Math.random() * width; y = height - currentParams.borderOffset; baseAngle = -Math.PI / 2; }
    else { x = currentParams.borderOffset; y = Math.random() * height; baseAngle = 0; }

    const boltBaseAngle = baseAngle + currentParams.boltAngleBias;
    const life = currentParams.lifeBase + Math.random() * currentParams.lifeVariance;
    particles.push({ x, y, life, maxLife: life, opacity: 0.8 + Math.random() * 0.2, angle: boltBaseAngle });
  }, []); // Empty dependency because it reads refs

  // Sync Effect: Adjust particle density (only depends on lightningParams.maxParticles indirectly via lightningParams)
  useEffect(() => {
    const currentParams = paramsRef.current; // Read latest params from ref
    const newMaxParticles = currentParams.maxParticles;
    const particles = particlesRef.current;
    const currentCount = particles.length;

    // Check if adjustment is needed (avoids running addParticle unnecessarily on other param changes)
    if (newMaxParticles > currentCount) {
        const needed = newMaxParticles - currentCount;
        for (let i = 0; i < needed; i++) addParticle();
    } else if (newMaxParticles < currentCount) {
        particles.length = Math.max(0, newMaxParticles);
    }
    // No dependency on lightningParams needed here as paramsRef is always current
    // and addParticle is stable. The trigger is implicit when the state update happens.
    // However, explicitly adding lightningParams.maxParticles makes intent clearer.
  }, [lightningParams.maxParticles, addParticle]);


  // Main Animation Effect
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const particles = particlesRef.current;
    let width = 0; let height = 0;
    let resizeObserver: ResizeObserver | null = null;

    const resizeCanvas = () => { /* ... same resize logic ... */
        const container = canvas.parentElement; if (container) { canvas.width = container.offsetWidth; canvas.height = container.offsetHeight; width = canvas.width; height = canvas.height; } else { /* fallback */ canvas.width=300; canvas.height=150; width=canvas.width; height=canvas.height; }
    };
    const setupOnResize = () => {
        resizeCanvas();
        particles.length = 0; // Clear existing
        const currentParams = paramsRef.current; // Read latest
        for(let i=0; i < currentParams.maxParticles; ++i) addParticle(); // Repopulate based on current setting
    };

    const animate = () => {
       const currentParams = paramsRef.current;
       if (!ctx || !canvas || width === 0 || height === 0) { animationFrameRef.current = requestAnimationFrame(animate); return; }
       ctx.clearRect(0, 0, width, height);

       for (let i = particles.length - 1; i >= 0; i--) {
           const p = particles[i];
           p.life--;
           p.opacity = Math.max(0, p.opacity - currentParams.opacityFadeRate);
           const lifeRatio = Math.max(0, p.life / p.maxLife);
           const currentOpacity = p.opacity * lifeRatio;

           if (currentOpacity > 0.05) {
               ctx.save();
               ctx.shadowColor = currentParams.glowColor;
               ctx.shadowBlur = currentParams.glowSize + Math.random() * currentParams.glowVariance;
               ctx.globalAlpha = currentOpacity;
               ctx.strokeStyle = currentParams.color;
               ctx.lineWidth = currentParams.lineWidthBase + Math.random() * currentParams.lineWidthVariance;
               ctx.lineCap = 'round';
               ctx.beginPath(); ctx.moveTo(p.x, p.y);
               let currentX = p.x; let currentY = p.y;
               const totalLength = currentParams.segmentLength + Math.random() * currentParams.segmentVariance;
               const segments = 2 + Math.floor(Math.random()*2);
               const segmentLength = totalLength / segments;
               for (let j = 0; j < segments; j++) {
                   const deviationDirection = Math.random() < 0.5 ? -1 : 1;
                   const deviationMagnitude = Math.random() * currentParams.jaggedness;
                   const segmentAngle = p.angle + deviationDirection * deviationMagnitude;
                   const nextX = currentX + Math.cos(segmentAngle) * segmentLength;
                   const nextY = currentY + Math.sin(segmentAngle) * segmentLength;
                   ctx.lineTo(nextX, nextY); currentX = nextX; currentY = nextY;
               }
               ctx.stroke(); ctx.restore();
           }
           if (p.life <= 0 || p.opacity <= 0) {
               particles.splice(i, 1);
               if (particles.length < currentParams.maxParticles) { addParticle(); }
           }
       }
       animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Setup & Start
    if (canvas.parentElement && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(setupOnResize); resizeObserver.observe(canvas.parentElement);
    } else { window.addEventListener('resize', setupOnResize); }
    resizeCanvas(); // Initial resize
    // Initial population based on current paramsRef
    const initialNeeded = paramsRef.current.maxParticles - particlesRef.current.length;
    for(let i=0; i < initialNeeded; ++i) addParticle();

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animate(); // Start loop

    // Cleanup
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = undefined;
      if (resizeObserver && canvas?.parentElement) { resizeObserver.unobserve(canvas.parentElement); resizeObserver.disconnect(); }
      else { window.removeEventListener('resize', setupOnResize); }
      // Keep particles for potential next render? Or clear? Let's clear for safety.
      // particlesRef.current.length = 0;
    };
  }, [addParticle]); // Depend on stable addParticle

  // --- Text Fade Mask ---
  const fadeTopEndPercent = '15%'; const fadeBottomStartPercent = '85%';
  const maskStyle: CSSProperties = !isExpanded && isOverflowing ? {
    maskImage: `linear-gradient(to bottom, transparent 0%, black ${fadeTopEndPercent}, black ${fadeBottomStartPercent}, transparent 100%)`,
    WebkitMaskImage: `linear-gradient(to bottom, transparent 0%, black ${fadeTopEndPercent}, black ${fadeBottomStartPercent}, transparent 100%)`,
   } : {};
  const contentClasses = `relative no-scrollbar transition-[height] duration-300 ease-in-out ${isExpanded ? 'h-auto' : `${collapsedHeightClass} overflow-hidden`}`;

  // --- Internal Handler for Slider Changes ---
  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type } = e.target;
      setLightningParams(prevParams => ({ // Update internal state
          ...prevParams,
          [name]: type === 'range' || type === 'number' ? parseFloat(value) : value
      }));
  };

  return (
    <div
      className="bg-[rgb(16,16,16)] rounded-lg p-4 shadow-md w-full font-sans"
      style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px' }}
    >
      {/* <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1, borderRadius: 'inherit' }}
      /> */}
      {/* Header */}
      <div
        className="flex items-center justify-between mb-2 text-xs text-gray-400 relative"
        style={{ zIndex: 3 }} // Ensure header is above settings panel content
      >
         <div
            className="flex items-center space-x-1.5 flex-grow cursor-pointer"
            onClick={toggleExpand} role="button" aria-expanded={isExpanded} aria-controls={uniqueId + '-content'}
            tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleExpand(); }}
         >
             <span className="font-medium text-[11px] text-gray-300">Thinking</span>
             <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className={`text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`} aria-hidden="true"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
         </div>
         <div className="flex items-center space-x-2 shrink-0">
             <span className="text-[11px] text-gray-400">{thinkingDuration}s</span>
             <button onClick={toggleSettings} aria-label="Toggle Lightning Settings" className="p-1 text-gray-500 hover:text-gray-300 focus:outline-none focus:ring-1 focus:ring-orange-500 rounded" aria-pressed={isSettingsOpen} >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.566.379-1.566 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.566 2.6 1.566 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01-.947-2.287c1.566-.379 1.566-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
             </button>
         </div>
      </div>

      {/* --- Settings Panel (Positioned in Flow) --- */}
      {isSettingsOpen && (
          <div
              className="mt-2 p-4 bg-opacity-90 rounded-md shadow-lg text-white text-sm space-y-3 border border-gray-600 relative" // Use relative for normal flow, add margin-top
              style={{ zIndex: 2 }} // Ensure it's above canvas but below potentially absolutely positioned items if needed
          >
              <div className="flex justify-between items-center mb-2">
                 <h3 className="text-base font-semibold">Lightning Settings</h3>
                 <button onClick={toggleSettings} aria-label="Close Settings" className="p-1 text-gray-400 hover:text-white focus:outline-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              {/* Sliders */}
              <div className="flex items-center justify-between"><label htmlFor="maxParticles" className="w-28 shrink-0">Density:</label><input type="range" id="maxParticles" name="maxParticles" min="10" max="1000" step="10" value={lightningParams.maxParticles} onChange={handleParamChange} className="flex-grow mx-2 accent-orange-500 h-1.5"/><span className="w-12 text-right text-xs">{lightningParams.maxParticles}</span></div>
              <div className="flex items-center justify-between"><label htmlFor="borderOffset" className="w-28 shrink-0">Border Offset:</label><input type="range" id="borderOffset" name="borderOffset" min="-15" max="15" step="0.5" value={lightningParams.borderOffset} onChange={handleParamChange} className="flex-grow mx-2 accent-orange-500 h-1.5"/><span className="w-12 text-right text-xs">{lightningParams.borderOffset.toFixed(1)}</span></div>
              <div className="flex items-center justify-between"><label htmlFor="boltAngleBias" className="w-28 shrink-0">Bolt Angle Bias:</label><input type="range" id="boltAngleBias" name="boltAngleBias" min={-Math.PI / 1.5} max={Math.PI / 1.5} step="0.05" value={lightningParams.boltAngleBias} onChange={handleParamChange} className="flex-grow mx-2 accent-orange-500 h-1.5"/><span className="w-12 text-right text-xs">{(lightningParams.boltAngleBias * 180 / Math.PI).toFixed(0)}°</span></div>
              <div className="flex items-center justify-between"><label htmlFor="jaggedness" className="w-28 shrink-0">Jaggedness:</label><input type="range" id="jaggedness" name="jaggedness" min="0" max="3.0" step="0.05" value={lightningParams.jaggedness} onChange={handleParamChange} className="flex-grow mx-2 accent-orange-500 h-1.5"/><span className="w-12 text-right text-xs">{lightningParams.jaggedness.toFixed(2)}</span></div>
              <div className="flex items-center justify-between"><label htmlFor="segmentLength" className="w-28 shrink-0">Bolt Length:</label><input type="range" id="segmentLength" name="segmentLength" min="1" max="20" step="0.5" value={lightningParams.segmentLength} onChange={handleParamChange} className="flex-grow mx-2 accent-orange-500 h-1.5"/><span className="w-12 text-right text-xs">{lightningParams.segmentLength.toFixed(1)}</span></div>
              <div className="flex items-center justify-between"><label htmlFor="lineWidthBase" className="w-28 shrink-0">Line Width:</label><input type="range" id="lineWidthBase" name="lineWidthBase" min="0.2" max="4" step="0.1" value={lightningParams.lineWidthBase} onChange={handleParamChange} className="flex-grow mx-2 accent-orange-500 h-1.5"/><span className="w-12 text-right text-xs">{lightningParams.lineWidthBase.toFixed(1)}</span></div>
              <div className="flex items-center justify-between"><label htmlFor="glowSize" className="w-28 shrink-0">Glow Size:</label><input type="range" id="glowSize" name="glowSize" min="0" max="20" step="0.5" value={lightningParams.glowSize} onChange={handleParamChange} className="flex-grow mx-2 accent-orange-500 h-1.5"/><span className="w-12 text-right text-xs">{lightningParams.glowSize.toFixed(1)}</span></div>
              <div className="flex items-center justify-between"><label htmlFor="lifeBase" className="w-28 shrink-0">Flicker (Life):</label><input type="range" id="lifeBase" name="lifeBase" min="3" max="50" step="1" value={lightningParams.lifeBase} onChange={handleParamChange} className="flex-grow mx-2 accent-orange-500 h-1.5"/><span className="w-12 text-right text-xs">{lightningParams.lifeBase}</span></div>
              <div className="flex items-center justify-between"><label htmlFor="opacityFadeRate" className="w-28 shrink-0">Fade Rate:</label><input type="range" id="opacityFadeRate" name="opacityFadeRate" min="0.01" max="0.15" step="0.005" value={lightningParams.opacityFadeRate} onChange={handleParamChange} className="flex-grow mx-2 accent-orange-500 h-1.5"/><span className="w-12 text-right text-xs">{lightningParams.opacityFadeRate.toFixed(3)}</span></div>
          </div>
      )}

      {/* Content Area Wrapper */}
      <div
        className="relative mt-2" // Add margin-top if settings are closed, panel has its own margin when open
        style={{ ...maskStyle, zIndex: 2 }} // Content area above canvas
      >
        <div
          ref={contentRef} id={uniqueId + '-content'} className={contentClasses}
        >
          <div className="pt-1 pb-1">
              <div className="text-gray-300 text-[11px] leading-snug whitespace-pre-wrap break-words">
                {tokens}
                {!isExpanded && <span className="inline-block w-1.5 h-3 bg-gray-400 animate-pulse ml-0.5 relative top-0.5"></span>}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- ThinkingUITester Component (Unchanged) ---
export const ThinkingUITester: React.FC = () => {
  const [currentTokens, setCurrentTokens] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  // No params state needed here anymore
  const tokenIndexRef = useRef<number>(0);
  const intervalIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => { // Token stream simulation
    if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    const addToken = () => {
         const nextToken = fakeTokens[tokenIndexRef.current % fakeTokens.length] || ' ';
         setCurrentTokens(prevTokens => prevTokens + nextToken);
         tokenIndexRef.current += 1;
         setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    };
    intervalIdRef.current = window.setInterval(addToken, 90);
    return () => { if (intervalIdRef.current) clearInterval(intervalIdRef.current); };
  }, []);

  return (
 <div className="p-4 max-w-md mx-auto ">
          <ThinkingUI
              tokens={currentTokens}
              thinkingDuration={duration}
              // No params prop needed
          />
      </div>     
  );
};


// --- Fake Tokens ---
// --- Fake Tokens ---
const fakeTokens = [
    'Let', "'s", ' think', ' about', ' how', ' to', ' create', ' a', ' virtual', ' anime', ' waifu', ' application', '.', '\n\n',
    'First', ',', ' we', "'ll", ' need', ' to', ' consider', ' the', ' core', ' technologies', ':', '\n',
    '   1.', ' Graphics', ' engine', '\n', '   2.', ' Animation', ' system', '\n', '   3.', ' Voice', ' synthesis', '\n',
    '   4.', ' Dialogue', ' system', '\n', '   5.', ' Customization', '\n\n',
    'Graphics', ':', ' Three.js', '/', ' Pixi.js', ' (web)', ',', ' Unity', '/', ' Unreal', ' (app)', '.', '\n',
    'Model', ':', ' Anime', ' style', ',', ' rigging', ',', ' expressions', ',', ' outfits', ',', ' custom', ' features', '.', '\n\n',
    'AI', ' Personality', ':', '\n', '   -', ' GPT-like', ' LLM', '\n', '   -', ' Memory', '\n',
    '   -', ' Emotion', ' sim', '\n', '   -', ' Preference', ' learning', '\n\n',
    'Voice', ':', ' Amazon', ' Polly', ' or', ' anime', ' voice', ' gen', '.', ' Needs', ' emotion', '.', '\n',
    'Interaction', ':', ' Text', ',', ' voice', ' input', '?', ' Gestures', '?', '\n\n',
    'Tech', ' Stack', ':', ' React', '/', ' Node', '/', ' Python', '.', ' DB', ' for', ' memory', '.', '\n',
    'Ethics', '&', ' Privacy', ' considerations', ' are', ' important', '.', '\n\n',
    'Plan', ':', ' Start', ' with', ' 3D', ' render', ',', ' then', ' AI', '.', '\n',
    'Looks', ' feasible', '.', ' Start', ' implementation', '.'
];