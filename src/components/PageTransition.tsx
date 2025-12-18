"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    // Only trigger transition if pathname actually changed
    if (pathname !== previousPathnameRef.current) {
      previousPathnameRef.current = pathname;
      
      // Start transition
      setIsTransitioning(true);
      setTransitionProgress(0);
      
      // Animate from 0 to 100 over 1 second with easing
      const startTime = Date.now();
      const duration = 500; // 1 second
      
      // Easing function for smooth animation (ease-out cubic)
      const easeOutCubic = (t: number): number => {
        return 1 - Math.pow(1 - t, 3);
      };
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const rawProgress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(rawProgress);
        const progress = easedProgress * 100;
        
        setTransitionProgress(progress);
        
        if (rawProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Transition complete
          setIsTransitioning(false);
          setTransitionProgress(0);
        }
      };      
      // Update children immediately when transition starts
      setDisplayChildren(children);
      
      // Start animation
      requestAnimationFrame(animate);
    } else {
      // If pathname didn't change, just update children without transition
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  // Calculate blur and opacity based on progress
  // Blur starts at 12px and fades to 0px (blurry to clear)
  // Opacity starts at 0.4 and fades to 1 (semi-transparent to fully visible)
  const blurAmount = 12 - (transitionProgress / 100) * 12; // 12px to 0px
  const opacity = 0.4 + (transitionProgress / 100) * 0.6; // 0.4 to 1

  return (
    <div className="relative w-full">
      <div
        style={{
          opacity: isTransitioning ? opacity : 1,
          filter: isTransitioning ? `blur(${blurAmount}px)` : 'blur(0px)',
          transition: isTransitioning 
            ? 'none' // No CSS transition, we're controlling it with JavaScript
            : 'opacity 300ms ease-out, filter 300ms ease-out',
          willChange: isTransitioning ? 'opacity, filter' : 'auto',
        }}
      >
        {displayChildren}
      </div>
    </div>
  );
}

