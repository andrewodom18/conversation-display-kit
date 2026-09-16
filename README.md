# Conversation Display Kit

Accessible, themeable React primitives for conversational prototypes. The kit
is deliberately provider-neutral, so teams can reuse the interface without
copying product-specific branding.

## Install

Install the tagged public repository directly:

```bash
npm install https://github.com/andrewodom18/conversation-display-kit/releases/download/v0.1.1/conversation-display-kit-0.1.1.tgz
```

React and React DOM are peer dependencies.

## Example

```tsx
import { useState } from "react";
import {
  ConversationDisplay,
  PromptChips,
  type DisplayMessage,
} from "conversation-display-kit";

export function Demo() {
  const [value, setValue] = useState("");
  const messages: DisplayMessage[] = [
    { id: "welcome", role: "assistant", text: "What should we plan?" },
  ];

  return (
    <>
      <PromptChips suggestions={["Plan our evening"]} onSelect={setValue} />
      <ConversationDisplay
        messages={messages}
        status="idle"
        value={value}
        onValueChange={setValue}
        onSubmit={(message) => console.log(message)}
      />
    </>
  );
}
```

The package imports its base stylesheet automatically. Override the public CSS
variables on a parent element to match your product:

```css
.my-conversation {
  --cdk-accent: #34d399;
  --cdk-bg: #07130f;
  --cdk-radius: 16px;
}
```

## Public API

- `ConversationDisplay`: message log, composer, keyboard submission, and
  accessible conversation status.
- `PromptChips`: responsive suggested-prompt buttons.
- `ConversationStatus`: standalone live-region status indicator.
- `DisplayMessage`, `ConversationStatusValue`, and component prop types.

## Development

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

Development happens on `dev`; stable releases are tagged from `main`.

## License

MIT
