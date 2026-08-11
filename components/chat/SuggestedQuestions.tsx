"use client";

type Props = {
  questions: string[];
  onPick: (question: string) => void;
};

export default function SuggestedQuestions({ questions, onPick }: Props) {
  return (
    <div className="chat__suggestions" aria-label="Questions suggérées">
      {questions.map((q) => (
        <button key={q} type="button" className="wel-chip" onClick={() => onPick(q)}>
          {q}
        </button>
      ))}
    </div>
  );
}
