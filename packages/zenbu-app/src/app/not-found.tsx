"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "src/components/ui/button";
import { TopBar } from "./[workspaceId]/workspace-top-bar";
import { cn } from "src/lib/utils";
import { WorkspaceContext } from "./v2/context";

export default function NotFound() {
  const router = useRouter();

  return (
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

      <WorkspaceContext
        value={{
          setWorkspaceId: () => {},
          workspaceId: "home",
        }}
      >
        <TopBar />
      </WorkspaceContext>
      <div className="flex w-full justify-between">
        <div className="h-screen w-screen flex flex-col items-center justify-start pt-14 gap-4">
          <Image
            src="/mascot.png"
            width={400}
            height={400}
            alt="Zenbu mascot"
          />

          <div className="flex flex-col items-center gap-2 -mt-4">
            <h1 className="text-2xl font-bold">Page Not Found</h1>
            <p className="text-zinc-400">
              The page you are looking for does not exist.
            </p>
          </div>

          <Button variant="outline" onClick={() => router.push("/home")}>
            Return Home
          </Button>
        </div>
        {/* <Workspace workspace={workspace} />
      <WorkspaceChat /> */}
      </div>
      {/* <BottomBar/> */}
    </div>
  );
}
