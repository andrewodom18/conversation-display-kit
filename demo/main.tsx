import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ChangeReviewCard, ConversationDisplay, PromptChips, type DisplayMessage, type ReviewStatus } from "conversation-display-kit";
import "conversation-display-kit/styles.css";
import "./styles.css";

function Demo() {
  const [value, setValue] = useState("");
  const [secondary, setSecondary] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([{ id: "welcome", role: "assistant", text: "Describe what your household needs. This playground demonstrates accessible conversations and reviewable agent actions." }]);
  const [review, setReview] = useState<ReviewStatus>("pending");
  const composer = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [accepted, setAccepted] = useState(0);
  function append(text: string) {
    setMessages((current) => [...current, { id: String(current.length), role: "assistant", text }]);
  }
  return <main>
    <h1>Conversation Display Kit</h1>
    <p>Accessible conversations and human approval for agent actions. Try keyboard navigation, long messages, or a narrow screen.</p>
    <div className="tools" aria-label="Playground controls">
      <button onClick={() => setMessages(Array.from({ length: 25 }, (_, index) => ({ id: String(index), role: "assistant", text: `Message ${index + 1}. Read older messages without losing your place when a new response arrives.` })))}>Load history</button>
      <button onClick={() => append(`Long content: https://example.com/${"a".repeat(300)}`)}>Add long response</button>
      <button onClick={() => composer.current?.focus()}>Focus composer</button>
    </div>
    <PromptChips suggestions={["Plan an accessible neighborhood gathering", "Balance chores and study time"]} onSelect={setValue} />
    <ConversationDisplay inputRef={composer} inputLabel="Planning message" messages={messages} multiline maxLength={2000} value={value} onValueChange={setValue} onSubmit={(text) => { setMessages((current) => [...current, { id: String(current.length), role: "user", text }]); setValue(""); }} />
    <ChangeReviewCard title="Review a proposed change" summary="Your app controls whether a reviewed proposal is applied." changes={[{ id: "time", label: "Gathering time", before: "3 PM", after: "4 PM" }, { id: "access", label: "Accessibility", after: "Step-free entrance confirmed" }]} status={review} onAccept={() => { setReview("applying"); setAccepted((count) => count + 1); window.setTimeout(() => setReview("applied"), 500); }} onReject={() => setReview("rejected")} />
    <div className="tools"><button onClick={() => setReview("pending")}>Reset review</button><button onClick={() => setReview("error")}>Simulate review error</button><span>Applications: {accepted}</span></div>
    <section aria-label="Independent conversation"><h2>Second conversation</h2>
      <ConversationDisplay inputLabel="Second message" logLabel="Second conversation messages" title="Independent conversation" messages={[]} value={secondary} onValueChange={setSecondary} onSubmit={() => setSecondary("")} />
    </section>
  </main>;
}

createRoot(document.getElementById("root")!).render(<Demo />);
