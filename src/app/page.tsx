import CrmApp from "@/components/crm-app";
import LoginScreen from "@/components/login-screen";
import { getAuthenticatedSession } from "@/lib/auth";
import { getWorkspaceData } from "@/lib/crm-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!(await getAuthenticatedSession())) return <LoginScreen />;
  const workspace = await getWorkspaceData("adventure");
  return <CrmApp initialData={workspace} />;
}
