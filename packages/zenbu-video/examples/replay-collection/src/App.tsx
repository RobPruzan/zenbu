import { useState, useEffect, useRef } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { record } from "rrweb";
import { eventWithTime } from "@rrweb/types";
import Player from "rrweb-player";
import "rrweb-player/dist/style.css";

function App() {
  const [count, setCount] = useState(0);
  const [events, setEvents] = useState<eventWithTime[]>([]);
  const playerRef = useRef<HTMLDivElement>(null);
  const rrwebPlayerRef = useRef<any>(null);

  useEffect(() => {
    const stopRecording = record({
      emit: (event) => {
        if (
          event.type === 2 && // 2 = IncrementalSnapshot
          // @ts-expect-error
          event.data?.source === 4 // 4 = Mutation
        ) {
          if (
            // @ts-expect-error
            event.data?.adds?.some?.(
              (add: any) =>
                add.node?.attributes?.class === "rr-player" ||
                add.node?.attributes?.className === "rr-player"
            )
          ) {
            return;
          }
        }
        setEvents((prev) => [...prev, event]);
      },
      // block the replayer node from being recorded
      blockClass: "rr-player",
      ignoreClass: "rr-player",
    });
    return () => {
      if (typeof stopRecording === "function") stopRecording();
    };
  }, []);

  useEffect(() => {
    if (playerRef.current) {
      if (
        rrwebPlayerRef.current &&
        typeof rrwebPlayerRef.current?.$destroy === "function"
      ) {
        rrwebPlayerRef.current.$destroy();
        rrwebPlayerRef.current = null;
      }
      if (events.length > 0) {
        rrwebPlayerRef.current = new Player({
          target: playerRef.current,
          props: {
            events,
            autoPlay: true,
            width: 400,
            height: 300,
          },
        });
      }
    }
  }, [events]);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button
          onClick={() => {
            setCount(count + 1);
            console.log(events);
          }}
        >
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

      <div
        ref={playerRef}
        className="rr-player"
        style={{
          width: 400,
          height: 300,
        }}
      />
    </>
  );
}

export default App;
