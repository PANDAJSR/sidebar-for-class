import React, { useState, useEffect, useRef } from 'react';

/**
 * 动画数字组件
 * 用于显示单个数字，并在数字变化时播放翻转动画
 *
 * @param {Object} props - 组件属性
 * @param {number} props.value - 要显示的数字值 (0-9)
 */
const AnimatedDigit = ({ value }) => {
  // 当前显示的值
  const [displayValue, setDisplayValue] = useState(value);
  // 下一个要显示的值（用于动画）
  const [nextValue, setNextValue] = useState(null);
  // 是否正在动画中
  const [isAnimating, setIsAnimating] = useState(false);

  // 定时器引用，用于清理
  const timeoutRef = useRef(null);
  const animationEndTimeoutRef = useRef(null);

  useEffect(() => {
    // 如果目标值与当前目标相同，则无需动画
    const currentTarget = nextValue !== null ? nextValue : displayValue;
    if (value === currentTarget) return;

    if (isAnimating) {
      // 如果正在动画中，立即完成当前动画
      if (animationEndTimeoutRef.current) clearTimeout(animationEndTimeoutRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      // 立即切换到下一个值
      setDisplayValue(nextValue);
      setNextValue(value);
      setIsAnimating(false);

      // 在下一帧重新触发动画
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(true);
        animationEndTimeoutRef.current = setTimeout(() => {
          setDisplayValue(value);
          setNextValue(null);
          setIsAnimating(false);
        }, 300); // 动画持续300ms
      }, 20);
    } else {
      // 正常开始新动画
      setNextValue(value);
      setIsAnimating(true);

      if (animationEndTimeoutRef.current) clearTimeout(animationEndTimeoutRef.current);
      animationEndTimeoutRef.current = setTimeout(() => {
        setDisplayValue(value);
        setNextValue(null);
        setIsAnimating(false);
      }, 300); // 动画持续300ms
    }

    // 清理函数
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (animationEndTimeoutRef.current) clearTimeout(animationEndTimeoutRef.current);
    };
  }, [value]);

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
