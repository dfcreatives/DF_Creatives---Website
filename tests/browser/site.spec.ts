import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("desktop navigation, service pages, FAQ, and contact submission", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Big ideas. Beautifully made." }),
  ).toBeVisible();
  await page.getByText("Can we work together on an ongoing basis?").click();
  await expect(
    page.getByText("Absolutely. Tell us what you need"),
  ).toBeVisible();
  await page.getByRole("link", { name: "Explore our services" }).click();
  await expect(page).toHaveURL(/\/services$/);
  await page.locator(".service-card").first().click();
  await expect(page).toHaveURL(/content-creation$/);
  await page
    .getByRole("link", { name: "Let’s make it happen", exact: true })
    .last()
    .click();
  await page.getByLabel("Your name").fill("Browser Visitor");
  await page.getByLabel("Email address").fill("browser@example.com");
  await page
    .getByLabel("What can we help with?")
    .selectOption("Content Creation");
  await page
    .getByLabel("A little about your project")
    .fill("We want a creative campaign for our launch.");
  await page.getByRole("button", { name: "Let’s get this started" }).click();
  await expect(
    page.getByRole("heading", { name: "That’s the start of something good." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("mobile pages fit the viewport and navigation works", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    "/",
    "/services",
    "/work",
    "/about",
    "/careers",
    "/contact",
    "/privacy",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1,h2").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .locator("nav")
    .getByRole("link", { name: "Careers", exact: true })
    .click();
  await expect(page).toHaveURL(/careers$/);
  await expect(
    page.getByText("There are no open roles right now."),
  ).toBeVisible();
});
test("admin login, Puck editor, draft isolation, publish, media, and inbox", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/admin");
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-test-password-2026");
  await page.getByRole("button", { name: "Enter the studio" }).click();
  await expect(
    page.getByRole("heading", { name: "A fresh canvas. Every day." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Pages", exact: true }).click();
  await page.getByRole("link", { name: "Edit", exact: true }).first().click();
  await expect(page.getByText("PAGE EDITOR", { exact: true })).toBeVisible();
  await expect(page.locator("iframe")).toBeVisible();
  await page
    .locator(".editor-shell nav")
    .getByText("Outline", { exact: true })
    .click();
  await page
    .locator(".editor-shell button")
    .filter({ hasText: /^Hero$/ })
    .filter({ visible: true })
    .click();
  await page
    .getByLabel("Heading", { exact: true })
    .filter({ visible: true })
    .fill("Ideas, edited.\nBeautifully made.");
  await expect(
    page
      .frameLocator("iframe")
      .getByRole("heading", { name: "Ideas, edited. Beautifully made." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Switch to Mobile viewport" })
    .filter({ visible: true })
    .click();
  await expect
    .poll(() =>
      page
        .frameLocator("iframe")
        .locator("body")
        .evaluate(() => innerWidth),
    )
    .toBe(390);
  await page
    .getByRole("button", { name: "Switch to Desktop viewport" })
    .filter({ visible: true })
    .click();
  await page
    .getByLabel("Page title / SEO title")
    .fill("Private browser test title");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.locator(".toast")).toContainText("Draft saved");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Private draft preview" }),
  ).toBeVisible();
  await expect(page.locator(".site-preview .navbar")).toBeVisible();
  await expect(page.locator(".site-preview .footer")).toBeVisible();
  await page.getByRole("button", { name: "Close preview" }).click();
  const publicBefore = await (await request.get("/api/content")).json();
  expect(publicBefore.page.published.title).not.toBe(
    "Private browser test title",
  );
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.locator(".toast")).toContainText("Published.");
  const publicAfter = await (await request.get("/api/content")).json();
  expect(publicAfter.page.published.title).toBe("Private browser test title");
  expect(publicAfter.page.published.blocks.content[0].props.title).toBe(
    "Ideas, edited.\nBeautifully made.",
  );
  await page.getByRole("button", { name: "History" }).click();
  await expect(
    page.getByRole("heading", { name: "Previously published versions" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Inbox", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Good conversations start here." }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Browser Visitor/ }).click();
  await page.getByLabel("Internal notes").fill("Follow up tomorrow");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".toast")).toContainText("Conversation updated");
  await page.getByRole("link", { name: "Media library" }).click();
  await page
    .locator("input[type=file]")
    .setInputFiles("public/images/team.jpg");
  await expect(page.locator(".toast")).toContainText("Image uploaded");
  await page.getByLabel("Alt text").fill("Creative team working together");
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(page.locator(".toast")).toContainText("Image details saved");
  expect(errors).toEqual([]);
});

test("public pages meet automated WCAG A/AA checks", async ({ page }) => {
  for (const route of ["/", "/contact", "/careers"]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  }
});
