import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, X, ChevronDown } from "lucide-react";
import { SiteContext, useSite } from "./context";
import {
  BlockRenderer,
  Button,
  Hero,
  CTA,
  SubmissionForm,
  url,
} from "./blocks";
import type { PublicData } from "./types";
const Dashboard = lazy(() => import("./Dashboard"));
export function Wordmark({ onMenu }: { onMenu?: () => void } = {}) {
  const { settings } = useSite();
  const content = (
    <>
      {settings.logo ? (
        settings.logo === "/images/df-creatives-logo.png" ? (
          <>
            <span className="supplied-logo">
              <img src={url(settings.logo)} alt="" width={512} height={512} />
            </span>
            <span className="supplied-wordmark">
              {settings.name.replace(/^DF\s*/i, "")}
            </span>
          </>
        ) : (
          <img src={url(settings.logo)} alt={settings.name} />
        )
      ) : (
        <>
          <span className="brand-symbol">
            d<span>f</span>
            <i />
          </span>
          <span className="brand-name">
            {settings.name.replace(/^DF /, "")}
            <span>{settings.tagline}</span>
          </span>
        </>
      )}
    </>
  );
  return onMenu ? (
    <button
      type="button"
      className="wordmark mobile-logo-trigger"
      aria-label={`Open ${settings.name} navigation`}
      aria-haspopup="dialog"
      onClick={onMenu}
    >
      {content}
    </button>
  ) : (
    <Link to="/" className="wordmark" aria-label={`${settings.name} home`}>
      {content}
    </Link>
  );
}
function Header() {
  const { settings } = useSite();
  const [open, setOpen] = useState(false);
  const sidebar = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = sidebar.current;
    if (!open || !dialog) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const resize = () => {
      if (window.innerWidth > 600) setOpen(false);
    };
    window.addEventListener("resize", resize);
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("resize", resize);
    };
  }, [open]);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 48);
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {settings.announcement && (
        <div className="announcement">
          <Link to={url(settings.announcementLink)}>
            {settings.announcement}
            <span>Let’s make it happen</span>
          </Link>
        </div>
      )}
      <header className={scrolled ? "header is-scrolled" : "header"}>
        <div className="container navbar">
          <Wordmark />
          <Wordmark onMenu={() => setOpen(true)} />
          <nav className="nav" aria-label="Main navigation">
            {settings.nav.map((item, i) => (
              <div className="nav-item" key={i}>
                <Link
                  className={
                    location.pathname.startsWith(item.href) ? "active" : ""
                  }
                  to={url(item.href)}
                >
                  {item.label}
                  {item.children?.length ? <ChevronDown size={13} /> : null}
                </Link>
                {item.children?.length ? (
                  <div className="nav-dropdown">
                    {item.children.map((c, j) => (
                      <Link to={url(c.href)} key={j}>
                        {c.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            <Button className="mobile-cta" to={settings.ctaHref}>
              {settings.ctaLabel}
            </Button>
          </nav>
          <Button className="nav-cta" to={settings.ctaHref}>
            {settings.ctaLabel}
          </Button>
        </div>
      </header>
      <dialog
        ref={sidebar}
        className="mobile-sidebar"
        aria-labelledby="sidebar-title"
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const bounds = event.currentTarget.getBoundingClientRect();
            if (event.clientX > bounds.right || event.clientX < bounds.left)
              setOpen(false);
          }
        }}
      >
        <div className="sidebar-heading">
          <h2 id="sidebar-title">Explore {settings.name}</h2>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X size={22} />
          </button>
        </div>
        <nav
          aria-label="Mobile navigation"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <Link to="/">Home</Link>
          {settings.nav.map((item, i) => (
            <div className="sidebar-item" key={i}>
              <Link to={url(item.href)}>{item.label}</Link>
              {item.children?.map((child, j) => (
                <Link className="sidebar-child" to={url(child.href)} key={j}>
                  {child.label}
                </Link>
              ))}
            </div>
          ))}
          <Button className="sidebar-cta" to={settings.ctaHref}>
            {settings.ctaLabel}
          </Button>
        </nav>
      </dialog>
    </>
  );
}
function Footer() {
  const { settings, records } = useSite();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Wordmark />
            {settings.footerHeading && (
              <h3 className="footer-mini-heading">{settings.footerHeading}</h3>
            )}
            <p>{settings.footerCopy}</p>
            <span className="footer-location">
              <span className="live-dot" />
              {settings.location}
            </span>
          </div>
          <div>
            <h4>{settings.footerExplore || "Explore"}</h4>
            {settings.nav.map((n, i) => (
              <Link key={i} to={url(n.href)}>
                {n.label}
              </Link>
            ))}
          </div>
          <div>
            <h4>{settings.footerServices || "What we do"}</h4>
            {records
              .filter((r) => r.kind === "service")
              .map((r) => (
                <Link key={r.id} to={`/services/${r.slug}`}>
                  {r.published!.title}
                </Link>
              ))}
          </div>
          <div>
            <h4>{settings.footerContact || "Have something in mind?"}</h4>
            <Link className="footer-hello" to="/contact">
              Say hello
            </Link>
            {settings.email && (
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
            )}
            {settings.phone && (
              <a href={`tel:${settings.phone}`}>{settings.phone}</a>
            )}
            {settings.social.map((s, i) => (
              <a key={i} href={url(s.href)} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {settings.name}. Made with intention.
          </span>
          <div>
            <Link to="/privacy">Privacy policy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/admin">Studio dashboard</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
export function PagePreview() {
  const data = useSite();
  return (
    <div className="site-preview">
      <Header />
      <BlockRenderer data={data.page?.published?.blocks} />
      <Footer />
    </div>
  );
}

export function resolvePage(data: PublicData, pathname: string) {
  const page = data.records.find(
    (r) => r.kind === "page" && r.slug === pathname,
  );
  if (page) return { page, kind: "page" };
  const match = pathname.match(/^\/(services|work|careers)\/([^/]+)$/);
  if (match) {
    const kind =
      match[1] === "services"
        ? "service"
        : match[1] === "work"
          ? "project"
          : "job";
    const page = data.records.find(
      (r) => r.kind === kind && r.slug === match[2],
    );
    if (page) return { page, kind };
  }
  return null;
}
function PublicPage() {
  const data = useSite();
  const { pathname } = useLocation();
  const resolved = resolvePage(data, pathname);
  if (!resolved)
    return (
      <section className="not-found container">
        <span>404</span>
        <h1>This idea hasn’t landed yet.</h1>
        <p>Let’s get you back to familiar ground.</p>
        <Button to="/">Back to the good stuff</Button>
      </section>
    );
  const d = resolved.page.published!;
  if (resolved.kind === "page") return <BlockRenderer data={d.blocks} />;
  return (
    <>
      <Hero
        variant="simple"
        title={d.subtitle || d.title}
        description={d.description}
        buttonLabel={
          resolved.kind === "job" ? undefined : "Let’s make it happen"
        }
        buttonHref="/contact"
      />
      <section className="section">
        <div className="container detail-page">
          {d.image && (
            <img
              className="detail-image"
              src={url(d.image)}
              alt={d.imageAlt || d.title}
            />
          )}
          {resolved.kind === "service" && (
            <>
              <h2>Good thinking. Great execution.</h2>
              <div className="feature-list">
                {String(d.features || "")
                  .split(",")
                  .filter(Boolean)
                  .map((f: string, i: number) => (
                    <div key={f}>
                      <span>0{i + 1}</span>
                      <h3>{f}</h3>
                    </div>
                  ))}
              </div>
            </>
          )}
          {resolved.kind === "project" && (
            <>
              <h2>{d.title}</h2>
              <p>{d.services}</p>
              {d.outcomes && (
                <>
                  <h3>The outcome</h3>
                  <p className="preserve-lines">{d.outcomes}</p>
                </>
              )}
            </>
          )}
          {resolved.kind === "job" && (
            <>
              <div className="job-meta">
                {d.location} · {d.employment}
              </div>
              <h2>Bring your perspective.</h2>
              <p className="preserve-lines">{d.requirements}</p>
              {d.open ? (
                <div className="application-panel">
                  <h3>Let’s get to know you.</h3>
                  <SubmissionForm job={resolved.page} />
                </div>
              ) : (
                <p className="empty-state">
                  This role is no longer accepting applications.
                </p>
              )}
            </>
          )}
        </div>
      </section>
      {resolved.kind !== "job" && (
        <div className="bg-blue">
          <CTA
            title="Your next chapter starts here."
            description="Let’s make something worth paying attention to."
            buttonLabel="Start a conversation"
            buttonHref="/contact"
          />
        </div>
      )}
    </>
  );
}
export default function App({ initialData }: { initialData: PublicData }) {
  const [data, setData] = useState(initialData),
    [error, setError] = useState("");
  const location = useLocation();
  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    const controller = new AbortController();
    fetch(`/api/content?path=${encodeURIComponent(location.pathname)}`, {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok)
          throw new Error(
            "Unable to load this page. Please refresh to try again.",
          );
        return r.json();
      })
      .then((d) => {
        setData(d);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    window.scrollTo(0, 0);
    return () => controller.abort();
  }, [location.pathname]);
  useEffect(() => {
    const r = resolvePage(data, location.pathname);
    document.title = r
      ? `${r.page.published!.title}${r.kind === "page" ? "" : " — " + data.settings.name}`
      : `${data.settings.name}`;
    const meta = document.querySelector('meta[name="description"]');
    meta?.setAttribute("content", r?.page.published?.description || "");
    document.documentElement.style.setProperty("--brand", data.settings.color);
    document
      .querySelector("link[rel=canonical]")
      ?.setAttribute("href", window.location.origin + location.pathname);
    document
      .querySelector("link[rel=icon]")
      ?.setAttribute("href", url(data.settings.favicon || "/favicon.svg"));
  }, [data, location.pathname]);
  useEffect(() => {
    if (location.pathname.startsWith("/admin") || data.preview) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pending = new Set(
      [...document.querySelectorAll<HTMLElement>("#main section")].filter(
        (section) =>
          !motion.matches &&
          section.getBoundingClientRect().top >= window.innerHeight,
      ),
    );
    pending.forEach((section) =>
      section.classList.add("scroll-reveal-pending"),
    );
    const animations = new Set<Animation>();
    let previousY = window.scrollY;
    let frame = 0;
    let scrollingDown = false;
    const finishAnimations = () => {
      animations.forEach((animation) => animation.finish());
      animations.clear();
    };
    const reveal = () => {
      frame = 0;
      pending.forEach((section) => {
        const bounds = section.getBoundingClientRect();
        if (bounds.top >= window.innerHeight * (scrollingDown ? 0.85 : 1))
          return;
        pending.delete(section);
        section.classList.remove("scroll-reveal-pending");
        if (!scrollingDown || motion.matches || bounds.bottom <= 0) return;
        const animation = section.animate(
          [
            { opacity: 0, transform: "translateY(48px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 1600, easing: "cubic-bezier(0.2, 0.65, 0.3, 1)" },
        );
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    };
    const onScroll = () => {
      const y = window.scrollY;
      if (y === previousY) return;
      scrollingDown = y > previousY;
      previousY = y;
      if (!scrollingDown) finishAnimations();
      if (!frame) frame = window.requestAnimationFrame(reveal);
    };
    const onMotionChange = () => {
      if (motion.matches) {
        finishAnimations();
        pending.forEach((section) =>
          section.classList.remove("scroll-reveal-pending"),
        );
        pending.clear();
      }
    };
    const onFocus = (event: FocusEvent) => {
      pending.forEach((section) => {
        if (event.target instanceof Node && section.contains(event.target)) {
          section.classList.remove("scroll-reveal-pending");
          pending.delete(section);
        }
      });
    };
    const onResize = () => {
      scrollingDown = false;
      reveal();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("focusin", onFocus);
    motion.addEventListener("change", onMotionChange);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("focusin", onFocus);
      pending.forEach((section) =>
        section.classList.remove("scroll-reveal-pending"),
      );
      motion.removeEventListener("change", onMotionChange);
      window.cancelAnimationFrame(frame);
      animations.forEach((animation) => animation.cancel());
    };
  }, [data, location.pathname]);
  return (
    <SiteContext.Provider value={data}>
      {location.pathname.startsWith("/admin") ? (
        <Suspense
          fallback={<div className="loading-screen">Opening your studio…</div>}
        >
          <Dashboard />
        </Suspense>
      ) : (
        <div style={{ "--brand": data.settings.color } as React.CSSProperties}>
          {data.preview && (
            <div className="preview-banner">Draft preview · not published</div>
          )}
          <Header />
          <main id="main">
            {error ? (
              <div className="container error-message" role="alert">
                {error}
              </div>
            ) : (
              <PublicPage />
            )}
          </main>
          <Footer />
        </div>
      )}
    </SiteContext.Provider>
  );
}
