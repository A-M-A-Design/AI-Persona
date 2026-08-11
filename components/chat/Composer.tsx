"use client";

import { useState, type FormEvent } from "react";

type Props = {
  disabled: boolean;
  placeholder: string;
  sendLabel: string;
  onSend: (text: string) => void;
};

export default function Composer({ disabled, placeholder, sendLabel, onSend }: Props) {
  const [value, setValue] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  }

  return (
    <form className="chat__composer" onSubmit={submit}>
      <div className="wel-input-text chat__composer-field">
        <div className="wel-input-text__wrapper">
          <input
            className="wel-input-text__input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            maxLength={2000}
            aria-label={placeholder}
          />
        </div>
      </div>
      <button
        type="submit"
        className="wel-button wel-button--primary"
        disabled={disabled || value.trim().length === 0}
      >
        {sendLabel}
      </button>
    </form>
  );
}
