"use client";

// import { pluginRPC } from "../rpc";
import { trpc } from "src/lib/trpc";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppSwitcher from "src/components/option-tab-switcher";
import { Workspace } from "./workspace";
import { MockWorkspace } from "./mock-workspace";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "src/components/ui/button";
import { ImageIcon } from "lucide-react";
import { useUploadBackgroundImage } from "./hooks";
import { cn } from "src/lib/utils";

export default function Page() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const [[workspace, _]] = trpc.useSuspenseQueries((t) => [
    t.workspace.getWorkspace({ workspaceId }),
    t.workspace.getTags({ workspaceId }),
  ]);

  const [isClient, setIsClient] = useState(false);
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
      <div
        //   bg-gradient-to-t from-black to-[#0d0d0d72]
        style={
          {
            // backgroundImage: workspace.backgroundImageUrl
            //   ? `url(${workspace.backgroundImageUrl})`
            //   : "",
            // backgroundSize: "cover",
            // backgroundPosition: "center",
            // backgroundRepeat: "no-repeat",
          }
        }
        className="flex flex-col h-[100vh] w-[100vw] relative py-2 
        
        
        


 bg-gradient-to-t from-black to-[#0d0d0d72]
        
        "
      >
        <TopBar />
        <div className="flex w-full">
          <Workspace workspace={workspace} />

          <div className="w-[400px] p-4 full">
            <div className="border border-[#131313] rounded-lg h-full bg-background/50   bg-gradient-to-t from-[#0b0d0fa5] to-[#0b0d0f00]"></div>
          </div>
        </div>

        {/* <MockWorkspace workspace={workspace} /> */}
      </div>
    </>
  );
}

const TopBar = () => {
  const workspaces = [
    "home",
    "work",
    "games",
    "reproductions",
    "reusable",
    "os",
    "productivity",
    "devtools",
    "packages",
  ];

  const { workspaceId } = useParams<{ workspaceId: string }>();
  const uploadBackgroundImage = useUploadBackgroundImage();

  return (
    <div className="flex items-center">
      <div
        className="flex rounded-md w-fit mx-4 h-[35px] items-center gap-x-1"
        // style={{
        //   boxShadow:
        //     "0 3px 6px -2px rgba(0,0,0,0.2), 0 1px 3px -1px rgba(0,0,0,0.1), inset 0 1px 5px rgba(0,0,0,0.2)",
        //   background: "linear-gradient(135deg, #0a0a0a, #121212)",
        // }}
      >
        {workspaces.map((name) => (
          <div key={name} className="flex flex-col items-start relative">
            <Link
              href={`/${name}`}
              className={cn([
                `inline-flex items-center text-xs justify-center h-8 px-3 py-1  leading-tight hover:bg-accent/50 bg-black rounded-sm`,

                name === workspaceId && "border-[#141414] ",
              ])}
            >
              {name}
            </Link>
            {name === workspaceId && (
              <motion.div
                transition={{
                  duration: 0.2,
                }}
                layoutId="link-underline"
                className="h-full absolute w-full rounded-sm bg-white/10 z-20"
              ></motion.div>
            )}
          </div>
        ))}
      </div>
      <div
        className="flex bg-background rounded-md w-fit ml-auto mr-2"
        style={{
          boxShadow:
            "0 3px 6px -2px rgba(0,0,0,0.2), 0 1px 3px -1px rgba(0,0,0,0.1), inset 0 1px 5px rgba(0,0,0,0.2)",
          background: "linear-gradient(135deg, #0a0a0a, #121212)",
        }}
      >
        <Link
          href={"/marketplace"}
          className={`inline-flex items-center rounded-md transition-all bg-black text-sm justify-center h-8 px-4 hover:bg-accent/50 text-muted-foreground hover:text-foreground`}
        >
          personal marketplace
        </Link>
        <Button
          onClick={async () => {
            uploadBackgroundImage.upload();
          }}
          className="inline-flex items-center bg-black text-sm justify-center rounded-md transition-all h-8 px-4 hover:bg-accent/50 text-muted-foreground hover:text-foreground"
          variant="ghost"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
