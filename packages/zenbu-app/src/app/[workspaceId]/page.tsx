"use client";

// import { pluginRPC } from "../rpc";
import { trpc } from "src/lib/trpc";
import { useParams, useRouter } from "next/navigation";
import AppSwitcher from "src/components/option-tab-switcher";
import { Workspace } from "./workspace";
import { WorkspaceChat } from "./workspace-chat";

export default function Page() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [[workspace, _]] = trpc.useSuspenseQueries((t) => [
    t.workspace.getWorkspace({ workspaceId }),
    t.workspace.getTags({ workspaceId }),
  ]);

  // const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // useEffect(() => {
  //   setIsClient(true);
  // }, []);

  // if (!isClient) {
  //   return null;
  // }

  return (
    <>
      <AppSwitcher
        setProject={(_) => {
          router.push(`/`);
      }}
      />

      <Workspace workspace={workspace} />
      <WorkspaceChat />
    </>
  );
}
