"use client";

// import { pluginRPC } from "../rpc";
import { trpc } from "src/lib/trpc";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppSwitcher from "src/components/option-tab-switcher";
import { Workspace } from "./workspace";

export default function Page() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const [[workspace]] = trpc.useSuspenseQueries((t) => [
    t.workspace.getWorkspace({ workspaceId }),
  ]);

  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <>
      <AppSwitcher
        setProject={(project) => {
          router.push(`/`);
        }}
      />
      <div
        style={{
          backgroundImage: workspace.backgroundImageUrl
            ? `url(${workspace.backgroundImageUrl})`
            : "",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        className="h-[100vh] w-[100vw] relative py-2"
      >
        <Workspace workspaceId={workspace.workspaceId} />
      </div>
    </>
  );
}
