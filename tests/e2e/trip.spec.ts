import { expect, test, type Page } from "@playwright/test";

// Wed 21.10.2026 14:00 in Berlin (UTC+2) → "Checkpoint Charlie" (13:45–14:15) in the example trip.
const WED_14_00 = new Date("2026-10-21T12:00:00Z");

async function createExampleTrip(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "I already have a plan →" }).click();
  await page.getByRole("button", { name: "No plan yet? Try the example trip" }).click();
  // Tests run as a phone, so step 3 shows the "Install on this phone" button.
  const href = await page.getByRole("link", { name: "Install on this phone →" }).getAttribute("href");
  expect(href).toMatch(/^\/t\/[A-Za-z0-9]{22}$/);
  return href!;
}

test("landing: copy prompt opens step 2, pasting a plan creates the trip", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("button", { name: "Copy prompt" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("STAGE 3 — THE FILE");
  const planBox = page.getByLabel("Trip plan markdown");
  await expect(planBox).toBeVisible();

  // Pasting is enough — no extra button press.
  const example = await (await page.request.get("/examples/berlin-trip.md")).text();
  await page.evaluate((t) => navigator.clipboard.writeText(t), example);
  await planBox.focus();
  await page.keyboard.press("ControlOrMeta+V");
  await expect(page.getByTestId("trip-url")).toHaveText(/\/t\/[A-Za-z0-9]{22}$/);
  // Tapping the link box copies the link.
  await page.evaluate(() => navigator.clipboard.writeText(""));
  await page.getByRole("button", { name: "Copy trip link" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/t\/[A-Za-z0-9]{22}$/);

  // Tapping an earlier step's icon goes back.
  await page.getByRole("button", { name: "Plan your trip" }).click();
  await expect(page.getByRole("heading", { name: "Plan your trip with AI" })).toBeVisible();
  await page.getByRole("button", { name: "Get app" }).click();
  await expect(page.getByTestId("trip-url")).toBeVisible();
});

test("landing: shown prompt is selected", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Show prompt" }).click();
  const selected = await page.getByLabel("Planning prompt").evaluate((el: HTMLTextAreaElement) => el.value.slice(el.selectionStart, el.selectionEnd));
  expect(selected).toContain("STAGE 1");
  expect(selected).toContain("Let's start with Stage 1.");
});

test("broken plan shows errors and can't be saved", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "I already have a plan →" }).click();
  await page.getByLabel("Trip plan markdown").fill("just some text");
  await expect(page.getByTestId("preview")).toContainText("Missing title");
  await expect(page.getByRole("button", { name: "Create my trip link" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Get app" })).toBeDisabled();
});

test("every upload gets a new link", async ({ page }) => {
  const a = await createExampleTrip(page);
  const b = await createExampleTrip(page);
  expect(a).not.toBe(b);
});

test("android: install guide, then the current stop with navigation", async ({ page }) => {
  await page.clock.install({ time: WED_14_00 });
  const path = await createExampleTrip(page);
  await page.goto(path);

  await expect(page.getByTestId("install-guide")).toContainText("Install “Berlin Example Trip” on your phone");
  await page.getByRole("button", { name: "Continue in the browser instead" }).click();

  await expect(page.getByTestId("stop-name")).toHaveText("Checkpoint Charlie");
  await expect(page.getByTestId("status")).toHaveText("● Now · 15 min left");
  await expect(page.getByTestId("stop-time")).toHaveText("Until 14:15 (30min)");
  await expect(page.getByTestId("navigate")).toHaveAttribute(
    "href",
    "https://www.google.com/maps/dir/?api=1&destination=Friedrichstr.+43-45%2C+10117+Berlin&travelmode=transit",
  );

  await expect(page.getByTestId("next-stop")).toContainText("Next stop: 🏛️ Museum at 14:25");
  await expect(page.getByTestId("navigate")).toHaveText(/Navigate\s*\(🚶 ~1 min\)/);
  await page.getByRole("button", { name: "Next stop", exact: true }).click();
  await expect(page.getByTestId("stop-name")).toHaveText("Topography of Terror");
  await page.getByRole("button", { name: "Now", exact: true }).click();
  await expect(page.getByTestId("stop-name")).toHaveText("Checkpoint Charlie");

  // A day chip opens that day's plan with food & bags; picking a stop shows it.
  await page.getByRole("button", { name: /^Tue 20/ }).click();
  await expect(page.getByTestId("day-notes")).toContainText("Hofbräu Wirtshaus");
  await expect(page.getByTestId("day-heading")).toHaveText("Tue 20.10: Arrival & Old Town Evening");
  // Info from the day plan, then Back returns to the day plan.
  await page.getByRole("button", { name: "Trip info" }).click();
  await page.goBack();
  await expect(page.getByTestId("day-heading")).toBeVisible();
  await page.getByRole("button", { name: /BER arrival/ }).click();
  await expect(page.getByTestId("stop-name")).toHaveText("BER arrival");
  await expect(page.getByTestId("status")).toHaveCount(0);

  // Previous from Thursday's first stop crosses back into Wednesday's last stop.
  await page.getByRole("button", { name: /^Thu 22/ }).click();
  await page.getByRole("button", { name: /Breakfast — hotel/ }).click();
  await page.getByRole("button", { name: "Previous stop", exact: true }).click();
  await expect(page.getByTestId("stop-name")).toHaveText("Motel One Alexanderplatz");
});

test("manifest carries the trip id", async ({ page, request }) => {
  const path = await createExampleTrip(page);
  const manifest = await (await request.get(`${path}/manifest.webmanifest`)).json();
  expect(manifest.start_url).toBe(`${path}?source=pwa`);
  expect(manifest.id).toBe(path);
  expect(manifest.short_name).toBe("Berlin");
});

test("option toggle switches Thursday evening", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-22T16:30:00Z") }); // Thu 18:30 Berlin
  const path = await createExampleTrip(page);
  await page.goto(`${path}?source=pwa`);
  await page.getByTestId("options").getByRole("button", { name: "Option A" }).click();
  await expect(page.getByTestId("stop-name")).toHaveText("Dinner near Friedrichstr.");
  await page.getByTestId("options").getByRole("button", { name: "Option B" }).click();
  await expect(page.getByTestId("stop-name")).toHaveText("Evening Spree dinner cruise");
});

test("anyone with the link can delete the trip", async ({ page }) => {
  const path = await createExampleTrip(page);
  await page.goto(`${path}?source=pwa`);
  // Info is reached through the day plan (day chip → Info).
  await page.getByRole("button", { name: /^Tue 20/ }).click();
  await page.getByRole("button", { name: "Trip info" }).click();
  await page.getByRole("button", { name: "Delete trip" }).click();
  await page.getByRole("button", { name: "Yes, delete for everyone" }).click();
  await expect(page.getByRole("heading", { name: "This trip is gone" })).toBeVisible();
  await page.goto(path);
  await expect(page.getByRole("heading", { name: "This trip is gone" })).toBeVisible();
});

test.describe("live demo", () => {
  test.use({ timezoneId: "Europe/Stockholm" });

  // Real clock on purpose: the server places the demo on today's real date.
  test("opens on a live day without creating a trip and can't be deleted", async ({ page, context }) => {
    await page.goto("/");
    const [demo] = await Promise.all([context.waitForEvent("page"), page.getByRole("link", { name: /Try the live demo/ }).click()]);
    await demo.goto("/t/demo?source=pwa");
    await expect(demo.getByTestId("stop-card")).toBeVisible();
    await expect(demo.getByTestId("status")).not.toContainText(/Trip finished|Trip starts/);
    // Today is the demo's second day.
    await expect(demo.locator('[data-active="true"]')).toHaveText(/●/);
    await demo.locator('[data-active="true"]').click();
    await demo.getByRole("button", { name: "Trip info" }).click();
    await expect(demo.getByRole("button", { name: "Delete trip" })).toHaveCount(0);
    expect((await demo.request.delete("/api/trips/demo")).status()).toBe(403);
  });
});
