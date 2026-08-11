"use client";

type Props = {
  label: string;
  questions: string[];
  onPick: (question: string) => void;
  className?: string;
};

export default function SuggestedQuestions({
  label,
  questions,
  onPick,
  className = "chat__suggestions",
}: Props) {
  return (
    <div className={className} aria-label={label}>
      {questions.map((q) => (
        <button key={q} type="button" className="wel-chip" onClick={() => onPick(q)}>
          {q}
        </button>
      ))}
    </div>
  );
}
