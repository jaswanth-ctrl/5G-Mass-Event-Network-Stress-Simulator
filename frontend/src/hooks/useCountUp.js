import { useState, useEffect } from 'react';
import { useMotionValue, useTransform, animate } from 'framer-motion';

export const useCountUp = (value, durationMs = 600, precision = 0) => {
  const [displayValue, setDisplayValue] = useState(value);
  const motionValue = useMotionValue(value || 0);

  // useTransform to map the motion value to a formatted string isn't strictly necessary 
  // if we process it on update, but standard Framer Motion way is fine.
  
  useEffect(() => {
    const controls = animate(motionValue, value || 0, {
      duration: durationMs / 1000,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(latest);
      }
    });

    return controls.stop;
  }, [value, durationMs, motionValue]);

  return displayValue;
};
