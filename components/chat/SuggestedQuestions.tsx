"use client";

type Props = {
  label: string;
  questions: string[];
  onPick: (question: string) => void;
};

export default function SuggestedQuestions({ label, questions, onPick }: Props) {
  return (
    <div className="chat__suggestions" aria-label={label}>
      {questions.map((q) => (
        <button key={q} type="button" className="wel-chip" onClick={() => onPick(q)}>
          {q}
        </button>
      ))}
    </div>
  );
}
