import { useAuth0 } from "@auth0/auth0-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import MUILink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowSquareOut, EnvelopeSimple } from "@phosphor-icons/react";
import PageContainer from "../../../components/PageContainer";
import { Link } from "../../navigation/components/Links";

/** Brand mark shown before an entry's label. */
type EntryLogo = "github" | "gosling" | "vitessce";

interface FooterEntry {
  label: string;
  /** External destination. Opens in a new tab with the arrow icon. */
  href?: string;
  /** Internal route, rendered through the router. Mutually exclusive with href. */
  to?: string;
  /** Route params, for routes that take them. */
  params?: Record<string, string>;
  logo?: EntryLogo;
  /** Defaults to the arrow for external entries; `none` for internal ones. */
  trailing?: "arrow" | "envelope" | "none";
}

interface FooterCategory {
  title: string;
  entries: FooterEntry[];
}

const ICON_SIZE = 20;
const ICON_COLOR = "#4E5A63";
/** `primary/dark` in the design; not yet a palette token. */
const BUTTON_BG = "#3A4247";

const LOGO_SRC: Record<EntryLogo, string> = {
  // The official Invertocat mark, from GitHub's own Primer octicons.
  // Phosphor's GithubLogo is the cat without the surrounding circle, so it
  // doesn't match the design.
  github: "/github_logo.svg",
  gosling: "/gosling.svg",
  vitessce: "/vitessce_logo.svg",
};

/**
 * Footer columns.
 *
 * YAC sits under "Built With" in the mockup, but only to reserve its place —
 * it isn't integrated yet, so it's left out until it is.
 */
const CATEGORIES: FooterCategory[] = [
  {
    title: "About",
    entries: [
      { label: "Team", to: "/team" },
      {
        label: "Tutorials",
        to: "/tutorials/{-$slug}",
        params: { slug: "getting-started" },
      },
      {
        label: "Github",
        href: "https://github.com/hms-dbmi/cvh",
        logo: "github",
      },
    ],
  },
  {
    title: "Built With",
    entries: [
      { label: "Gosling", href: "https://gosling-lang.org/", logo: "gosling" },
      { label: "Vitessce", href: "https://vitessce.io/", logo: "vitessce" },
    ],
  },
  {
    title: "Funding",
    entries: [
      {
        label: "NIH Common Fund Data Ecosystem",
        href: "https://commonfund.nih.gov/dataecosystem",
      },
      {
        label: "HIDIVE Funding",
        href: "https://hidivelab.org/research/funding/",
      },
      {
        label: "NIH RePORTER",
        href: "https://reporter.nih.gov/project-details/10993963",
      },
    ],
  },
  {
    title: "Contact Us",
    entries: [
      {
        label: "hidive@hms.harvard.edu",
        href: "mailto:hidive@hms.harvard.edu",
        trailing: "envelope",
      },
      {
        label: "Give Feedback",
        href: "https://github.com/hms-dbmi/cvh/issues/new/choose",
      },
    ],
  },
];

function EntryLogoMark({ logo }: { logo: EntryLogo }) {
  return (
    <Box
      component="img"
      src={LOGO_SRC[logo]}
      alt=""
      sx={{ width: ICON_SIZE, height: ICON_SIZE, objectFit: "contain" }}
    />
  );
}

const LINK_SX = {
  color: "text.primary",
  textDecoration: "none",
  "&:hover": { textDecoration: "underline" },
} as const;

function Entry({ entry }: { entry: FooterEntry }) {
  const trailing = entry.trailing ?? (entry.href ? "arrow" : "none");
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {entry.logo && <EntryLogoMark logo={entry.logo} />}
      {entry.to ? (
        <Link to={entry.to} params={entry.params} variant="body1" sx={LINK_SX}>
          {entry.label}
        </Link>
      ) : (
        <MUILink
          href={entry.href}
          target="_blank"
          rel="noopener noreferrer"
          variant="body1"
          sx={LINK_SX}
        >
          {entry.label}
        </MUILink>
      )}
      {trailing === "arrow" && (
        <ArrowSquareOut size={ICON_SIZE} color={ICON_COLOR} weight="regular" />
      )}
      {trailing === "envelope" && (
        <EnvelopeSimple size={ICON_SIZE} color={ICON_COLOR} weight="regular" />
      )}
    </Stack>
  );
}

function Category({ category }: { category: FooterCategory }) {
  return (
    <Stack spacing={2} alignItems="flex-start" sx={{ minWidth: 150 }}>
      <Typography component="h2" variant="overline">
        {category.title}
      </Typography>
      {category.entries.map((entry) => (
        <Entry key={entry.label} entry={entry} />
      ))}
    </Stack>
  );
}

function Footer() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();

  return (
    // Full-bleed outer so any footer backdrop spans the viewport; the inner
    // container keeps the columns aligned with page content.
    <Box
      component="footer"
      // The gap above the rule is the footer's own padding, so it carries the
      // footer's background and no page backdrop shows through as a seam. The
      // rule sits outside PageContainer so it spans the full width, matching
      // the design: 64px of space, the rule, then 32px to the columns.
      sx={{ bgcolor: "background.paper", pt: 16, pb: 4 }}
    >
      <Divider />
      <PageContainer component={Stack} sx={{ gap: 4, pt: 4 }}>
        <Stack direction="row" flexWrap="wrap" gap={3} alignItems="flex-start">
          <Stack spacing={2} alignItems="flex-start" sx={{ width: 297 }}>
            <Typography variant="h1" sx={{ textTransform: "none" }}>
              The
              <br />
              Community Visualization Hub
            </Typography>
            {/* Signed-in users already have somewhere to go, so the
                call to action is only for signed-out visitors. */}
            {!isAuthenticated && (
              <Button
                onClick={() => loginWithRedirect()}
                sx={{
                  bgcolor: BUTTON_BG,
                  color: "common.white",
                  borderRadius: "10px",
                  px: "22px",
                  py: "16px",
                  textTransform: "none",
                  "&:hover": { bgcolor: BUTTON_BG, opacity: 0.9 },
                }}
              >
                Get Started
              </Button>
            )}
          </Stack>
          {CATEGORIES.map((category) => (
            <Category key={category.title} category={category} />
          ))}
        </Stack>
        {/* Extra room above the copyright rule; the Stack's gap alone
            left it crowded against the columns. */}
        <Divider sx={{ mt: 4 }} />
        <Typography component="p" variant="caption" textAlign="center">
          Copyright © {new Date().getFullYear()}{" "}
          <MUILink
            href="https://hidivelab.org/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "inherit" }}
          >
            HIDIVE Lab
          </MUILink>{" "}
          @ Harvard Medical School.
        </Typography>
      </PageContainer>
    </Box>
  );
}

export default Footer;
