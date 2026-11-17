import CrmApp from "@/components/crm-app";
import LoginScreen from "@/components/login-screen";
import { getAuthenticatedSession } from "@/lib/auth";
import { getWorkspaceData } from "@/lib/crm-data";
import type { IndustryKey } from "@/lib/crm-types";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!(await getAuthenticatedSession())) return <LoginScreen />;
  const savedWorkspace = (await cookies()).get("tap_crm_workspace")?.value;
  const slug: IndustryKey = savedWorkspace === "homigo" ? "homigo" : "adventure";
  const workspace = await getWorkspaceData(slug);
  return <CrmApp initialData={workspace} />;
}
