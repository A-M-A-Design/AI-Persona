import PersonaGlyph from "../PersonaGlyph";

type Props = {
  role: "user" | "assistant";
  text: string;
  persona: string;
};

export default function MessageBubble({ role, text, persona }: Props) {
  const isUser = role === "user";
  return (
    <div className={`chat__row ${isUser ? "chat__row--user" : "chat__row--assistant"}`}>
      {!isUser && (
        <span className="chat__avatar" aria-hidden="true">
          <PersonaGlyph persona={persona} className="chat__avatar-glyph" />
        </span>
      )}
      <div
        className={`wel-message ${isUser ? "wel-message--accent" : "wel-message--neutral"} chat__bubble`}
      >
        <div className="wel-message__header">
          <p className="wel-message__text chat__bubble-text">{text}</p>
        </div>
      </div>
    </div>
  );
}
