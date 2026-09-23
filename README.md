# Conversation Display Kit

Accessible, themeable React primitives for conversations and human review of agent actions. The kit is provider-neutral: it displays proposals and reports their state while the application owns authorization, execution, persistence, and recovery.

The substantive integration pattern is **propose → review → apply or reject → report the outcome**. A scheduling assistant, support copilot, or workflow tool can share the same accessible review interaction without depending on a particular model provider. Home Huddle is a local reference consumer.

## Install the development candidate

This working tree is the **0.3.0 candidate**, not a published release. Build a reproducible local package from this repository:

```bash
npm ci
npm run test:package
```

From your application, install the generated `output/conversation-display-kit-0.3.0.tgz` using its local path. React and React DOM 18 or 19 are peer dependencies. Import the stylesheet explicitly once in your application entry point:

```tsx
import "conversation-display-kit/styles.css";
```

The JavaScript entry deliberately does not import CSS, so ESM, CommonJS, and server rendering work without a CSS loader. The `styles.css` export points to the built stylesheet. Source imports and published package imports must use the same explicit stylesheet contract.

## Example

```tsx
import { useRef, useState } from "react";
import {
  ChangeReviewCard,
  ConversationDisplay,
  PromptChips,
  type DisplayMessage,
  type ReviewStatus,
} from "conversation-display-kit";
import "conversation-display-kit/styles.css";

export function Demo() {
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [review, setReview] = useState<ReviewStatus>("pending");
  const composer = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  return (
    <>
      <PromptChips suggestions={["Plan an accessible gathering"]} onSelect={(text) => {
        setValue(text);
        composer.current?.focus();
      }} />
      <ConversationDisplay
        inputRef={composer}
        messages={messages}
        multiline
        maxLength={2000}
        value={value}
        onValueChange={setValue}
        onSubmit={(text) => {
          setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text }]);
          setValue("");
        }}
      />
      <ChangeReviewCard
        title="Review the proposed changes"
        summary="The appointment stays fixed."
        changes={[{ id: "pickup", label: "Pickup", before: "Alex at 3 PM", after: "Sam at 3:30 PM" }]}
        status={review}
        onAccept={() => {
          // In a real app, set applying first, execute the reviewed proposal,
          // then set applied on success or error on failure.
          setReview("applied");
        }}
        onReject={() => setReview("rejected")}
      />
    </>
  );
}
```

## Public API

- **ConversationDisplay**: controlled `messages`, `value`, `onValueChange`, `onSubmit`; optional `status`, `disabled`, `placeholder`, `emptyState`, `composerAction`, `className`, `submitLabel`. `maxLength` defaults to 500; controlled over-limit values cannot submit. `multiline` defaults to false; when enabled, Enter sends and Shift+Enter adds a newline. IME confirmation never submits. `inputRef` supports an input/textarea ref and `logRef` a div ref. Optional `inputLabel`, `logLabel`, `title`, and `statusLabels` customize accessible labels. History is keyboard focusable; new messages follow only while near the bottom, with a “Jump to latest” button when reading older messages. Reduced-motion preferences disable smooth scrolling.
- **PromptChips**: `suggestions`, `onSelect`, optional `disabled` and accessible group `label`. Supply unique suggestion strings.
- **ConversationStatus**: `value` is `idle`, `listening`, `thinking`, or `error`; optional `labels` overrides status text. Uses a polite live region.
- **ChangeReviewCard**: `title`, optional `summary`, `changes`, `onAccept`, and `onReject`. Each `ReviewChange` has a stable `id`, `label`, and optional `before`/`after`. Optional `acceptLabel`, `rejectLabel`, `disabled`, `className`, `status`, and `statusMessage`. `status` defaults to `pending`; `applying`, `applied`, and `rejected` disable both actions. `error` allows retry. Outcome text is announced through a status region. Set `applying` immediately in your callback while the operation is pending; the component does not execute operations itself.
- Types: component prop types, `DisplayMessage`, `ReviewChange`, `ReviewStatus`, and `ConversationStatusValue`.

## Styling and layout

Defaults use readable opaque dark surfaces even on a white host page. Override namespaced CSS variables on a parent to theme the components:

```css
.my-conversation {
  --cdk-accent: #34d399;
  --cdk-bg: #07130f;
  --cdk-panel: #12251d;
  --cdk-radius: 16px;
}
```

A conversation is 520px tall (470px on small screens) with independently scrolling history. Override `.cdk-conversation` height in your application when embedding it in an existing panel. Preserve sufficient space for the composer, and verify contrast after overriding colors. Text and controls wrap at narrow widths; standalone status/prompt components share the kit font.

## Development and verification

```bash
npm ci
npx playwright install chromium firefox webkit
npm run check
npm run demo
# Open http://localhost:5173/demo/
```

`npm run check` runs lint, types, component tests, real-browser tests with axe, and package consumer checks. Browser tests cover Chromium, Firefox, and WebKit; keyboard input and IME; independent instances; proposal outcomes; reading-history behavior; reduced motion; 320px layouts and enlarged text. Package tests install the tarball into isolated React 18 and 19 consumers, run ESM/CJS server rendering, resolve CSS, and compile both TypeScript NodeNext module forms. Artifacts stay in ignored `output/`.

If a browser cannot start on your host, report its launch error separately from application test failures. Keep all three browser projects enabled in CI; do not silently skip a failed engine.

Automated checks do not establish screen-reader usability or physical remote/device compatibility. Before a release, manually check VoiceOver/NVDA announcements, touch and hardware keyboard interaction, and the target product's device layout. No Fire TV or Alexa SDK behavior is claimed by this provider-neutral library.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution and release checks. Development happens on `dev`; stable releases are tagged from `main` only after maintainer review.

## License

MIT
