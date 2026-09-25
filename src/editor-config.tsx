import { useEffect, useState } from "react";
import type { Config } from "@puckeditor/core";
import { components } from "./blocks";
import { api } from "./api-client";
import type { Content, Media } from "./types";
export function ImagePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [media, setMedia] = useState<Media[]>([]),
    [open, setOpen] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (open)
      api<Media[]>("/admin/media")
        .then(setMedia)
        .catch((e) => setError(e.message));
  }, [open]);
  return (
    <div>
      <input
        aria-label="Image URL"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="/images/example.jpg or https://…"
      />
      <button
        type="button"
        className="text-link"
        style={{ marginTop: 10 }}
        onClick={() => setOpen(!open)}
      >
        {open ? "Close library" : "Choose from media library"}
      </button>
      {error && <p role="alert">{error}</p>}
      {open && (
        <div className="media-picker-list">
          {media.length ? (
            media.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => {
                  onChange(m.url);
                  setOpen(false);
                }}
              >
                <img src={m.url} alt={m.alt} />
                <span>{m.name}</span>
              </button>
            ))
          ) : (
            <p>Upload images in Media first.</p>
          )}
        </div>
      )}
    </div>
  );
}
const text = (label: string) => ({
  type: "custom" as const,
  label,
  render: ({ value, onChange }: any) => (
    <label className="puck-custom-field">
      <span>{label}</span>
      <input
        aria-label={label}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  ),
});
const area = (label: string) => ({
  type: "custom" as const,
  label,
  render: ({ value, onChange }: any) => (
    <label className="puck-custom-field">
      <span>{label}</span>
      <textarea
        aria-label={label}
        rows={4}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  ),
});
const image = {
  type: "custom" as const,
  label: "Image",
  render: ({ value, onChange }: any) => (
    <ImagePicker value={value} onChange={onChange} />
  ),
};
const bool = (label: string) => ({
  type: "radio" as const,
  label,
  options: [
    { label: "Yes", value: true },
    { label: "No", value: false },
  ],
});
const common = {
  alignment: {
    type: "select" as const,
    label: "Text alignment",
    options: [
      { label: "Left", value: "left" },
      { label: "Centered", value: "center" },
    ],
  },
  hidden: bool("Hide this block"),
  spacing: {
    type: "select" as const,
    label: "Section spacing",
    options: ["compact", "comfortable", "generous"].map((value) => ({
      label: value,
      value,
    })),
  },
  background: {
    type: "select" as const,
    label: "Background",
    options: ["white", "soft", "blue", "dark"].map((value) => ({
      label: value,
      value,
    })),
  },
};
const heading = {
  title: area("Heading"),
  description: area("Description"),
};
const cta = {
  buttonLabel: text("Button label"),
  buttonHref: text("Button link"),
};
const imageFields = {
  image,
  imageAlt: text("Image description (alt text)"),
  imageX: {
    type: "number" as const,
    label: "Horizontal focal point (%)",
    min: 0,
    max: 100,
  },
  imageY: {
    type: "number" as const,
    label: "Vertical focal point (%)",
    min: 0,
    max: 100,
  },
};
const fields: Record<string, any> = {
  Hero: {
    ...heading,
    ...cta,
    ...imageFields,
    accent: text("Heading line to accent"),
    secondaryLabel: text("Secondary link label"),
    secondaryHref: text("Secondary link"),
    posterLabel: text("Poster label"),
    posterText: area("Poster headline"),
    posterFooter: text("Poster footer"),
    imageLabel: text("Photo label"),
    disciplines: text("Creative strip (comma-separated)"),
    badge: text("Image badge"),
    variant: {
      type: "select",
      options: [
        { label: "Editorial collage", value: "editorial" },
        { label: "Simple heading", value: "simple" },
      ],
    },
  },
  TextImage: {
    ...heading,
    ...cta,
    ...imageFields,
    imageBadge: text("Image badge"),
    reverse: bool("Image on the left"),
  },
  Gallery: {
    ...heading,
    images: {
      type: "array",
      getItemSummary: (i: any) => i.alt || "Image",
      arrayFields: {
        url: image,
        alt: text("Alt text"),
        caption: text("Caption"),
      },
    },
  },
  ServiceGrid: { ...heading, aside: area("Supporting note") },
  ProjectGrid: { ...heading, showEmpty: bool("Show when empty") },
  LogoCarousel: heading,
  Testimonials: heading,
  Process: {
    ...heading,
    steps: {
      type: "array",
      getItemSummary: (i: any) => i.title || "Step",
      arrayFields: {
        title: text("Step title"),
        description: area("Description"),
      },
    },
  },
  Team: heading,
  FAQ: {
    ...heading,
    items: {
      type: "array",
      getItemSummary: (i: any) => i.question || "Question",
      arrayFields: { question: text("Question"), answer: area("Answer") },
    },
  },
  JobListing: { ...heading, showEmpty: bool("Show when empty") },
  ContactForm: heading,
  CTA: { ...heading, ...cta, artLabel: text("Decorative label") },
};
const collectionKinds: Record<string, string> = {
  ServiceGrid: "service",
  ProjectGrid: "project",
  LogoCarousel: "logo",
  Testimonials: "testimonial",
  Team: "team",
  JobListing: "job",
};
export function makeConfig(records: Content[]): Config {
  return {
    root: { fields: {}, render: ({ children }: any) => children },
    components: Object.fromEntries(
      Object.entries(components).map(([name, Component]) => [
        name,
        {
          label: name.replace(/([a-z])([A-Z])/g, "$1 $2"),
          fields: {
            ...fields[name],
            ...(collectionKinds[name]
              ? {
                  recordIds: {
                    type: "custom",
                    label: "Select records (none = all published)",
                    render: ({ value, onChange }: any) => (
                      <div>
                        {records
                          .filter((r) => r.kind === collectionKinds[name])
                          .map((r) => (
                            <label
                              key={r.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                margin: "12px 0",
                                fontSize: 12,
                              }}
                            >
                              <input
                                style={{ width: 15, height: 15 }}
                                type="checkbox"
                                checked={(value || []).includes(r.id)}
                                onChange={(e) =>
                                  onChange(
                                    e.target.checked
                                      ? [...(value || []), r.id]
                                      : (value || []).filter(
                                          (id: string) => id !== r.id,
                                        ),
                                  )
                                }
                              />
                              {r.draft.title}
                              {!r.published ? " (draft)" : ""}
                            </label>
                          ))}
                      </div>
                    ),
                  },
                }
              : {}),
            ...common,
          },
          defaultProps: {
            title: `Your ${name === "CTA" ? "next big idea" : name.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()}`,
            description: "",
            eyebrow: "",
            hidden: false,
            spacing: "comfortable",
            background: name === "CTA" ? "blue" : "white",
            alignment: "left",
            variant: "simple",
            buttonLabel: "",
            buttonHref: "/contact",
            image: "",
            imageAlt: "",
            recordIds: [],
            steps: [
              {
                title: "Discover",
                description: "Get to the heart of your idea.",
              },
            ],
            items: [{ question: "Your question", answer: "Your answer" }],
            images: [],
          },
          render: (props: any) => (
            <div
              className={`puck-preview-wrap block bg-${props.background} spacing-${props.spacing} align-${props.alignment || "left"}`}
            >
              {props.hidden ? (
                <div className="puck-empty-placeholder">
                  Hidden block · {name}
                </div>
              ) : (
                <Component {...props} />
              )}
            </div>
          ),
        },
      ]),
    ),
  } as Config;
}
