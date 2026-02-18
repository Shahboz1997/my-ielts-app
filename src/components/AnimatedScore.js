import React, { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion"; // <-- Убедись, что импорт такой

const AnimatedScore = ({ value }) => {
  const targetValue = parseFloat(value) || 0;
  
  // 1. Создаем пружинное число (от 0 до цели)
  const springValue = useSpring(0, {
    stiffness: 60,   // Жесткость (чем выше, тем быстрее старт)
    damping: 20,     // Сопротивление (убирает лишнюю тряску)
    restDelta: 0.001 // Точность остановки
  });

  // 2. Трансформируем число в строку с одним знаком после запятой (7.5)
  const displayValue = useTransform(springValue, (latest) => latest.toFixed(1));

  // 3. Запускаем анимацию при изменении значения
  useEffect(() => {
    springValue.set(targetValue);
  }, [targetValue, springValue]);

  return (
    <motion.span className="tabular-nums">
      {displayValue}
    </motion.span>
  );
};

export default AnimatedScore;
