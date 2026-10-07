import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowSquareOut } from "@phosphor-icons/react";
import {
  FORMER_MEMBERS,
  FUNDING,
  LAB_LOGOS,
  TEAM_INTRO,
  TEAM_SECTIONS,
} from "../team";
import MemberCard, { CARD_WIDTH } from "./MemberCard";

/** A name plus the external-link affordance, used by the text-only lists. */
function ExternalEntry({ label, href }: { label: string; href: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        variant="body1"
        sx={{
          color: "text.primary",
          textDecoration: "none",
          "&:hover": { textDecoration: "underline" },
        }}
      >
        {label}
      </Link>
      <ArrowSquareOut size={20} color="#4E5A63" weight="regular" />
    </Stack>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Stack spacing={2} alignItems="flex-start" width="100%">
      {/* `textTransform: none` is the same defensive override HubBlurb and
          TutorialArticle use — something upstream uppercases <h2>s. */}
      <Typography variant="h2" sx={{ textTransform: "none" }}>
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

export default function TeamPage() {
  return (
    <Stack spacing={4} alignItems="flex-start" sx={{ pt: 4 }}>
      {/* Doubled from the default rhythm: the title, the description and the
          lab logos each need more air than a run of body copy, and `pb` adds
          to the outer gap before the first divider. */}
      <Stack spacing={4} alignItems="flex-start" width="100%" sx={{ pb: 2 }}>
        <Typography variant="h1">Team</Typography>
        <Typography variant="body1">{TEAM_INTRO}</Typography>
        <Stack
          direction="row"
          spacing={3}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          {LAB_LOGOS.map((logo) => (
            <Link
              key={logo.alt}
              href={logo.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={logo.alt}
              sx={{ display: "inline-flex" }}
            >
              <Box
                component="img"
                src={logo.src}
                alt={logo.alt}
                sx={{
                  width: logo.width,
                  height: "auto",
                  maxWidth: "100%",
                  display: "block",
                }}
              />
            </Link>
          ))}
        </Stack>
      </Stack>

      {TEAM_SECTIONS.map((section) => (
        <Box key={section.title} width="100%">
          <Divider sx={{ mb: 4 }} />
          <Section title={section.title}>
            <Box
              sx={{
                display: "grid",
                width: "100%",
                // Five across at desktop, as designed, collapsing on the
                // way down rather than letting 250px cards overflow.
                // Columns are capped at the card's designed width so the
                // 32px gap holds on wide screens instead of the row
                // stretching and pushing the cards apart.
                gridTemplateColumns: {
                  xs: `repeat(2, minmax(0, ${CARD_WIDTH}px))`,
                  sm: `repeat(3, minmax(0, ${CARD_WIDTH}px))`,
                  md: `repeat(4, minmax(0, ${CARD_WIDTH}px))`,
                  lg: `repeat(5, minmax(0, ${CARD_WIDTH}px))`,
                },
                justifyContent: "start",
                columnGap: 4,
                rowGap: 2,
              }}
            >
              {section.members.map((member) => (
                <MemberCard key={member.name} member={member} />
              ))}
            </Box>
          </Section>
        </Box>
      ))}

      <Box width="100%">
        <Divider sx={{ mb: 4 }} />
        <Section title="Former Members">
          <Stack spacing={2} alignItems="flex-start">
            {FORMER_MEMBERS.map((member) => (
              <ExternalEntry
                key={member.name}
                label={`${member.name} (${member.role})`}
                href={member.href}
              />
            ))}
          </Stack>
        </Section>
      </Box>

      <Box width="100%">
        <Divider sx={{ mb: 4 }} />
        <Section title="Funding">
          <Stack spacing={2} alignItems="flex-start">
            {FUNDING.map((award) => (
              <ExternalEntry
                key={award.href}
                label={award.label}
                href={award.href}
              />
            ))}
          </Stack>
        </Section>
      </Box>
    </Stack>
  );
}
