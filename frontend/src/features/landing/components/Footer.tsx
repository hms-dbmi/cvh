import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid2";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowSquareOut } from "@phosphor-icons/react";

interface ExternalLink {
  label: string;
  href: string;
}

const BUILT_WITH: ExternalLink[] = [
  { label: "Gosling", href: "https://gosling-lang.org/" },
  { label: "Vitessce", href: "http://vitessce.io/" },
];

const HIDIVE_TEAM: ExternalLink[] = [
  {
    label: "Nils Gehlenborg",
    href: "https://hidivelab.org/team/members/nils-gehlenborg/",
  },
  {
    label: "John Conroy",
    href: "https://hidivelab.org/team/members/john-conroy/",
  },
  {
    label: "Priya Misner",
    href: "https://hidivelab.org/team/members/priya-misner/",
  },
  {
    label: "Astrid van den Brandt",
    href: "https://hidivelab.org/team/members/astrid-vandenbrandt/",
  },
];

const CONTRIBUTORS: ExternalLink[] = [
  { label: "Nezar Abdennur", href: "https://abdenlab.org/team.html" },
  { label: "Conrad Burza", href: "https://abdenlab.org/team.html" },
];

function FooterLink({ link }: { link: ExternalLink }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      component={Link}
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      sx={{ textDecoration: "none", color: "inherit" }}
    >
      <Typography component="span" variant="body1">
        {link.label}
      </Typography>
      <ArrowSquareOut size={24} color="#4E5A63" weight="regular" />
    </Stack>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title?: string;
  links: ExternalLink[];
}) {
  return (
    <Stack spacing={2}>
      <Typography
        component="h3"
        variant="h6"
        sx={{ visibility: title ? "visible" : "hidden" }}
        aria-hidden={!title}
      >
        {title ?? " "}
      </Typography>
      {links.map((l) => (
        <FooterLink key={l.label} link={l} />
      ))}
    </Stack>
  );
}

function Footer() {
  return (
    <Box width="100%" mt={8}>
      <Box width="90%" mx="auto">
        <Grid container spacing={4} pb={6}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FooterColumn title="Built With" links={BUILT_WITH} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FooterColumn title="Team" links={HIDIVE_TEAM} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FooterColumn links={CONTRIBUTORS} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Stack spacing={2}>
              <Typography component="h3" variant="h6">
                Contact Us
              </Typography>
              <Typography component="p" variant="body1" color="#4E5A63">
                Email{" "}
                <Link
                  href="mailto:hidive@hms.harvard.edu"
                  sx={{ color: "inherit" }}
                >
                  hidive@hms.harvard.edu
                </Link>{" "}
                to provide feedback, report a bug or submit a feature request.
              </Typography>
            </Stack>
          </Grid>
        </Grid>
        <Divider />
        <Typography
          component="p"
          variant="body2"
          color="#4E5A63"
          textAlign="center"
          py={3}
        >
          Copyright © {new Date().getFullYear()}{" "}
          <Link
            href="https://hidivelab.org/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "inherit" }}
          >
            HIDIVE Lab
          </Link>{" "}
          @ Harvard Medical School.
        </Typography>
      </Box>
    </Box>
  );
}

export default Footer;
