import { createFileRoute } from "@tanstack/react-router";
import ProfilePage from "../features/profile/components/ProfilePage";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});
