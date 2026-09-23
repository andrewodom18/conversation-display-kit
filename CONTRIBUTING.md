# Contributing

Use Node 22 and keep ordinary work on `dev`. Install with `npm ci`; do not edit generated `dist/` files. Source components and public types live in `src/`, the runnable consumer is `demo/`, and browser tests are in `e2e/`.

For changes to public behavior:

1. Preserve existing callers with additive props and defaults, or document an intentional breaking change.
2. Add focused component tests for the behavior. Add a real-browser regression when layout, focus, input composition, scrolling, or accessibility is involved.
3. Run `npx playwright install chromium firefox webkit` and `npm run check`. Review browser screenshots in `output/playwright/`.
4. Explain the user problem, behavior, and validation in the proposed contribution. Do not include tokens, credentials, or private conversation content.

The review card is a display contract. Keep application authorization and action execution outside the package. Do not imply that a proposed action succeeded before the application confirms it.

## Before a release

- Confirm package version, lockfile, documentation, and generated tarball agree.
- Exercise the documented example using the tarball and the explicit CSS import.
- Review React 18/19 consumer and all browser results.
- Manually verify screen-reader announcements and target-device interaction.
- Publish/tag only with maintainer authorization. Update installation instructions only after the artifact actually exists.

## Reporting problems

Use the repository's issue tracker with reproduction steps, React/browser versions, expected behavior, actual behavior, and a minimal example. Accessibility reports should identify the assistive technology and navigation sequence when possible.
