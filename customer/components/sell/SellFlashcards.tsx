import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BubbleQuestion } from "../../lib/sell";

type Props = {
  questions: BubbleQuestion[];
  answers: Record<string, string>;
  onAnswer: (qKey: string, opt: string, onSelect: (v: string) => void) => void;
  onComplete: () => void;
  onBack: () => void;
  disabled?: boolean;
};

export default function SellFlashcards({ questions, answers, onAnswer, onComplete, onBack, disabled }: Props) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const current = questions[index];
  const progress = ((index + (answers[current?.key] ? 1 : 0)) / questions.length) * 100;

  const pick = useCallback(
    (opt: string) => {
      if (!current) return;
      onAnswer(current.key, opt, current.onSelect);
      setDirection(1);
      if (index >= questions.length - 1) {
        setTimeout(onComplete, 280);
      } else {
        setTimeout(() => setIndex((i) => i + 1), 220);
      }
    },
    [current, index, questions.length, onAnswer, onComplete]
  );

  const goPrev = () => {
    if (index === 0) {
      onBack();
      return;
    }
    setDirection(-1);
    setIndex((i) => i - 1);
  };

  if (!current) return null;

  return (
    <div className={`sell-flashcards mb-8 ${disabled ? "sell-flashcards--disabled" : ""}`}>
      <div className="flex items-center justify-between mb-4 px-0.5">
        <button type="button" onClick={goPrev} className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Back
        </button>
        <span className="text-xs font-medium text-emerald-400/90 tabular-nums">
          {index + 1} / {questions.length}
        </span>
      </div>

      <div className="sell-flash-progress mb-5">
        <div className="sell-flash-progress-fill" style={{ width: `${Math.max(8, progress)}%` }} />
      </div>

      <div className="sell-flash-stage">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current.key}
            custom={direction}
            initial={{ opacity: 0, x: direction * 48, rotateY: direction * -8 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: direction * -48, rotateY: direction * 8 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="sell-flash-card"
          >
            <p className="sell-flash-kicker">Quick question</p>
            <h2 className="sell-flash-question">{current.q}</h2>
            <p className="sell-flash-hint">
              {disabled
                ? "Finish Working / Not Working above first."
                : "Tap an answer — we'll price your item from here."}
            </p>

            <div className="sell-flash-options">
              {current.options.map((opt) => {
                const active = answers[current.key] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => pick(opt)}
                    disabled={disabled}
                    className={`sell-flash-option ${active ? "sell-flash-option--active" : ""}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}