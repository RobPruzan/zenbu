import { useEffect, useRef } from "react";
import rrwebPlayer from "rrweb-player";
import "rrweb-player/dist/style.css";
import type { eventWithTime } from "@rrweb/types";

interface ReplayProps {
  events: eventWithTime[];
  showController?: boolean;
}

export const Replay = ({ events, showController = true }: ReplayProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current && events.length > 0) {
      playerRef.current = new rrwebPlayer({
        target: containerRef.current,
        props: {
          events,
          showController,
        },
      });

      return () => {
        if (playerRef.current) {
          playerRef.current.unmount?.();
          playerRef.current = null;
        }
      };
    }
  }, [events, showController]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
};
