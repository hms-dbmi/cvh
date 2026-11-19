import Alert, { type AlertProps } from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  CheckCircle,
  Clock,
  CursorClick,
  Gauge,
  Info,
  Prohibit,
  Warning,
} from "@phosphor-icons/react";
import { format, parseISO } from "date-fns";
import type { ReactElement, ReactNode } from "react";
import {
  useGetYacAccess,
  useRequestYacAccess,
  useYacSignIn,
  useYacUsage,
  YacSignInRequired,
  type YacUsage,
} from "../api/useYacAccess";

const CONTACT_EMAIL = "hidive@hms.harvard.edu";
// The design's labels: body text at medium weight. gosling-designer-vec's
// stylesheet uppercases every h2 globally, so undo that here.
export const LABEL_SX = { fontWeight: 500, textTransform: "none" } as const;
// Usage at or above this share of the monthly credits is "near limit".
export const NEAR_LIMIT_PERCENT = 85;

const COLORS = {
  info: "#3B73E0",
  warning: "#E18240",
  success: "#2E9E5B",
  neutral: "#DBE1E4",
  neutralText: "#3A4247",
  bodyText: "#19305E",
};

function ContactUs({ children = "Contact us" }: { children?: ReactNode }) {
  return (
    <Link href={`mailto:${CONTACT_EMAIL}`} sx={{ color: COLORS.info }}>
      {children}
    </Link>
  );
}

function StatusChip({
  label,
  icon,
  color,
}: {
  label: string;
  icon: ReactElement;
  color?: string;
}) {
  return (
    <Chip
      size="small"
      icon={icon}
      label={label}
      sx={{
        height: 20,
        gap: 0.5,
        pl: 1,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.55px",
        backgroundColor: color ?? COLORS.neutral,
        color: color ? "#fff" : COLORS.neutralText,
        "& .MuiChip-icon": { m: 0, color: "inherit" },
        "& .MuiChip-label": { pl: 0, pr: 1.25 },
      }}
    />
  );
}

function Banner({
  severity,
  title,
  children,
  action,
}: {
  severity: "info" | "warning";
  title: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  const color = COLORS[severity];
  const icon: AlertProps["icon"] =
    severity === "info" ? <Info size={20} /> : <Warning size={20} />;
  return (
    <Alert
      variant="outlined"
      severity={severity}
      icon={icon}
      sx={{
        width: "100%",
        borderRadius: "8px",
        borderColor: color,
        backgroundColor: "background.paper",
        color: COLORS.bodyText,
        "& .MuiAlert-icon": { color },
      }}
    >
      <AlertTitle sx={{ fontSize: 14, fontWeight: 500, color: "#212121" }}>
        {title}
      </AlertTitle>
      {children}
      {action && <Stack pt={1}>{action}</Stack>}
    </Alert>
  );
}

const bannerButtonSx = {
  alignSelf: "flex-start",
  borderRadius: "8px",
  px: 1.5,
  backgroundColor: COLORS.neutralText,
};

// Whole percent, 0–100, whatever the service sends.
function usedPercent(usage: YacUsage) {
  return Math.min(100, Math.max(0, Math.floor(usage.percent_used)));
}

function CreditUsageBar({ usage }: { usage: YacUsage }) {
  const percent = usedPercent(usage);
  let helper = "Credits renew every month.";
  if (percent >= 100) {
    helper = "You’ve used all your credits for this cycle.";
  } else if (percent >= NEAR_LIMIT_PERCENT) {
    helper = `You’ve used ${percent}% of your credits.`;
  }
  return (
    <Stack spacing={1} sx={{ width: "100%", maxWidth: 360 }}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="body2" sx={LABEL_SX} id="credits-label">
          Credits
        </Typography>
        <Typography variant="body2" sx={{ fontSize: 12 }}>
          {percent}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={percent}
        aria-labelledby="credits-label"
        sx={{
          height: 6,
          borderRadius: "3px",
          backgroundColor: COLORS.neutral,
          "& .MuiLinearProgress-bar": {
            borderRadius: "3px",
            backgroundColor:
              percent >= NEAR_LIMIT_PERCENT ? COLORS.warning : COLORS.success,
          },
        }}
      />
      <Typography variant="caption">{helper}</Typography>
    </Stack>
  );
}

export function UsageUnavailable({
  error,
  signIn,
}: {
  error: Error;
  signIn: () => void;
}) {
  if (error instanceof YacSignInRequired) {
    return (
      <Stack spacing={1} alignItems="flex-start">
        <Typography variant="body2">
          Sign in to the AI service to see your usage.
        </Typography>
        <Button variant="outlined" onClick={signIn}>
          Sign In
        </Button>
      </Stack>
    );
  }
  return (
    <Typography variant="body2">
      Your AI usage is unavailable right now. If this continues, <ContactUs />.
    </Typography>
  );
}

// Until usage loads it's just Active. If YAC refused it (say, the Auth0
// role is missing although Django says approved), say so.
function approvedContent(
  usage: YacUsage | undefined,
  usageError: Error | null,
  signIn: () => void,
) {
  if (!usage) {
    return {
      chip: (
        <StatusChip
          label="Active"
          icon={<CheckCircle size={12} />}
          color={COLORS.success}
        />
      ),
      body: usageError ? (
        <UsageUnavailable error={usageError} signIn={signIn} />
      ) : null,
    };
  }

  const percent = usedPercent(usage);
  const renews = <strong>{format(parseISO(usage.renews_on), "MMMM d")}</strong>;
  const bar = <CreditUsageBar usage={usage} />;

  if (percent >= 100) {
    return {
      chip: (
        <StatusChip
          label="Limit Reached"
          icon={<Warning size={12} />}
          color={COLORS.warning}
        />
      ),
      // shortcut: no "Request Additional Credits" button; credit requests
      // are tabled. Add it with the backend for them.
      body: (
        <>
          <Banner severity="warning" title="AI Credit Limit Reached">
            Your credits renew on {renews}. If you need more before then, you
            can request additional credits. Requests are reviewed by us and
            depend on available resources.
          </Banner>
          {bar}
        </>
      ),
    };
  }
  if (percent >= NEAR_LIMIT_PERCENT) {
    return {
      chip: (
        <StatusChip
          label="Near Limit"
          icon={<Warning size={12} />}
          color={COLORS.warning}
        />
      ),
      body: (
        <>
          <Banner severity="warning" title="AI Credit Near Limit">
            You’ve used {percent}% of your credits. Your credits renew on{" "}
            {renews}. If you run out, you can request additional credits
            depending on available resources.
          </Banner>
          {bar}
        </>
      ),
    };
  }
  return {
    chip: (
      <StatusChip
        label="Active"
        icon={<CheckCircle size={12} />}
        color={COLORS.success}
      />
    ),
    body: bar,
  };
}

// Also used by the Data Library's Explore tab, which shows the same banners.
export function useAiUsageContent() {
  const { data: access, isError } = useGetYacAccess();
  const { mutate, isPending } = useRequestYacAccess();
  // Set up on every render, but only fetches for approved users.
  const { data: usage, error: usageError } = useYacUsage(
    access?.status === "approved",
  );
  const signIn = useYacSignIn();

  if (!access) {
    return isError
      ? {
          chip: null,
          body: (
            <Typography variant="body2">
              AI usage is unavailable right now. Please try again later.
            </Typography>
          ),
        }
      : null;
  }

  const notEnabled = (
    <StatusChip label="Not Enabled" icon={<Prohibit size={12} />} />
  );

  switch (access.status) {
    case "none":
      return {
        chip: notEnabled,
        body: (
          <Banner
            severity="info"
            title="AI features aren’t enabled for your account."
            action={
              <Button
                variant="contained"
                startIcon={<CursorClick size={20} />}
                disabled={isPending}
                onClick={() => mutate({})}
                sx={bannerButtonSx}
              >
                Request Access
              </Button>
            }
          >
            Request access to use Community Visualization Hub’s AI resources.
          </Banner>
        ),
      };
    case "pending":
      return {
        chip: (
          <StatusChip
            label="Pending Review"
            icon={<Clock size={12} />}
            color={COLORS.info}
          />
        ),
        body: (
          <Banner
            severity="info"
            title={`Access request sent on ${
              access.requested_at
                ? format(parseISO(access.requested_at), "MMM d, yyyy")
                : "…"
            }`}
            action={
              <Button
                variant="contained"
                startIcon={<CheckCircle size={20} />}
                disabled
                sx={bannerButtonSx}
              >
                Access Requested
              </Button>
            }
          >
            Requests are usually reviewed within 7 business days. Haven’t heard
            back by then? <ContactUs />.
          </Banner>
        ),
      };
    case "approved":
      return approvedContent(usage, usageError, signIn);
    default:
      // Declined and revoked look the same: no access, contact us.
      return {
        chip: notEnabled,
        body: (
          <Banner severity="warning" title="No Access to AI Resources">
            You have been denied access to the Community Visualization Hub’s AI
            resource. If you believe this to be a mistake,{" "}
            <ContactUs>Contact Us</ContactUs>.
          </Banner>
        ),
      };
  }
}

export default function AiUsage() {
  const content = useAiUsageContent();
  if (!content) return null;
  return (
    <Stack component="section" spacing={2} aria-labelledby="ai-usage-heading">
      <Stack direction="row" spacing={1} alignItems="center">
        <Gauge size={16} />
        <Typography
          variant="body2"
          sx={LABEL_SX}
          component="h2"
          id="ai-usage-heading"
        >
          AI Usage
        </Typography>
        {content.chip}
      </Stack>
      {content.body}
    </Stack>
  );
}
