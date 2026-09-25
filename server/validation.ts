import { z } from "zod";
export const kinds = [
  "page",
  "settings",
  "service",
  "project",
  "testimonial",
  "logo",
  "team",
  "job",
] as const;
export const blockTypes = [
  "Hero",
  "TextImage",
  "Gallery",
  "ServiceGrid",
  "ProjectGrid",
  "LogoCarousel",
  "Testimonials",
  "Process",
  "Team",
  "FAQ",
  "JobListing",
  "ContactForm",
  "CTA",
] as const;
import { safeUrl } from "../src/urls";
export { safeUrl };
export const enquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  service: z.string().max(100).optional(),
  budget: z.string().max(100).optional(),
  message: z.string().trim().min(10).max(10000),
  website: z.string().max(100).optional(),
});
export const applicationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  message: z.string().trim().min(10).max(10000),
  job_id: z.string().min(1).max(100),
  portfolio: z
    .string()
    .max(1000)
    .optional()
    .refine((v) => !v || !!safeUrl(v), "Enter a valid portfolio URL"),
  website: z.string().max(100).optional(),
});
export const slugSchema = z
  .string()
  .max(150)
  .regex(/^\/[a-z0-9/-]*$/)
  .refine(
    (v) => v === "/" || (!v.endsWith("/") && !v.includes("//")),
    "Use a clean URL path",
  )
  .refine(
    (v) => !/^\/(admin|api|assets|demo-media)(\/|$)/.test(v),
    "Reserved path",
  );

const propSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().max(1000).optional(),
    description: z.string().max(50000).optional(),
    ...Object.fromEntries(
      [
        "accent",
        "secondaryLabel",
        "secondaryHref",
        "badge",
        "note",
        "posterLabel",
        "posterText",
        "posterFooter",
        "imageLabel",
        "imageCaption",
        "disciplines",
        "aside",
        "artLabel",
        "imageBadge",
      ].map((key) => [key, z.string().max(10000).optional()]),
    ),
    eyebrow: z.string().max(500).optional(),
    hidden: z.boolean().optional(),
    alignment: z.enum(["left", "center"]).optional(),
    spacing: z.enum(["compact", "comfortable", "generous"]).optional(),
    background: z.enum(["white", "soft", "blue", "dark"]).optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    imageX: z.number().min(0).max(100).optional(),
    imageY: z.number().min(0).max(100).optional(),
    buttonLabel: z.string().optional(),
    buttonHref: z.string().optional(),
    variant: z.enum(["simple", "editorial"]).optional(),
    reverse: z.boolean().optional(),
    showEmpty: z.boolean().optional(),
    recordIds: z.array(z.string()).max(200).optional(),
    steps: z
      .array(z.object({ title: z.string(), description: z.string() }))
      .max(30)
      .optional(),
    items: z
      .array(z.object({ question: z.string(), answer: z.string() }))
      .max(100)
      .optional(),
    images: z
      .array(
        z.object({
          url: z.string(),
          alt: z.string().optional(),
          caption: z.string().optional(),
        }),
      )
      .max(100)
      .optional(),
  })
  .passthrough();

function invalid(message: string): never {
  throw Object.assign(new Error(message), { status: 400 });
}

export function validateDocument(kind: string, data: Record<string, any>) {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    JSON.stringify(data).length > 500000
  )
    invalid("Invalid or oversized content");
  if (kind === "page") {
    z.object({
      title: z.string().min(1).max(180),
      description: z.string().max(500),
      blocks: z
        .object({
          content: z
            .array(z.object({ type: z.enum(blockTypes), props: propSchema }))
            .max(100),
          root: z.any().optional(),
        })
        .passthrough(),
    }).parse(data);
    const ids = data.blocks.content.map((b: any) => b.props.id);
    if (new Set(ids).size !== ids.length)
      invalid("Block identifiers must be unique");
  } else if (kind === "settings") {
    z.object({
      name: z.string().min(1),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      nav: z.array(
        z.object({
          label: z.string().min(1),
          href: z.string().min(1),
          children: z
            .array(z.object({ label: z.string(), href: z.string() }))
            .optional(),
        }),
      ),
      social: z.array(z.object({ label: z.string(), href: z.string() })),
    })
      .passthrough()
      .parse(data);
  } else
    z.object({
      title: z.string().min(1).max(180),
      sample: z.boolean().optional(),
      open: z.boolean().optional(),
      description: z.string().optional(),
      subtitle: z.string().optional(),
      features: z.string().optional(),
      image: z.string().optional(),
      imageAlt: z.string().optional(),
      role: z.string().optional(),
      quote: z.string().optional(),
      services: z.string().optional(),
      outcomes: z.string().optional(),
      requirements: z.string().optional(),
      employment: z.string().optional(),
      location: z.string().optional(),
    })
      .passthrough()
      .parse(data);
  function walk(x: any, key = "") {
    if (typeof x === "string") {
      if (x.length > 50000) invalid("Text is too long");
      if (
        /^(href|buttonHref|secondaryHref|announcementLink|ctaHref|image|logo|favicon|url)$/.test(
          key,
        ) &&
        x &&
        !safeUrl(x)
      )
        invalid(`Invalid ${key} URL`);
    } else if (Array.isArray(x)) x.forEach((v) => walk(v));
    else if (x && typeof x === "object")
      for (const [k, v] of Object.entries(x)) walk(v, k);
  }
  walk(data);
  return data;
}
export function canPublish(role: string) {
  return role === "admin";
}
export function isPdf(buffer: Buffer) {
  return (
    buffer.subarray(0, 5).toString() === "%PDF-" &&
    buffer.includes(Buffer.from("%%EOF"))
  );
}
