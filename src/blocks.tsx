import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  PenTool,
  ChartNoAxesCombined,
  Camera,
  Clapperboard,
  Check,
  Plus,
  Minus,
  Send,
} from "lucide-react";
import { useSite } from "./context";
import { safeUrl } from "./urls";
import type { Content } from "./types";
export const icons = [PenTool, ChartNoAxesCombined, Camera, Clapperboard];
export const url = (s: string) => safeUrl(s) || "#";
export function Button({
  children,
  to,
  className = "",
}: {
  children: React.ReactNode;
  to: string;
  className?: string;
}) {
  return (
    <Link className={`button ${className}`} to={url(to)}>
      {children}
      <ArrowUpRight size={18} />
    </Link>
  );
}
export function AssetImage({
  src,
  alt,
  x,
  y,
  style,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { x?: number; y?: number }) {
  const media = useSite().media?.find((m) => m.url === src);
  return (
    <img
      {...props}
      src={src}
      alt={alt || media?.alt || ""}
      style={{
        ...style,
        objectPosition: `${x ?? media?.focal_x ?? 50}% ${y ?? media?.focal_y ?? 50}%`,
      }}
    />
  );
}
function Heading({ title, description }: any) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}
function useRecords(kind: string, ids?: string[]) {
  return useSite().records.filter(
    (r) =>
      r.kind === kind && r.published && (!ids?.length || ids.includes(r.id)),
  );
}
export function Hero(p: any) {
  const simple = p.variant === "simple";
  return (
    <section className={`hero ${simple ? "simple-hero" : ""}`}>
      <div className="container hero-grid">
        <div className="hero-copy">
          <h1>
            {p.title?.split("\n").map((line: string, i: number) => (
              <span key={i} className={line === p.accent ? "accent-line" : ""}>
                {line}
                {line === p.accent && (
                  <svg
                    viewBox="0 0 540 16"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path d="M3 12Q270 -2 536 8" />
                  </svg>
                )}
              </span>
            ))}
          </h1>
          <p>{p.description}</p>
          <div className="hero-actions">
            {p.buttonLabel && (
              <Button to={p.buttonHref}>{p.buttonLabel}</Button>
            )}
            {p.secondaryLabel && (
              <Link className="text-link" to={url(p.secondaryHref)}>
                {p.secondaryLabel}
                <ArrowRight size={17} />
              </Link>
            )}
          </div>
        </div>
        {!simple && (
          <div className="hero-art">
            <div className="art-grid" />
            <div className="creative-poster">
              <div className="poster-top">
                <span>{p.posterLabel || "DF® CREATIVE STUDIO"}</span>
                <ArrowUpRight size={30} />
              </div>
              <div className="poster-type">
                {p.posterText || "MAKE\nIT MATTER."}
              </div>
              <div className="orbital-mark">
                <div />
                <div />
                <div />
              </div>
              <div className="poster-bottom">
                <span>{p.posterFooter || "IDEAS INTO IMPACT."}</span>
                <span>01 — ∞</span>
              </div>
            </div>
            <div className="hero-photo">
              <AssetImage
                src={url(p.image || "/images/studio.jpg")}
                alt={p.imageAlt || "Creative production studio"}
                fetchPriority="high"
                x={p.imageX}
                y={p.imageY}
              />
              <span>
                <span className="live-dot" />
                {p.imageLabel || "IN OUR ELEMENT"}
              </span>
              <div className="photo-crosshair">+</div>
            </div>
            <div className="floating-label">
              {p.badge || "STRATEGY MEETS CREATIVITY"}
            </div>
          </div>
        )}
      </div>
      {!simple && (
        <div
          className="creative-strip"
          tabIndex={0}
          aria-label="Our creative disciplines"
        >
          <div className="discipline-track">
            {[false, true].map((duplicate) => (
              <div
                className={`container discipline-group${duplicate ? " discipline-copy" : ""}`}
                key={String(duplicate)}
                aria-hidden={duplicate || undefined}
              >
                {String(
                  p.disciplines ||
                    "STRATEGY,STORYTELLING,DESIGN,PRODUCTION,GROWTH",
                )
                  .split(",")
                  .flatMap((s, i) => [
                    <span key={i}>{s}</span>,
                    <span
                      className="discipline-star"
                      key={`star-${i}`}
                      aria-hidden="true"
                    >
                      ✳
                    </span>,
                  ])}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
export function ServiceGrid(p: any) {
  const records = useRecords("service", p.recordIds);
  if (!records.length) return null;
  return (
    <section className="section services-section">
      <div className="container">
        <div className="heading-row">
          <Heading {...p} />
          <div className="heading-aside">
            <p>{p.aside || "One creative partner.\nEndless possibilities."}</p>
          </div>
        </div>
        <div className="service-grid">
          {records.map((r, i) => {
            const d = r.published!,
              Icon = icons[i % 4];
            return (
              <Link
                to={`/services/${r.slug}`}
                className={`service-card service-${i % 4}`}
                key={r.id}
              >
                <div className="service-top">
                  <span className="service-icon">
                    <Icon size={25} strokeWidth={1.5} />
                  </span>
                  <span>0{i + 1}</span>
                </div>
                <h3>{d.title}</h3>
                <p>{d.description}</p>
                <div className="service-tags">
                  {String(d.features || "")
                    .split(",")
                    .slice(0, 2)
                    .map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                </div>
                <div className="service-bottom">
                  <span>Explore service</span>
                  <span className="circle-arrow">
                    <ArrowUpRight size={19} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
export function TextImage(p: any) {
  return (
    <section className="section">
      <div
        className={`container story-grid ${p.reverse ? "reverse" : ""} ${!p.image ? "text-only" : ""}`}
      >
        <div>
          <Heading {...p} />
          {p.buttonLabel && (
            <Button className="button-dark" to={p.buttonHref}>
              {p.buttonLabel}
            </Button>
          )}
        </div>
        {p.image && (
          <div className="story-image">
            <AssetImage
              src={url(p.image)}
              alt={p.imageAlt || ""}
              loading="lazy"
              x={p.imageX}
              y={p.imageY}
            />
            <div className="image-corner">
              <span>{p.imageBadge || "THE HUMAN SIDE OF GREAT IDEAS."}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
export function Process(p: any) {
  return (
    <section className="section process-section">
      <div className="container">
        <Heading {...p} />
        <div className="process-grid">
          {p.steps?.map((s: any, i: number) => (
            <div key={i}>
              <span className="step-number">
                0{i + 1}
                <ArrowUpRight size={21} />
              </span>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty-state">
      <p>{children}</p>
    </div>
  );
}
export function ProjectGrid(p: any) {
  const records = useRecords("project", p.recordIds);
  if (!records.length && !p.showEmpty) return null;
  return (
    <section className="section">
      <div className="container">
        <Heading {...p} />
        {!records.length ? (
          <EmptyState>
            New stories are in the making. Yours could be next.
          </EmptyState>
        ) : (
          <div className="project-grid">
            {records.map((r) => (
              <Link className="project-card" to={`/work/${r.slug}`} key={r.id}>
                {r.published!.image && (
                  <AssetImage
                    src={url(r.published!.image)}
                    alt={r.published!.imageAlt || r.published!.title}
                    loading="lazy"
                  />
                )}
                <div>
                  <div>
                    <h3>{r.published!.title}</h3>
                  </div>
                  <ArrowUpRight />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
function Carousel({
  records,
  kind,
}: {
  records: Content[];
  kind: "logo" | "testimonial";
}) {
  const [index, setIndex] = useState(0),
    [paused, setPaused] = useState(true),
    [touch, setTouch] = useState<number | null>(null);
  const n = records.length;
  const go = (delta: number) => {
    if (n < 2) return;
    setPaused(true);
    setIndex((x) => (x + delta + n) % n);
  };
  useEffect(() => {
    if (
      paused ||
      n < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const id = setInterval(() => setIndex((x) => (x + 1) % n), 5000);
    return () => clearInterval(id);
  }, [paused, n]);
  const row = records[index % n]?.published;
  if (!row) return null;
  return (
    <div
      className={`carousel ${kind}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={kind === "logo" ? "Client logos" : "Client testimonials"}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          go(e.key === "ArrowLeft" ? -1 : 1);
        }
      }}
      onTouchStart={(e) => setTouch(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (
          touch !== null &&
          Math.abs(touch - e.changedTouches[0].clientX) > 40
        )
          go(touch > e.changedTouches[0].clientX ? 1 : -1);
        setTouch(null);
      }}
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onFocusCapture={() => setPaused(true)}
    >
      <div aria-live={paused ? "polite" : "off"} aria-atomic="true">
        <div
          role="group"
          aria-roledescription="slide"
          aria-label={`${(index % n) + 1} of ${n}`}
        >
          {kind === "testimonial" ? (
            <>
              <span className="quote-mark">“</span>
              <blockquote>{row.quote}</blockquote>
              <div className="quote-person">
                {row.image && <AssetImage src={url(row.image)} alt="" />}
                <div>
                  <strong>{row.title}</strong>
                  <p>{row.role}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="partner-logo">
              {row.image ? (
                <AssetImage src={url(row.image)} alt={row.title} />
              ) : (
                row.title
              )}
            </div>
          )}
        </div>
      </div>
      {(n > 1 || kind === "testimonial") && (
        <div className="carousel-controls">
          <button
            aria-label="Previous slide"
            disabled={n < 2}
            onClick={() => go(-1)}
          >
            <ChevronLeft size={19} />
          </button>
          <span>
            {(index % n) + 1} / {n}
          </span>
          <button
            aria-label="Next slide"
            disabled={n < 2}
            onClick={() => go(1)}
          >
            <ChevronRight size={19} />
          </button>
          <button
            disabled={n < 2}
            aria-label={paused ? "Play carousel" : "Pause carousel"}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        </div>
      )}
    </div>
  );
}
export function LogoCarousel(p: any) {
  const records = useRecords("logo", p.recordIds);
  if (!records.length) return null;
  return (
    <section className="section logos-section">
      <div className="container">
        <Heading {...p} />
        <Carousel records={records} kind="logo" />
      </div>
    </section>
  );
}
export function Testimonials(_p: any) {
  const records = useRecords("testimonial");
  const [repeatCount, setRepeatCount] = useState(6);
  useEffect(() => {
    const resize = () =>
      setRepeatCount(
        Math.max(
          1,
          Math.ceil(window.innerWidth / (280 * Math.max(records.length, 1))),
        ),
      );
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [records.length]);
  const slides = Array.from({ length: repeatCount }, () => records).flat();
  if (!records.length) return null;
  return (
    <section
      className="section testimonials-section"
      aria-label="Client testimonials"
    >
      <div className="testimonial-marquee">
        <div
          className="testimonial-window"
          tabIndex={0}
          role="region"
          aria-label="Scrolling testimonials. Hover or focus to pause."
        >
          <div
            className="testimonial-track"
            style={{
              animationDuration: `${Math.max(20, slides.length * 12)}s`,
            }}
          >
            {[false, true].map((duplicate) => (
              <div
                className="testimonial-set"
                key={String(duplicate)}
                aria-hidden={duplicate || undefined}
              >
                {slides.map((record, index) => {
                  const row = record.published!;
                  return (
                    <article
                      className="testimonial-card"
                      key={`${record.id}-${index}`}
                      aria-hidden={index >= records.length || undefined}
                    >
                      <span className="quote-mark" aria-hidden="true">
                        “
                      </span>
                      <blockquote>{row.quote}</blockquote>
                      <div className="quote-person">
                        {row.image && (
                          <AssetImage src={url(row.image)} alt="" />
                        )}
                        <div>
                          <strong>{row.title}</strong>
                          <p>{row.role}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
export function FAQ(p: any) {
  return (
    <section className="section faq-section">
      <div className="container faq-grid">
        <Heading {...p} />
        <div className="faq-items">
          {p.items?.map((item: any, i: number) => (
            <details key={i}>
              <summary>
                <span className="faq-number" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="faq-question">{item.question}</span>
                <span className="faq-toggle" aria-hidden="true">
                  <Plus className="faq-plus" size={18} />
                  <Minus className="faq-minus" size={18} />
                </span>
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
export function CTA(p: any) {
  return (
    <section className="cta-section">
      <div className="container">
        <div>
          <h2>{p.title}</h2>
          {p.description && <p>{p.description}</p>}
        </div>
        {p.buttonLabel && (
          <div className="cta-action">
            <Button className="button-dark" to={p.buttonHref}>
              {p.buttonLabel}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
export function Team(p: any) {
  const records = useRecords("team", p.recordIds);
  if (!records.length) return null;
  return (
    <section className="section">
      <div className="container">
        <Heading {...p} />
        <div className="team-grid">
          {records.map((r) => (
            <article key={r.id}>
              {r.published!.image && (
                <AssetImage
                  src={url(r.published!.image)}
                  alt={r.published!.title}
                  loading="lazy"
                />
              )}
              <h3>{r.published!.title}</h3>
              <span>{r.published!.role}</span>
              <p>{r.published!.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
export function Gallery(p: any) {
  return (
    <section className="section">
      <div className="container">
        <Heading {...p} />
        <div className="gallery-grid">
          {p.images?.map((img: any, i: number) => (
            <figure key={i}>
              <AssetImage
                src={url(img.url)}
                alt={img.alt || ""}
                loading="lazy"
              />
              <figcaption>{img.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
export function JobListing(p: any) {
  const records = useRecords("job", p.recordIds).filter(
    (r) => r.published!.open,
  );
  if (!records.length && !p.showEmpty) return null;
  return (
    <section className="section">
      <div className="container">
        <Heading {...p} />
        {records.length ? (
          <div className="job-list">
            {records.map((r) => (
              <Link key={r.id} to={`/careers/${r.slug}`}>
                <div>
                  <h3>{r.published!.title}</h3>
                  <p>
                    {r.published!.location} <span>·</span>{" "}
                    {r.published!.employment}
                  </p>
                </div>
                <ArrowUpRight />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState>
            There are no open roles right now. Check back for your next chapter.
          </EmptyState>
        )}
      </div>
    </section>
  );
}
export function ContactForm(p: any) {
  return (
    <section className="section contact-section">
      <div className="container contact-grid">
        <div>
          <Heading {...p} />
          <div className="contact-note">
            <p>
              Big ambitions welcome.
              <br />
              Let’s figure out the possibilities together.
            </p>
          </div>
        </div>
        <SubmissionForm />
      </div>
    </section>
  );
}
export function SubmissionForm({ job }: { job?: Content }) {
  const [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [success, setSuccess] = useState(false);
  const site = useSite();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (site.preview) {
      setStatus(
        "Forms are disabled in draft preview. Open the published page to submit.",
      );
      return;
    }
    setBusy(true);
    setStatus("");
    const form = e.currentTarget;
    const data = new FormData(form);
    if (job) data.set("job_id", job.id);
    try {
      const res = await fetch(job ? "/api/applications" : "/api/enquiries", {
        method: "POST",
        headers: job ? {} : { "Content-Type": "application/json" },
        body: job ? data : JSON.stringify(Object.fromEntries(data)),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccess(true);
      form.reset();
    } catch (e) {
      setStatus(
        (e as Error).message || "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (success)
    return (
      <div className="form-success" role="status">
        <span>
          <Check size={30} />
        </span>
        <h3>
          {job
            ? "Your next chapter starts here."
            : "That’s the start of something good."}
        </h3>
        <p>
          {job
            ? "Your application has been received. Our team will review it."
            : "Your enquiry is safely with our team. We’ll be in touch."}
        </p>
        <button className="text-link" onClick={() => setSuccess(false)}>
          Send another message <ArrowRight size={17} />
        </button>
      </div>
    );
  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="form-row">
        <label>
          Your name
          <input
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={120}
            placeholder="Alex Smith"
          />
        </label>
        <label>
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="alex@yourbrand.com"
          />
        </label>
      </div>
      {!job && (
        <div className="form-row">
          <label>
            What can we help with?
            <select name="service" required defaultValue="">
              <option value="" disabled>
                Select a service
              </option>
              {site.records
                .filter((r) => r.kind === "service")
                .map((r) => (
                  <option key={r.id}>{r.published!.title}</option>
                ))}
              <option>A bit of everything</option>
            </select>
          </label>
          <label>
            Budget range
            <select name="budget" defaultValue="Let's discuss">
              <option>Let's discuss</option>
              <option>Under ₹50,000</option>
              <option>₹50,000–₹1,00,000</option>
              <option>₹1,00,000–₹5,00,000</option>
              <option>₹5,00,000+</option>
            </select>
          </label>
        </div>
      )}
      {job && (
        <>
          <label>
            Portfolio URL <span>(optional)</span>
            <input
              name="portfolio"
              type="url"
              placeholder="https://yourportfolio.com"
            />
          </label>
          <label>
            Your résumé (PDF, up to 5 MB)
            <input
              name="resume"
              type="file"
              accept="application/pdf"
              required
            />
          </label>
        </>
      )}
      <label>
        {job ? "Tell us about yourself" : "A little about your project"}
        <textarea
          name="message"
          minLength={10}
          maxLength={10000}
          required
          rows={5}
          placeholder={
            job
              ? "What would you bring to the team?"
              : "The idea, the goal, the big dream. We’re all ears."
          }
        />
      </label>
      <label className="honeypot" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <p className="form-privacy">
        By submitting, you agree to our{" "}
        <Link to="/privacy">privacy policy</Link>.
      </p>
      {status && (
        <p role="alert" className="error-message">
          {status}
        </p>
      )}
      <button className="button" disabled={busy}>
        {busy
          ? "Sending…"
          : job
            ? "Send application"
            : "Let’s get this started"}
        <Send size={17} />
      </button>
    </form>
  );
}
export const components: Record<string, React.ComponentType<any>> = {
  Hero,
  TextImage,
  Gallery,
  ServiceGrid,
  ProjectGrid,
  LogoCarousel,
  Testimonials,
  Process,
  Team,
  FAQ,
  JobListing,
  ContactForm,
  CTA,
};
export function BlockRenderer({ data }: { data: any }) {
  return (
    <>
      {data?.content?.map((block: any) => {
        const Component = components[block.type];
        return !Component || block.props.hidden ? null : (
          <div
            key={block.props.id}
            className={`block bg-${["white", "soft", "dark", "blue"].includes(block.props.background) ? block.props.background : "white"} spacing-${block.props.spacing || "comfortable"} align-${block.props.alignment || "left"}`}
          >
            <Component {...block.props} />
          </div>
        );
      })}
    </>
  );
}
