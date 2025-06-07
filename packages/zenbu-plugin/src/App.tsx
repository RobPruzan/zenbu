import { useState } from "react";
import { useMessage } from "@/lib/utils";

export default function App() {
  const [lines, setLines] = useState<string[] | null>(null);

  useMessage("historyLines", (data) => {
    setLines(data);
  });

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {lines ? (
          <ul className="w-full max-w-full text-sm font-mono">
            {lines.map((line, idx) => (
              <li
                key={idx}
                className="break-all border-b last:border-b-0 border-border py-1 px-4"
              >
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            Waiting for data...
          </div>
        )}
      </div>
    </div>
  );
}