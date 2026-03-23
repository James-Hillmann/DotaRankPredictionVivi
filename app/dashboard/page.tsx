import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session.steamId) redirect("/");

  return (
    <DashboardClient
      personaName={session.personaName ?? "Player"}
      avatarUrl={session.avatarUrl ?? ""}
    />
  );
}
