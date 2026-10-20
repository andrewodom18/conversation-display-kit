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
  // Set the reading position without leaving a native keyboard-scroll animation
  // running while the separate Jump to latest keyboard interaction is tested.
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

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`automatic following ${reducedMotion === "reduce" ? "respects reduced motion" : "animates smoothly"}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    const log = page.getByRole("log", { name: "Conversation messages", exact: true });
    await log.evaluate((node) => {
      node.dataset.animated = "false";
      node.addEventListener("scroll", () => {
        const gap = node.scrollHeight - node.clientHeight - node.scrollTop;
        if (node.scrollTop > 0 && gap > 2) node.dataset.animated = "true";
      });
    });
    await page.getByRole("button", { name: "Load history" }).click();
    await expect.poll(() => log.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop)).toBeLessThan(2);
    // Observe actual intermediate positions instead of assuming an animation
    // duration or inspecting only the scrollTo option.
    await expect(log).toHaveAttribute("data-animated", String(reducedMotion === "no-preference"));
    await expect(page.getByRole("button", { name: "Jump to latest" })).toHaveCount(0);
  });
}

test("rapid responses keep following with default motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const log = page.getByRole("log", { name: "Conversation messages", exact: true });
  await page.getByRole("button", { name: "Load history" }).click();
  // Retarget following once scrolling begins, before history settles.
  await expect.poll(() => log.evaluate((node) => node.scrollTop), { intervals: [16] }).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Add long response" }).click();
  await expect.poll(() => log.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop)).toBeLessThan(2);
  await page.getByRole("button", { name: "Add long response" }).click();
  await expect.poll(() => log.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop)).toBeLessThan(2);
  await expect(page.getByRole("button", { name: "Jump to latest" })).toHaveCount(0);
});

test("a response during an animated jump retains following intent", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const log = page.getByRole("log", { name: "Conversation messages", exact: true });
  await page.getByRole("button", { name: "Load history" }).click();
  await expect.poll(() => log.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop)).toBeLessThan(2);
  await log.evaluate((node) => { node.scrollTop = 0; node.dispatchEvent(new Event("scroll")); });
  await page.getByRole("button", { name: "Jump to latest" }).click();
  await expect.poll(() => log.evaluate((node) => node.scrollTop), { intervals: [16] }).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Add long response" }).click();
  await expect.poll(() => log.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop)).toBeLessThan(2);
  await expect(page.getByRole("button", { name: "Jump to latest" })).toHaveCount(0);
});

test("scrolling up interrupts a jump and preserves the reader's position", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const log = page.getByRole("log", { name: "Conversation messages", exact: true });
  await page.getByRole("button", { name: "Load history" }).click();
  await expect.poll(() => log.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop)).toBeLessThan(2);
  await log.evaluate((node) => { node.scrollTop = 0; node.dispatchEvent(new Event("scroll")); });
  await page.getByRole("button", { name: "Jump to latest" }).click();
  await expect.poll(() => log.evaluate((node) => node.scrollTop), { intervals: [16] }).toBeGreaterThan(0);
  await log.hover();
  await log.evaluate((node) => {
    node.addEventListener("wheel", () => { node.dataset.wheelTop = String(node.scrollTop); }, { once: true });
  });
  await page.mouse.wheel(0, -5000);
  await expect(log).toHaveAttribute("data-wheel-top", /\d/);
  const stoppedAt = await log.evaluate((node) => new Promise<number>((resolve) => {
    let previous = node.scrollTop;
    let stableFrames = 0;
    function sample() {
      const current = node.scrollTop;
      stableFrames = Math.abs(current - previous) < 0.5 ? stableFrames + 1 : 0;
      previous = current;
      if (stableFrames >= 4) resolve(current);
      else requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }));
  // Wheel distances vary across engines. The animation must stop advancing
  // downward from the user's interruption, wherever native wheel scrolling ends.
  const interruptedAt = await log.evaluate((node) => Number(node.dataset.wheelTop));
  expect(stoppedAt).toBeLessThanOrEqual(interruptedAt + 1);
  expect(await log.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop)).toBeGreaterThan(48);
  await expect(page.getByRole("button", { name: "Jump to latest" })).toBeVisible();
  await page.getByRole("button", { name: "Add long response" }).click();
  await expect.poll(() => log.evaluate((node, position) => Math.abs(node.scrollTop - position), stoppedAt)).toBeLessThan(2);
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
