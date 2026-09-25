import type { SiteSettings } from "./types";
export const settings: SiteSettings = {
  name: "DF Creatives",
  tagline: "Editing Agency",
  logo: "/images/df-creatives-logo.png",
  favicon: "/images/df-creatives-logo.png",
  color: "#00BFFF",
  announcement: "Good ideas deserve a great creative partner.",
  announcementLink: "/contact",
  nav: [
    {
      label: "Services",
      href: "/services",
      children: [
        { label: "Content Creation", href: "/services/content-creation" },
        { label: "Digital Marketing", href: "/services/digital-marketing" },
        { label: "Videography", href: "/services/videography" },
        { label: "Video Editing", href: "/services/video-editing" },
      ],
    },
    { label: "Our Work", href: "/work" },
    { label: "About", href: "/about" },
    { label: "Careers", href: "/careers" },
  ],
  ctaLabel: "Let’s talk",
  ctaHref: "/contact",
  email: "",
  phone: "",
  location: "Creating without boundaries.",
  footerHeading: "Your next big thing\nstarts with a hello.",
  footerCopy:
    "We bring strategy, stories, and a fresh perspective to brands ready for what’s next.",
  social: [],
};
