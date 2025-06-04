"use client"
import { motion } from "framer-motion";
import { ImageIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { Button } from "src/components/ui/button";
import { trpc } from "src/lib/trpc";
import { cn } from "src/lib/utils";
import { useUploadBackgroundImage } from "./hooks";
import { useState, useEffect } from "react";
import { ResponsiveContainer, Area, AreaChart } from "recharts";
import Link from "next/link";
// import { useWorkspaceContext } from "../v2/context";

export const TopBar = () => {
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

  const utils = trpc.useUtils();

  workspaces.forEach((workspace) => {
    utils.workspace.getWorkspace.prefetch({ workspaceId: workspace });
    utils.workspace.getTags.prefetch({ workspaceId: workspace });
  });

  // const { workspaceId } = useWorkspaceContext()
  const [workspaceId] = trpc.persistedSingleton.getCurrentWorkspaceId.useSuspenseQuery()
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
                `inline-flex items-center text-xs justify-center h-8 px-3 py-1  leading-tight hover:bg-accent/70 bg-black rounded-sm cursor-default text-white`,

                name === workspaceId && "border-[#141414]",
              ])}
            >
              <span
                style={{
            //  mixBlendMode: 'hard-light'
             }} 
              >

              {name}
              </span>
            </Link>
            {name === workspaceId && (
              <motion.div
                style={{
                // backgroundClip: 'text'
                mixBlendMode: 'exclusion'
              }}
                transition={{
                  duration: 0.25,
                }}
                layoutId="link-underline"
                className="h-full absolute w-full rounded-sm bg-accent/70 z-20"
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
