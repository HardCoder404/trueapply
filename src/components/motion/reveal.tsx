"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ComponentProps } from "react";

type RevealProps = ComponentProps<typeof motion.div> & {
  delay?: number;
};

export function Reveal({ delay = 0, children, ...props }: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
