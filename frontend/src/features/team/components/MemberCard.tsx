import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { memberPhotoUrl, type TeamMember } from "../team";

/**
 * Picture border. The design calls this `primary/dark`, which has no
 * equivalent in the MUI palette yet — `grey.800` (#4E5A63) is noticeably
 * lighter. Using the literal keeps the page faithful; worth promoting to a
 * theme token if the colour shows up again.
 */
const PICTURE_BORDER = "#3A4247";

/** Designed card width. The grid caps its columns to this too. */
export const CARD_WIDTH = 250;

export default function MemberCard({ member }: { member: TeamMember }) {
  return (
    <Stack
      component={Link}
      href={member.href}
      target="_blank"
      rel="noopener noreferrer"
      spacing={1}
      alignItems="flex-start"
      sx={{
        textDecoration: "none",
        color: "inherit",
        // Belt and braces with the grid's column cap: the card never
        // exceeds its designed width, only shrinks on narrow screens.
        maxWidth: CARD_WIDTH,
        // Hover raises the picture and underlines the name, per the
        // handoff notes — the underline isn't in the mockup.
        "&:hover .MemberCard-picture": {
          boxShadow: 4,
        },
        "&:hover .MemberCard-name": {
          textDecoration: "underline",
        },
      }}
    >
      <Box
        className="MemberCard-picture"
        sx={{
          width: "100%",
          aspectRatio: "1 / 1",
          border: `1px solid ${PICTURE_BORDER}`,
          overflow: "hidden",
          boxShadow: 0,
          transition: (theme) =>
            theme.transitions.create("box-shadow", {
              duration: theme.transitions.duration.short,
            }),
        }}
      >
        <Box
          component="img"
          src={memberPhotoUrl(member)}
          alt=""
          loading="lazy"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </Box>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography component="span" variant="h6" className="MemberCard-name">
          {member.name}
        </Typography>
        <ArrowSquareOut size={20} color="#4E5A63" weight="regular" />
      </Stack>
      <Typography component="span" variant="body2">
        {member.role}
      </Typography>
    </Stack>
  );
}
