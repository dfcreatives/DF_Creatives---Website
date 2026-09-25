import type { Data } from "@puckeditor/core";
export type Role = "admin" | "editor";
export type Kind =
  | "page"
  | "settings"
  | "service"
  | "project"
  | "testimonial"
  | "logo"
  | "team"
  | "job";
export type Content = {
  id: string;
  kind: Kind;
  slug: string;
  draft: Record<string, any>;
  published: Record<string, any> | null;
  updated_at: string;
  version: number;
};
export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};
export type SiteSettings = {
  name: string;
  tagline: string;
  logo: string;
  favicon: string;
  color: string;
  announcement: string;
  announcementLink: string;
  nav: NavItem[];
  ctaLabel: string;
  ctaHref: string;
  email: string;
  phone: string;
  location: string;
  footerHeading: string;
  footerCopy: string;
  footerExplore?: string;
  footerServices?: string;
  footerContact?: string;
  social: { label: string; href: string }[];
};
export type PublicData = {
  settings: SiteSettings;
  records: Content[];
  page: Content | null;
  demo: boolean;
  media?: Media[];
  preview?: boolean;
};
export type BlockData = Data;
export type Submission = {
  id: string;
  kind: "enquiry" | "application";
  name: string;
  email: string;
  service?: string;
  budget?: string;
  message: string;
  job_id?: string;
  resume_path?: string;
  portfolio?: string;
  status: string;
  notes: string;
  notification_status: string;
  created_at: string;
};
export type Media = {
  id: string;
  url: string;
  path: string;
  name: string;
  alt: string;
  focal_x: number;
  focal_y: number;
  created_at: string;
};
