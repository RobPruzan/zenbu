"use client";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

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
import { ImageIcon, PanelRightClose, SendIcon, SquarePen } from "lucide-react";
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
        className="flex flex-col h-[100vh] w-[100vw] relative py-2  bg-gradient-to-t from-black to-[#0d0d0d72]"
      >
        <TopBar />
        <div className="flex w-full">
          <Workspace workspace={workspace} />
          <div className="w-[400px] p-4 full">
            <div className="border border-[#131313] rounded-lg h-full bg-background/50 flex flex-col justify-end  bg-gradient-to-t from-[#0b0d0fa5] to-[#0b0d0f00]">
              <div className="mb-auto w-full flex items-center px-2 py-2 justify-between ">
                <Button variant={'ghost'} size={'icon'}>

                <SquarePen size={18} color="#686767" />
                </Button>
                <Button variant={'ghost'} size={'icon'}>

                <PanelRightClose size={18} color="#686767" />
                </Button>
</div>

           <MockChatTextArea/>   
            
            </div>
          </div>
        </div>
        {/* <MockWorkspace workspace={workspace} /> */}
      </div>
    </>
  );
}

const MockChatTextArea = () => (
  <div className="px-4 pb-4 relative w-full">
    <div className="rounded-lg bg-accent/5 border border-border/60 shadow-lg overflow-hidden w-full transition-all duration-300 hover:shadow-xl">
      <div className="flex flex-col text-xs">
        <div className="relative min-h-[50px] w-full bg-background/5">
          {/* <ChatTextArea /> */}
          <div className="w-full text-[13px] chat-input text-foreground caret-foreground font-light leading-relaxed min-h-[50px] pt-2.5 pl-3 pr-4 pb-2 focus:outline-none">

          </div>
        </div>

        <div className="flex items-center justify-end px-4 py-2 border-t border-border/60 bg-accent/5">
          <div className="flex items-center gap-2">
            <button
              // onClick={sendMessage}
              // disabled={!chatControls.state.input.trim()}
              className={cn(
                "inline-flex items-center justify-center px-3.5 py-1.5 rounded-sm text-[11px] font-light",
                "bg-accent/10 border border-border/60 hover:bg-accent/20 text-foreground",
                "transition-all duration-300",
                // !chatControls.state.input.trim() &&
                //   "opacity-50 cursor-not-allowed",
              )}
            >
              <span>Send</span>
              <SendIcon className="ml-1.5 h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

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
        className="flex bg-black rounded-md w-fit ml-auto mr-2"
        style={{
          boxShadow:
            "0 3px 6px -2px rgba(0,0,0,0.2), 0 1px 3px -1px rgba(0,0,0,0.1), inset 0 1px 5px rgba(0,0,0,0.2)",
          // background: "linear-gradient(135deg, #0a0a0a, #121212)",
        }}
      >
        <CpuProcessChart />
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

const CpuProcessChart = () => {
  const [data, setData] = useState<any[]>([]);
  const [cpuUsage, setCpuUsage] = useState(25);
  const [memoryUsed, setMemoryUsed] = useState(377);
  const [memoryAvailable, setMemoryAvailable] = useState(47.5);

  useEffect(() => {
    const initialData = Array.from({ length: 20 }, (_, i) => ({
      name: i.toString(),
      process1: Math.random() * 25,
      process2: Math.random() * 15,
      process3: Math.random() * 10,
    }));
    setData(initialData);

    const generateData = () => {
      const newPoint = {
        name: Date.now().toString(),
        process1: Math.random() * 25,
        process2: Math.random() * 15,
        process3: Math.random() * 10,
      };

      setData((prevData) => {
        const newData = [...prevData, newPoint];
        if (newData.length > 20) {
          newData.shift();
        }
        return newData;
      });

      setCpuUsage(Math.floor(Math.random() * 40 + 10));
      setMemoryUsed(Math.floor(Math.random() * 200 + 300));
      setMemoryAvailable(
        Math.floor(Math.random() * 20 + 40) + Number(Math.random().toFixed(1)),
      );
    };

    const interval = setInterval(generateData, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex items-center bg-black rounded-md h-8 px-2 mr-2"
      style={{}}
    >
      <div className="text-xs text-zinc-400 mr-1">{memoryUsed}</div>
      <div className="w-20 h-5">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <Area
              type="monotone"
              dataKey="process1"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="process2"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="process3"
              stroke="#ffc658"
              fill="#ffc658"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs text-zinc-400 ml-1">{memoryAvailable}</div>
      <div className="text-xs text-amber-200 ml-1">{cpuUsage}%</div>
    </div>
  );
};
