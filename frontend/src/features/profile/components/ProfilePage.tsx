import { useAuth0 } from "@auth0/auth0-react";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PencilSimple } from "@phosphor-icons/react";
import { useState } from "react";
import { useGetUser } from "@/features/navigation/api/useUser";
import { LoginButton } from "@/features/navigation/components/AuthButtons";
import AiUsage, { LABEL_SX } from "./AiUsage";
import UpdateNameDialog from "./UpdateNameDialog";

function ProfileDetails() {
  const { data: user, isError } = useGetUser();
  const [editingName, setEditingName] = useState(false);

  if (isError) {
    return (
      <Typography variant="body2">
        Your profile couldn’t be loaded. Please try again later.
      </Typography>
    );
  }
  if (!user) {
    return (
      <Stack spacing={2} aria-busy="true" aria-label="Loading your profile">
        <Skeleton width={160} />
        <Skeleton width={220} />
      </Stack>
    );
  }

  const name = `${user.first_name} ${user.last_name}`.trim();

  return (
    <>
      <Stack spacing={1}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="body2" sx={LABEL_SX} component="h2">
            Name
          </Typography>
          <IconButton
            aria-label="Update name"
            size="small"
            onClick={() => setEditingName(true)}
          >
            <PencilSimple size={16} />
          </IconButton>
        </Stack>
        <Typography variant="body2">{name || "—"}</Typography>
      </Stack>
      <Stack spacing={1}>
        <Typography variant="body2" sx={LABEL_SX} component="h2">
          Email
        </Typography>
        <Typography variant="body2">{user.email}</Typography>
      </Stack>
      <Divider />
      <AiUsage />
      {editingName && (
        <UpdateNameDialog
          firstName={user.first_name}
          lastName={user.last_name}
          onClose={() => setEditingName(false)}
        />
      )}
    </>
  );
}

export default function ProfilePage() {
  const { isAuthenticated, isLoading } = useAuth0();

  return (
    <Paper
      variant="outlined"
      square
      sx={{ p: 4, my: 4, display: "flex", flexDirection: "column", gap: 2 }}
    >
      <Typography variant="h1" sx={{ fontSize: 32, lineHeight: "40px" }}>
        Your Profile
      </Typography>
      {isLoading || isAuthenticated ? (
        <ProfileDetails />
      ) : (
        <Stack spacing={2} alignItems="flex-start">
          <Typography variant="body2">Log in to view your profile.</Typography>
          <LoginButton variant="contained" />
        </Stack>
      )}
    </Paper>
  );
}
