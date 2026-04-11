import React, { useState, useEffect, useRef } from 'react';

interface AnimatedDigitProps {
  value: number;
}

const AnimatedDigit: React.FC<AnimatedDigitProps> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [nextValue, setNextValue] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const currentTarget = nextValue !== null ? nextValue : displayValue;
    if (value === currentTarget) return;

    if (isAnimating) {
      if (animationEndTimeoutRef.current) clearTimeout(animationEndTimeoutRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setDisplayValue(nextValue);
      setNextValue(value);
      setIsAnimating(false);

      timeoutRef.current = setTimeout(() => {
        setIsAnimating(true);
        animationEndTimeoutRef.current = setTimeout(() => {
          setDisplayValue(value);
          setNextValue(null);
          setIsAnimating(false);
        }, 300);
      }, 20);
    } else {
      setNextValue(value);
      setIsAnimating(true);

      if (animationEndTimeoutRef.current) clearTimeout(animationEndTimeoutRef.current);
      animationEndTimeoutRef.current = setTimeout(() => {
        setDisplayValue(value);
        setNextValue(null);
        setIsAnimating(false);
      }, 300);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (animationEndTimeoutRef.current) clearTimeout(animationEndTimeoutRef.current);
    };
  }, [value, nextValue, displayValue, isAnimating]);

  return (
    <div className="digit-container">
      <div className={`digit-inner ${isAnimating ? 'animating' : ''}`}>
        <div className="digit-item">
          <span className="value">{displayValue}</span>
        </div>
        <div className="digit-item">
          <span className="value">{nextValue !== null ? nextValue : ''}</span>
        </div>
      </div>
    </div>
  );
};

export default AnimatedDigit;
