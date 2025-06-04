import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useChatStore } from "../chat-store";
import { Ellipsis, Leaf, X } from "lucide-react";
import { Button } from "../ui/button";
import { act, useEffect, useState } from "react";
import { ChildToParentMessage } from "zenbu-devtools";
import { trpc } from "src/lib/trpc";
import { iife } from "src/lib/utils";
import { useGetProject } from "src/app/[workspaceId]/hooks";
/**
 *
 * will need that framer motion stuff yippy
 *
 * do i want to mount drawing here? I mean probably not lol
 *
 * but i would like to control it from here
 *
 *
 * i will do it myself (smirks)
 *
 *
 * controllable by the command menu
 *
 *
 * so routes solves that
 *
 * id like one button that expands it
 *
 * maybe it just expands it to full? To last so you can close/open easily... yeah thats ideal, plus multi state is always unintuitive
 *
 * l
 *
 * mannnnnnno ur state management is roughso
 */
export const BetterToolbar = () => {
  const { actions, state } = useChatStore((state) => state.toolbar);
  const projectsQuery = trpc.daemon.getProjects.useQuery();
  const projects = projectsQuery.data ?? [];

  // const url = useChatStore((state) => state.iframe.state.url);
  const { url, project } = useGetProject();
  // const currentProjectName = projects.find(
  //   (project) => `http://localhost:${project.port}` === url,
  // )?.name;

  return (
    <div className="absolute bottom-2 left-2">
      {iife(() => {
        switch (state.activeRoute) {
          case "off": {
            return (
              <Button
                variant={"outline"}
                className="rounded-full px-0 py-0 h-fit p-2"
                onClick={() => {
                  actions.setRoute("console");
                }}
              >
                {/* todo later change size */}
                <Ellipsis />
              </Button>
            );
          }
          // case "console": {
          //   return <Console />;
          // }
          case "console": {
            if (!project.name) {
              return <Console />;
            }
            // for ease of use
            return <ProcessStatsChart name={project.name} />;
          }
          case "network": {
            return (
              <div className="h-[350px] w-[600px] bg-background rounded-md flex items-end justify-start">
                network
                <Button
                  variant={"outline"}
                  onClick={() => {
                    actions.setRoute("off");
                  }}
                >
                  off
                </Button>
              </div>
            );
          }
          case "performance": {
            return (
              <div className="h-[350px] w-[600px] bg-background rounded-md flex items-end justify-start">
                performance
                <Button
                  variant={"outline"}
                  onClick={() => {
                    actions.setRoute("off");
                  }}
                >
                  off
                </Button>
              </div>
            );
          }
        }
      })}
    </div>
  );
  // return ;
};

interface ProcessStats {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  ppid: number;
  elapsed: number;
  timestamp: number;
  ctime: number;
  stdout?: string[];
}

interface ProcessStatsResponse {
  pid: number;
  name: string;
  stats: {
    cpu: number;
    memory: number;
    ppid: number;
    elapsed: number;
    timestamp: number;
  };
  stdout: string[];
}

interface ProcessStatsChartProps {
  name: string;
}

const ProcessStatsChart = ({ name }: ProcessStatsChartProps) => {
  const { actions } = useChatStore((state) => state.toolbar);
  const [stats, setStats] = useState<ProcessStats[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"metrics" | "logs">("metrics");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(
          `http://localhost:40000/projects/${name}/stats`,
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.statusText}`);
        }
        const result: ProcessStatsResponse = await response.json();

        const processedStat: ProcessStats = {
          pid: result.pid,
          name: result.name,
          cpu: result.stats.cpu,
          memory: result.stats.memory,
          ppid: result.stats.ppid,
          elapsed: result.stats.elapsed,
          timestamp: result.stats.timestamp,
          ctime: 0,
          stdout: result.stdout,
        };

        setStats((prev) => {
          const newStats = [...prev, processedStat];
          return newStats.slice(-30);
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 250);

    return () => clearInterval(interval);
  }, [name]);

  // Format elapsed time in a human-readable way
  const formatElapsedTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}m ${secs}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const latestStats = stats.length > 0 ? stats[stats.length - 1] : null;
  const maxMemoryValue = Math.max(
    ...stats.map((stat) => stat.memory / 1024 / 1024),
    100,
  );

  return (
    <div className="h-[300px] w-[500px] bg-background backdrop-blur-sm rounded-lg border border-border/50 shadow-lg flex flex-col p-3">
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-1.5">
          <Button
            variant={activeTab === "metrics" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 text-xs px-2.5"
            onClick={() => setActiveTab("metrics")}
          >
            Metrics
          </Button>
          <Button
            variant={activeTab === "logs" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 text-xs px-2.5"
            onClick={() => setActiveTab("logs")}
          >
            Logs
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 rounded-full"
          onClick={() => actions.setRoute("off")}
        >
          <X size={12} />
        </Button>
      </div>

      {error ? (
        <div className="flex h-full items-center justify-center">
          <div className="text-red-500/90 bg-red-500/10 px-2.5 py-1.5 rounded-md text-xs">
            {error}
          </div>
        </div>
      ) : activeTab === "metrics" ? (
        <div className="grid grid-cols-2 gap-3 flex-1">
          <div className="bg-muted/5 rounded-md p-2.5 border border-border/10 flex flex-col">
            <h4 className="text-[11px] font-medium mb-1.5 text-muted-foreground flex items-center justify-between">
              <span>CPU Usage</span>
              <span className="font-mono">
                {latestStats ? `${latestStats.cpu.toFixed(1)}%` : "-"}
              </span>
            </h4>
            <div className="flex-1 min-h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="timestamp"
                    tick={false}
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}`}
                    width={20}
                    stroke="rgba(255,255,255,0.1)"
                    tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 9 }}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value.toFixed(1)}%`, "CPU"]}
                    labelFormatter={() => ""}
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "4px",
                      fontSize: "10px",
                      padding: "3px 6px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cpu"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{
                      r: 2.5,
                      fill: "#3b82f6",
                      stroke: "rgba(59, 130, 246, 0.2)",
                      strokeWidth: 4,
                    }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-muted/5 rounded-md p-2.5 border border-border/10 flex flex-col">
            <h4 className="text-[11px] font-medium mb-1.5 text-muted-foreground flex items-center justify-between">
              <span>Memory Usage</span>
              <span className="font-mono">
                {latestStats
                  ? `${(latestStats.memory / 1024 / 1024).toFixed(1)}MB`
                  : "-"}
              </span>
            </h4>
            <div className="flex-1 min-h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="timestamp"
                    tick={false}
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <YAxis
                    domain={[0, Math.ceil(maxMemoryValue / 100) * 100]}
                    tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                    width={30}
                    stroke="rgba(255,255,255,0.1)"
                    tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 9 }}
                  />
                  <Tooltip
                    formatter={(value: any) => [
                      `${(value / 1024 / 1024).toFixed(1)} MB`,
                      "Memory",
                    ]}
                    labelFormatter={() => ""}
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "4px",
                      fontSize: "10px",
                      padding: "3px 6px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="memory"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{
                      r: 2.5,
                      fill: "#10b981",
                      stroke: "rgba(16, 185, 129, 0.2)",
                      strokeWidth: 4,
                    }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-2 grid grid-cols-3 gap-2">
            <div className="bg-muted/5 px-2 py-1.5 rounded-md border border-border/10">
              <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
                PPID
              </div>
              <div className="text-xs font-mono tabular-nums">
                {latestStats?.ppid || "-"}
              </div>
            </div>
            <div className="bg-muted/5 px-2 py-1.5 rounded-md border border-border/10">
              <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
                CPU Time
              </div>
              <div className="text-xs font-mono tabular-nums">
                {latestStats ? `${latestStats.ctime.toFixed(1)}s` : "-"}
              </div>
            </div>
            <div className="bg-muted/5 px-2 py-1.5 rounded-md border border-border/10">
              <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
                Elapsed
              </div>
              <div className="text-xs font-mono tabular-nums">
                {latestStats
                  ? formatElapsedTime(latestStats.elapsed / 1000)
                  : "-"}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-muted/5 rounded-md border border-border/10 overflow-hidden">
          <div className="h-full overflow-auto font-mono text-[11px] p-2.5">
            <div className="max-w-full">
              {latestStats?.stdout?.length ? (
                latestStats.stdout.map((line, i) => (
                  <div
                    key={i}
                    className="whitespace-pre-wrap break-all text-muted-foreground"
                  >
                    {line}
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground/50 italic">
                  No logs available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Console = () => {
  const { actions, state } = useChatStore((state) => state.toolbar);
  const [logs, setLogs] = useState<Array<any[]>>([]);

  useEffect(() => {
    window.addEventListener(
      "message",
      (event: MessageEvent<ChildToParentMessage>) => {
        if (event.origin !== "http://localhost:4200") {
          return;
        }

        const eventData = event.data;

        switch (eventData.kind) {
          case "console": {
            setLogs((prev) => [...prev, eventData.data]);
          }
        }
      },
    );
  }, []);

  useEffect(() => {}, []);
  return (
    <div className="h-[350px] w-[600px] bg-background rounded-md flex items-end justify-start">
      console
      <Button
        variant={"outline"}
        onClick={() => {
          actions.setRoute("off");
        }}
      >
        off
      </Button>
      {/* needs circular indicator */}
      <div className="w-full h-full overflow-auto p-2 flex flex-col-reverse">
        {/* temp just to be able to render circular structures */}
        {logs.map((log, i) => (
          <div key={i} className="mb-1 font-mono text-sm">
            {log.map((item, j) => (
              <span key={j} className="mr-2">
                {typeof item === "object" && item !== null ? (
                  <details>
                    <summary className="cursor-pointer">Object</summary>
                    <div className="pl-4 text-xs">
                      {Object.entries(item).map(([key, value], idx) => (
                        <div key={idx} className="mt-1">
                          <span className="text-blue-500">{key}:</span>{" "}
                          {typeof value === "object" && value !== null ? (
                            <details>
                              <summary className="cursor-pointer inline-block">
                                Object
                              </summary>
                            </details>
                          ) : (
                            <span>{String(value)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                ) : (
                  String(item)
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
