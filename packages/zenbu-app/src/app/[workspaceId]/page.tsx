"use client";

// import { pluginRPC } from "../rpc";
import { trpc } from "src/lib/trpc";
import { useParams, useRouter } from "next/navigation";
import AppSwitcher from "src/components/option-tab-switcher";

import { Workspace } from "./workspace";
import { WorkspaceChat } from "./workspace-chat";
import { TopBar } from "./workspace-top-bar";
import { cn } from "src/lib/utils";

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
      <div
        className={cn([
          "flex flex-col h-[100vh] w-[100vw] relative py-2",
          "bg-gradient-to-b from-[#080808cb] to-[#11111172]",
        ])}
      >
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "32px 32px",
          }}
        />

        <TopBar />
        <div className="flex w-full justify-between">
          <AppSwitcher
            setProject={(_) => {
              router.push(`/`);
            }}
          />

          <Workspace workspace={workspace} />
          {/* <WorkspaceChat /> */}
          {/* <Workspace workspace={workspace} />
          <WorkspaceChat /> */}
        </div>
        {/* <BottomBar/> */}
      </div>
    </>
  );
}
