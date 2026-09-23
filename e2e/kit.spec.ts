import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => { await page.goto("/demo/"); });

test("default styles and all components have no serious accessibility violations", async ({ page }) => {
  await expect(page.getByLabel("Planning message")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(new Set(ids).size).toBe(ids.length);
});

test("suggestions, focus refs, multiline, IME, and independent composers work", async ({ page }) => {
  const input = page.getByLabel("Planning message");
  await page.getByRole("button", { name: "Plan an accessible neighborhood gathering" }).click();
  await expect(input).toHaveValue("Plan an accessible neighborhood gathering");
  await page.getByRole("button", { name: "Focus composer" }).click();
  await expect(input).toBeFocused();
  await input.fill("First line");
  await input.press("End");
  await input.press("Shift+Enter");
  await input.press("a");
  await expect(input).toHaveValue("First line\na");
  await input.dispatchEvent("compositionstart");
  await input.press("Enter");
  await expect(input).toHaveValue("First line\na");
  await input.dispatchEvent("compositionend");
  await input.press("Enter");
  await expect(input).toHaveValue("");
  await expect(page.getByRole("log", { name: "Conversation messages", exact: true })).toContainText("First line\na");
  await page.getByLabel("Second message", { exact: true }).fill("Independent");
  await expect(input).toHaveValue("");
});

test("review apply, retry, reject and terminal states are explicit", async ({ page }) => {
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.getByRole("button", { name: "Apply", exact: true })).toBeDisabled();
  await expect(page.getByText("Changes applied.", { exact: true })).toBeVisible();
  await expect(page.getByText("Applications: 1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Simulate review error" }).click();
  await expect(page.getByRole("button", { name: "Apply", exact: true })).toBeEnabled();
  await expect(page.getByText("Changes could not be applied. Try again.")).toBeVisible();
  await page.getByRole("button", { name: "Keep current" }).click();
  await expect(page.getByText("Current plan kept.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Apply", exact: true })).toBeDisabled();
});

test("history keeps its reading position and supports a keyboard jump", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Load history" }).click();
  const log = page.getByRole("log", { name: "Conversation messages", exact: true });
  await log.focus();
  await log.press("ControlOrMeta+Home");
  // Home scrolling differs by engine; the element is keyboard focusable in all engines.
  await log.evaluate((node) => { node.scrollTop = 0; node.dispatchEvent(new Event("scroll")); });
  await expect(page.getByRole("button", { name: "Jump to latest" })).toBeVisible();
  await page.getByRole("button", { name: "Add long response" }).click();
  await expect.poll(() => log.evaluate((node) => node.scrollTop)).toBe(0);
  const jump = page.getByRole("button", { name: "Jump to latest" });
  await jump.focus();
  await jump.press("Enter");
  await expect(log).toBeFocused();
  await expect.poll(() => log.evaluate((node) => Math.abs(node.scrollHeight - node.clientHeight - node.scrollTop))).toBeLessThan(2);
});

test("narrow viewport, long content and enlarged text stay within the page", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.getByRole("button", { name: "Add long response" }).click();
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByLabel("Planning message")).toBeVisible();
  await page.screenshot({ path: `output/playwright/narrow-${test.info().project.name}.png`, fullPage: true });
});

test("keyboard navigation exposes visible focus and activates review controls", async ({ page, browserName }) => {
  // Safari uses Option+Tab to include buttons when full keyboard access is off.
  const tabKey = browserName === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab";
  await page.keyboard.press(tabKey);
  await expect(page.getByRole("button", { name: "Load history" })).toBeFocused();
  const prompt = page.getByRole("button", { name: "Plan an accessible neighborhood gathering" });
  for (let index = 0; index < 3; index++) await page.keyboard.press(tabKey);
  await expect(prompt).toBeFocused();
  expect(await prompt.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Planning message")).toHaveValue("Plan an accessible neighborhood gathering");
  await page.getByRole("button", { name: "Apply", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Changes applied.", { exact: true })).toBeVisible();
  await page.screenshot({ path: `output/playwright/desktop-${test.info().project.name}.png`, fullPage: true });
});
