import { motion, type HTMLMotionProps } from "framer-motion";
import { fadeIn, fadeUp, scaleIn, slideFromLeft, slideFromRight, softTransition, viewportOnce } from "./motion";

const variants = {
  fadeUp,
  fadeIn,
  slideLeft: slideFromLeft,
  slideRight: slideFromRight,
  scale: scaleIn,
} as const;

type RevealVariant = keyof typeof variants;

type HomeSectionRevealProps = HTMLMotionProps<"section"> & {
  variant?: RevealVariant;
  delay?: number;
  viewport?: boolean;
};

export default function HomeSectionReveal({
  children,
  variant = "fadeUp",
  delay = 0,
  viewport = true,
  className,
  ...rest
}: HomeSectionRevealProps) {
  return (
    <motion.section
      className={className}
      initial="hidden"
      animate={viewport ? undefined : "visible"}
      whileInView={viewport ? "visible" : undefined}
      viewport={viewport ? viewportOnce : undefined}
      variants={variants[variant]}
      transition={softTransition(0.6, delay)}
      {...rest}
    >
      {children}
    </motion.section>
  );
}

type HomeSectionHeaderProps = HTMLMotionProps<"div"> & {
  delay?: number;
};

export function HomeSectionHeader({ children, className, delay = 0, ...rest }: HomeSectionHeaderProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={softTransition(0.5, delay)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}