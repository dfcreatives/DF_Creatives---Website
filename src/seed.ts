import type { Content } from "./types";
import { settings } from "./default-settings";
export { settings };
const block = (type: string, id: string, props: Record<string, any>) => ({
  type,
  props: {
    id,
    hidden: false,
    spacing: "comfortable",
    background: "white",
    ...props,
  },
});
const page = (
  id: string,
  slug: string,
  title: string,
  description: string,
  blocks: any[],
): Content => ({
  id,
  kind: "page",
  slug,
  draft: {
    title,
    description,
    blocks: { content: blocks, root: { props: {} } },
  },
  published: {
    title,
    description,
    blocks: { content: blocks, root: { props: {} } },
  },
  version: 1,
  updated_at: new Date().toISOString(),
});
export const seed: Content[] = [
  {
    id: "settings",
    kind: "settings",
    slug: "settings",
    draft: settings,
    published: settings,
    version: 1,
    updated_at: new Date().toISOString(),
  },
  page(
    "home",
    "/",
    "DF Creatives — Ideas that move brands forward",
    "Content creation, digital marketing, videography and video editing. One creative partner for your next chapter.",
    [
      block("Hero", "home-hero", {
        eyebrow: "INDEPENDENT MINDS. EXTRAORDINARY POSSIBILITIES.",
        title: "Big ideas.\nBeautifully made.",
        accent: "Beautifully made.",
        description:
          "We turn your brand’s potential into content people feel, stories they remember, and growth that matters.",
        buttonLabel: "Build something great",
        buttonHref: "/contact",
        secondaryLabel: "Explore our services",
        secondaryHref: "/services",
        image: "/images/studio.jpg",
        imageAlt: "Camera and creative equipment ready for a studio production",
        variant: "editorial",
        badge: "STRATEGY MEETS CREATIVITY",
        note: "Your vision. Our creative obsession.",
      }),
      block("LogoCarousel", "home-logos", {
        eyebrow: "GOOD COMPANY. GREAT COLLABORATIONS.",
        title: "Built on creative partnerships.",
        recordIds: [],
      }),
      block("ServiceGrid", "home-services", {
        eyebrow: "WHAT WE DO",
        title: "Your ambition.\nOur creative playground.",
        description:
          "From the first spark to the final frame, we bring everything your brand needs under one roof.",
        recordIds: [],
      }),
      block("TextImage", "home-story", {
        eyebrow: "MORE THAN AN AGENCY",
        title: "A little strategy.\nA lot of possibility.",
        description:
          "The best work happens when curious minds come together. We connect sharp thinking with a hands-on creative approach to help your brand find its voice — and make it heard.",
        image: "/images/team.jpg",
        imageAlt: "Creative team collaborating around a table",
        buttonLabel: "Meet your creative partners",
        buttonHref: "/about",
        reverse: false,
        background: "soft",
      }),
      block("ProjectGrid", "home-work", {
        eyebrow: "SELECTED WORK",
        title: "Made with purpose.\nDesigned to make an impact.",
        description: "A closer look at the ideas we bring to life.",
        recordIds: [],
      }),
      block("Process", "home-process", {
        eyebrow: "HOW WE MAKE IT HAPPEN",
        title: "Great work starts\nwith a good conversation.",
        description:
          "A clear process. A collaborative partnership. Creativity without the guesswork.",
        steps: [
          {
            title: "Discover",
            description:
              "We listen, ask the right questions, and get to the heart of your brand.",
          },
          {
            title: "Imagine",
            description:
              "We turn insights into a clear direction and ideas worth getting excited about.",
          },
          {
            title: "Create",
            description:
              "We bring the vision to life, with care in every word, pixel, and frame.",
          },
          {
            title: "Grow",
            description:
              "We launch, learn, and keep refining to move your brand forward.",
          },
        ],
      }),
      block("Testimonials", "home-quotes", {
        eyebrow: "WORDS THAT MEAN THE WORLD",
        title: "Good work.\nEven better relationships.",
        recordIds: [],
      }),
      block("FAQ", "home-faq", {
        eyebrow: "A FEW THINGS YOU MIGHT BE WONDERING",
        title: "Let’s clear things up.",
        items: [
          {
            question: "What can DF Creatives help us with?",
            answer:
              "We bring together content creation, digital marketing, videography, and video editing. Work with us on a single project or a connected creative plan.",
          },
          {
            question: "Can we work together on an ongoing basis?",
            answer:
              "Absolutely. Tell us what you need, and we’ll recommend a project-based approach or an ongoing creative partnership.",
          },
          {
            question: "What does getting started look like?",
            answer:
              "Send us a little about your brand and what you have in mind. We’ll arrange a conversation to understand your goals, timeline, and budget before putting together a proposal.",
          },
          {
            question: "Do you work with brands remotely?",
            answer:
              "Yes. We collaborate remotely on strategy, content, and editing. For location-based shoots, we’ll work through the logistics together.",
          },
        ],
      }),
      block("CTA", "home-cta", {
        eyebrow: "LET’S MAKE SOMETHING MATTER",
        title: "Ready for your\nnext big thing?",
        description: "Bring the ambition. We’ll bring the ideas.",
        buttonLabel: "Let’s create together",
        buttonHref: "/contact",
        background: "blue",
      }),
    ],
  ),
  page(
    "services",
    "/services",
    "Creative services — DF Creatives",
    "Four connected creative services, one dedicated partner.",
    [
      block("Hero", "services-hero", {
        eyebrow: "OUR SERVICES",
        title: "Different disciplines.\nOne shared ambition.",
        description:
          "Strategy, content, film, and everything in between. The creative capabilities to move your brand forward.",
        buttonLabel: "Find your creative direction",
        buttonHref: "/contact",
        variant: "simple",
      }),
      block("ServiceGrid", "services-grid", {
        eyebrow: "A COMPLETE CREATIVE TOOLKIT",
        title: "Find your next advantage.",
        description:
          "Choose a focused service or bring them together for a bigger picture.",
        recordIds: [],
      }),
      block("CTA", "services-cta", {
        title: "What are you working on?",
        description: "Let’s build the right team around your idea.",
        buttonLabel: "Start a conversation",
        buttonHref: "/contact",
        background: "blue",
      }),
    ],
  ),
  page(
    "work",
    "/work",
    "Our work — DF Creatives",
    "Explore creative projects and brand stories from DF Creatives.",
    [
      block("Hero", "work-hero", {
        eyebrow: "OUR WORK",
        title: "Ideas are just\nthe beginning.",
        description:
          "Thoughtful concepts. Crafted details. Work that gives brands something to say.",
        variant: "simple",
        buttonLabel: "Make something with us",
        buttonHref: "/contact",
      }),
      block("ProjectGrid", "work-grid", {
        title: "A closer look at our work.",
        description:
          "New stories are in the making. Talk to us about creating yours.",
        recordIds: [],
        showEmpty: true,
      }),
      block("CTA", "work-cta", {
        title: "Your story could be next.",
        buttonLabel: "Let’s talk",
        buttonHref: "/contact",
        background: "blue",
      }),
    ],
  ),
  page(
    "about",
    "/about",
    "About us — DF Creatives",
    "Meet a creative partner built around curiosity, collaboration and craft.",
    [
      block("Hero", "about-hero", {
        eyebrow: "HELLO. WE’RE DF CREATIVES.",
        title: "Small details.\nBigger thinking.",
        description:
          "We’re a creative studio for brands with something to say. Our work connects the dots between what makes you different and what makes people care.",
        variant: "simple",
        buttonLabel: "Work with us",
        buttonHref: "/contact",
      }),
      block("TextImage", "about-story", {
        eyebrow: "OUR APPROACH",
        title: "Good people.\nGreat possibilities.",
        description:
          "We believe that clarity is a creative superpower. We take time to understand your world, challenge the obvious, and make work that feels unmistakably yours.",
        image: "/images/team.jpg",
        imageAlt: "A collaborative creative team",
        buttonLabel: "Explore our services",
        buttonHref: "/services",
      }),
      block("Team", "about-team", {
        eyebrow: "THE PEOPLE BEHIND THE IDEAS",
        title: "Creativity is a team sport.",
        recordIds: [],
      }),
      block("CTA", "about-cta", {
        title: "There’s room for your ideas.",
        description:
          "Curious, collaborative, and excited to make things? Explore life at DF Creatives.",
        buttonLabel: "Explore careers",
        buttonHref: "/careers",
        background: "blue",
      }),
    ],
  ),
  page(
    "careers",
    "/careers",
    "Careers — DF Creatives",
    "Bring your curiosity and craft to DF Creatives.",
    [
      block("Hero", "careers-hero", {
        eyebrow: "MAKE GOOD WORK. WITH GOOD PEOPLE.",
        title: "Your next chapter.\nOur next great idea.",
        description:
          "For the curious thinkers, visual storytellers, and people who care about the details. Let’s make something meaningful together.",
        variant: "simple",
      }),
      block("TextImage", "careers-culture", {
        eyebrow: "LIFE AT DF",
        title: "A place for\nyour kind of curious.",
        description:
          "We value thoughtful collaboration, honest feedback, and the freedom to bring new ideas to the table. There’s always more to learn and something new to create.",
        image: "/images/team.jpg",
        imageAlt: "Creative colleagues sharing ideas",
      }),
      block("JobListing", "careers-jobs", {
        eyebrow: "OPEN OPPORTUNITIES",
        title: "Find your place.",
        description: "Explore opportunities to do work you care about.",
        recordIds: [],
        showEmpty: true,
      }),
    ],
  ),
  page(
    "contact",
    "/contact",
    "Let’s talk — DF Creatives",
    "Tell us about your next creative project.",
    [
      block("Hero", "contact-hero", {
        eyebrow: "EVERY GREAT IDEA STARTS SOMEWHERE",
        title: "Let’s start\nwith a hello.",
        description:
          "A big idea, a new challenge, or a question. We’d love to hear what’s on your mind.",
        variant: "simple",
      }),
      block("ContactForm", "contact-form", {
        title: "Tell us what you have in mind.",
        description:
          "Share a few details and we’ll get back to you to talk possibilities.",
      }),
    ],
  ),
  page(
    "privacy",
    "/privacy",
    "Privacy — DF Creatives",
    "How DF Creatives handles website enquiries and applications.",
    [
      block("TextImage", "privacy-copy", {
        eyebrow: "PRIVACY",
        title: "Your information, handled with care.",
        description:
          "When you contact us or apply for a role, we collect the details you choose to submit, including contact information, your message, and any résumé you upload. We use these details to respond to your enquiry or review your application. Authorized team members can access submissions. Our hosting, database, and email providers process information to operate this website. Contact us through the enquiry form to request access, correction, or deletion of your information. This site uses essential authentication storage for the staff dashboard. We do not include advertising trackers by default.",
      }),
    ],
  ),
  page(
    "terms",
    "/terms",
    "Website terms — DF Creatives",
    "Terms for using the DF Creatives website.",
    [
      block("TextImage", "terms-copy", {
        eyebrow: "WEBSITE TERMS",
        title: "A few things to know.",
        description:
          "This website introduces DF Creatives and our services. Sending an enquiry does not create a service agreement; project scope, pricing, and deliverables are agreed separately. Please submit only information and materials you are authorized to share. Site content may change as our services evolve. Contact us using the enquiry form with questions about these terms.",
      }),
    ],
  ),
];
const services = [
  [
    "content-creation",
    "Content Creation",
    "Stories that stop the scroll.",
    "From social content to brand storytelling, we create with purpose — turning your message into something people want to spend time with.",
    "Brand storytelling,Social media content,Copywriting,Creative campaigns",
    "spark",
  ],
  [
    "digital-marketing",
    "Digital Marketing",
    "Creativity with a direction.",
    "Smart strategy meets meaningful execution. We help your brand connect with the right people, in the right places, at the right moments.",
    "Social strategy,Campaign planning,Performance marketing,Reporting & insights",
    "chart",
  ],
  [
    "videography",
    "Videography",
    "Your story. In full frame.",
    "Thoughtful concepts, a cinematic eye, and care in every frame. We create films that bring the feeling behind your brand to life.",
    "Brand films,Product videos,Event coverage,Social-first shoots",
    "camera",
  ],
  [
    "video-editing",
    "Video Editing",
    "Every cut has a purpose.",
    "We shape raw footage into stories that flow. From the first frame to the final sound, we find the rhythm that makes your story resonate.",
    "Story editing,Color grading,Sound design,Motion graphics",
    "film",
  ],
];
services.forEach(([slug, title, subtitle, description, features, icon], i) => {
  const data = {
    title,
    subtitle,
    description,
    features,
    image: i === 2 ? "/images/studio.jpg" : "",
    icon,
    sample: false,
  };
  seed.push({
    id: `service-${i}`,
    kind: "service",
    slug,
    draft: data,
    published: data,
    version: 1,
    updated_at: new Date().toISOString(),
  });
});
for (const [kind, slug, data] of [
  [
    "project",
    "sample-brand-film",
    {
      title: "A new perspective",
      subtitle: "Sample brand film concept",
      description:
        "An illustrative project placeholder. Replace with an approved case study before publishing.",
      image: "/images/event.jpg",
      services: "Videography,Video Editing",
      outcomes: "",
      sample: true,
    },
  ],
  [
    "testimonial",
    "sample-testimonial",
    {
      title: "Sample client",
      role: "Replace with an approved client name",
      quote: "Your approved client testimonial will appear here.",
      sample: true,
    },
  ],
  [
    "logo",
    "sample-partner",
    { title: "Partner name", image: "", sample: true },
  ],
  [
    "team",
    "sample-team",
    {
      title: "Your team member",
      role: "Creative role",
      image: "",
      description: "Add your team bio.",
      sample: true,
    },
  ],
  [
    "job",
    "sample-editor",
    {
      title: "Video Editor",
      location: "Add location",
      employment: "Full-time",
      description: "Replace this sample with an approved job description.",
      requirements: "Add role requirements.",
      open: true,
      sample: true,
    },
  ],
] as const)
  seed.push({
    id: `${kind}-sample`,
    kind,
    slug,
    draft: { ...data },
    published: null,
    version: 1,
    updated_at: new Date().toISOString(),
  });
