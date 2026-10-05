/**
 * Team page roster.
 *
 * Static content, so it lives in code rather than behind the API — the same
 * call `tutorials.ts` makes. Editing the page is a PR, which is what we want
 * for something that names people and links to their profiles.
 *
 * Photos live on the images CloudFront distribution under `team/`, beside the
 * tutorial screenshots; the repo tracks no raster images.
 */

export interface TeamMember {
  name: string;
  /** Shown under the name — the person's role on CVH. */
  role: string;
  /** Opened in a new tab when the card is clicked. */
  href: string;
  /**
   * Filename under `team/` on the CDN. Omit when we have no photo — the
   * card falls back to the shared avatar.
   */
  photo?: string;
}

export interface TeamSection {
  title: string;
  members: TeamMember[];
}

export interface FormerMember {
  name: string;
  role: string;
  href: string;
  /** Used to order the list; see FORMER_MEMBERS. */
  lastName: string;
}

/** Stands in for a member with no photo. */
const AVATAR_FALLBACK = "placeholder.png";

/** Resolves a `team/` asset to its absolute CDN URL. */
export function teamAssetUrl(filename: string): string {
  const cloudfrontUrl = import.meta.env.VITE_CLOUDFRONT_URL ?? "";
  return `${cloudfrontUrl}/team/${filename}`;
}

/** A member's photo, or the shared avatar when they have none. */
export function memberPhotoUrl(member: TeamMember): string {
  return teamAssetUrl(member.photo ?? AVATAR_FALLBACK);
}

export const TEAM_INTRO =
  "The Community Visualization Hub is built by developers, researchers, and designers from the HIDIVE (Humans in Data Integration, Visualization, and Exploration) Lab at Harvard Medical School and the Abdennur Lab at UMass Chan Medical School. Together, we create open tools that make it easier for the research community to explore, share, and build on biomedical data visualizations.";

/**
 * Sized by width, with height left to the artwork. The repo's HIDIVE SVG is a
 * wider lockup (8.3:1) than the cropped frame in the mockup, so pinning height
 * would blow it far past its intended width.
 */
export const LAB_LOGOS = [
  {
    alt: "HIDIVE Lab",
    href: "https://hidivelab.org/",
    // Committed to the repo as SVG, unlike the photos.
    src: "/hidive_logo.svg",
    width: 252,
  },
  {
    alt: "Abdennur Lab",
    href: "https://abdenlab.org/",
    src: teamAssetUrl("abdennur-lab.png"),
    width: 199,
  },
] as const;

export const TEAM_SECTIONS: TeamSection[] = [
  {
    title: "Leadership",
    members: [
      {
        name: "Nils Gehlenborg",
        role: "Principal Investigator",
        href: "https://hidivelab.org/team/members/nils-gehlenborg/",
        photo: "nils-gehlenborg.png",
      },
      {
        name: "Nezar Abdennur",
        role: "Principal Investigator",
        href: "https://abdenlab.org/",
        photo: "nezar-abdennur.jpg",
      },
    ],
  },
  {
    title: "Development, Research & Design",
    members: [
      {
        name: "John Conroy",
        role: "Senior Software Developer",
        href: "https://hidivelab.org/team/members/john-conroy/",
      },
      {
        name: "Conrad Bzura",
        role: "Research Software Engineer",
        href: "https://abdenlab.org/team.html",
        photo: "conrad-bzura.jpg",
      },
      {
        name: "Tiffany Liaw",
        role: "Senior UI/UX Designer",
        href: "https://hidivelab.org/team/members/tiffany-liaw/",
        photo: "tiffany-liaw.jpg",
      },
      {
        name: "Astrid van den Brandt",
        role: "Research Fellow",
        href: "https://hidivelab.org/team/members/astrid-vandenbrandt/",
        photo: "astrid-vandenbrandt.jpg",
      },
      {
        name: "Lisa Choy",
        role: "Director of Software Engineering",
        href: "https://hidivelab.org/team/members/lisa-choy/",
        photo: "lisa-choy.jpg",
      },
    ],
  },
  {
    title: "Operations",
    members: [
      {
        name: "Morgan Turner",
        role: "Director of Scientific Operations",
        href: "https://hidivelab.org/team/members/morgan-turner/",
        photo: "morgan-turner.jpg",
      },
      {
        name: "Vedat Yilmaz",
        role: "Project Manager",
        href: "https://abdenlab.org/team.html",
        photo: "vedat-yilmaz.png",
      },
      {
        name: "George Bandek",
        role: "Lab Coordinator",
        href: "https://hidivelab.org/team/members/george-bandek/",
      },
    ],
  },
];

/**
 * Ordered alphabetically by last name, per the handoff notes. `lastName` is
 * explicit rather than derived: "van den Brandt" and "L'yi" don't survive
 * splitting a display name on spaces.
 */
export const FORMER_MEMBERS: FormerMember[] = [
  {
    name: "David Kouřil",
    role: "Research Fellow",
    href: "https://hidivelab.org/team/members/david-kouril/",
    lastName: "Kouřil",
  },
  {
    name: "Sehi L'yi",
    role: "Research Fellow",
    href: "https://hidivelab.org/team/members/sehi-lyi/",
    lastName: "L'yi",
  },
  {
    name: "Yan Ma",
    role: "Project Coordinator",
    href: "https://hidivelab.org/team/members/yan-ma/",
    lastName: "Ma",
  },
  {
    name: "Priya Misner",
    role: "Senior UI/UX Designer",
    href: "https://hidivelab.org/team/members/priya-misner/",
    lastName: "Misner",
  },
];

export const FUNDING = [
  {
    label:
      "Community Data Hub for Integrative Visualization (National Institutes of Health - Common Fund)",
    href: "https://reporter.nih.gov/project-details/10993963#details",
  },
];
