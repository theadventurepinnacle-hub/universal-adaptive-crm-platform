import CrmApp from "@/components/crm-app";
import { getWorkspaceData } from "@/lib/crm-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const workspace = await getWorkspaceData("insurance");
  return <CrmApp initialData={workspace} />;
}
