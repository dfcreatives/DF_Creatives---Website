import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateDocument,
  safeUrl,
  enquirySchema,
  applicationSchema,
  isPdf,
  canPublish,
  slugSchema,
} from "../server/validation";
import { seed } from "../src/seed";
test("all seed documents match the content contract", () => {
  for (const r of seed)
    assert.doesNotThrow(() => validateDocument(r.kind, r.draft));
});
test("sample proof and jobs never start published", () => {
  for (const r of seed.filter((r) =>
    ["project", "testimonial", "logo", "team", "job"].includes(r.kind),
  ))
    assert.equal(r.published, null);
});
test("unsafe URL protocols are rejected", () => {
  for (const s of [
    "javascript:alert(1)",
    "//evil.com",
    "/\\evil.com",
    "data:text/html,test",
  ])
    assert.equal(safeUrl(s), "");
  assert.equal(safeUrl("/services"), "/services");
  assert.equal(safeUrl("https://example.com"), "https://example.com/");
});
test("unknown and duplicate blocks cannot be saved", () => {
  const p = structuredClone(seed.find((r) => r.id === "home")!.draft);
  p.blocks.content[0].type = "ArbitraryScript";
  assert.throws(() => validateDocument("page", p));
  p.blocks.content[0].type = "Hero";
  p.blocks.content[1].props.id = p.blocks.content[0].props.id;
  assert.throws(() => validateDocument("page", p));
});
test("invalid form values fail before persistence", () => {
  assert.equal(
    enquirySchema.safeParse({ name: "A", email: "not-email", message: "x" })
      .success,
    false,
  );
  assert.equal(
    enquirySchema.safeParse({
      name: "Alex Smith",
      email: "alex@example.com",
      message: "A brand campaign for our launch.",
    }).success,
    true,
  );
  assert.equal(
    applicationSchema.safeParse({
      name: "Alex",
      email: "a@example.com",
      message: "I am applying for this position.",
      job_id: "job",
      portfolio: "javascript:alert(1)",
    }).success,
    false,
  );
});
test("PDF validation does not trust filename or content type", () => {
  assert.equal(isPdf(Buffer.from("<html>resume.pdf</html>")), false);
  assert.equal(isPdf(Buffer.from("%PDF-1.7\nbody\n%%EOF")), true);
});
test("publishing is limited to admins", () => {
  assert.equal(canPublish("admin"), true);
  assert.equal(canPublish("editor"), false);
});
test("page URLs cannot collide with application routes", () => {
  assert.equal(slugSchema.safeParse("/admin/foo").success, false);
  assert.equal(slugSchema.safeParse("/api/data").success, false);
  assert.equal(slugSchema.safeParse("/our-story").success, true);
});
