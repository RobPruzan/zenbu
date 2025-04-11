import { useCallback, useEffect, useRef, useState } from "react";
import { useChatStore } from "./chat-instance-context";
import { ListIcon, XIcon, Star, Download, Video, MonitorStop } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "~/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { z } from "zod";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "./ui/hover-card";
import { ScrollArea } from "./ui/scroll-area";

type ToolbarAction = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
};
type Recording = {
  id: string;
  url: string;
  name: string;
  timestamp: number;
};

type RecordingState =
  | "idle"
  | "starting"
  | "recording"
  | "stopping"
  | "recorded"
  | "error"
  | "viewing";

export const Recording = () => {
  const isRecordingActive = useChatStore(
    (state) => state.toolbar.state.recording.active,
  );

  if (!isRecordingActive) {
    // kills recordings if only stored locally (should move up to store)
    // this patter of early returning from the wrapper is nice since the component auto
    // implements cleanup via effect return cb's
    return;
  }

  return <RecordingImpl />;
};
export const RecordingImpl = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  // const [isListVisible, setIsListVisible] = useState(false);
  // const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  // const [error, setError] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  // our blobby boy
  const recordedChunksRef = useRef<Blob[]>([]);

  // const [visibleToolbarActions, setVisibleToolbarActions] = useState<string[]>(
  //   [],
  // );

  const { toolbar } = useChatStore();

  const cleanupActiveRecording = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.onerror = null;
      if (mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.warn("Error stopping MediaRecorder during cleanup:", e);
        }
      }
      mediaRecorderRef.current = null;
    }
    recordedChunksRef.current = [];
  };

  // const handleClosePlayer = useCallback(() => {
  //   setCurrentVideoUrl(null);
  //   setRecordingState((prev) => (prev === "recorded" ? "idle" : prev));
  // }, []);

  // const handleSelectRecording = useCallback((recording: Recording) => {
  //   setCurrentVideoUrl(recording.url);
  //   setRecordingState("viewing");
  //   setIsListVisible(false);
  // }, []);
  // const toggleListView = useCallback(() => {
  //   setIsListVisible((prev) => !prev);
  // }, []);

  // const toggleSettingsView = useCallback(() => {
  //   setIsSettingsVisible((prev) => !prev);
  //   if (isListVisible) setIsListVisible(false);
  // }, [isListVisible]);

  const startRecording = async () => {
    if (
      recordingState !== "idle" &&
      recordingState !== "error" &&
      recordingState !== "recorded"
    ) {
      console.warn("Already starting or recording.");
      return;
    }
    cleanupActiveRecording();
    // setError(null);
    // setIsListVisible(false);
    setRecordingState("starting");

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: "screen",
          // lets the share type we actually want to display first https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/displaySurface#browser_compatibility
          displaySurface: "window",
        } as any,
        audio: true,

        // video: {
        //   displaySurface: "browser", // Prefer browser/tab
        // } as any,
      });
      mediaStreamRef.current = stream;
      recordedChunksRef.current = [];

      stream.getVideoTracks()[0].onended = () => {
        console.log("Screen share stopped via browser UI.");
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording"
        ) {
          stopRecording();
        } else {
          cleanupActiveRecording();
          setRecordingState("idle");
        }
      };

      const options = { mimeType: "video/webm; codecs=vp9" };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        console.warn("VP9 codec might not be supported, trying default.", e);
        try {
          recorder = new MediaRecorder(stream);
        } catch (fallbackError) {
          console.error(
            "Failed to create MediaRecorder with default options:",
            fallbackError,
          );
          const message =
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError);
          throw new Error(`MediaRecorder initialization failed: ${message}`);
        }
      }

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (recordedChunksRef.current.length === 0) {
          console.warn("Recording stopped with no data chunks.");
          setRecordingState("idle");
          cleanupActiveRecording();
          return;
        }
        const blobs = recordedChunksRef.current;

        const blob = new Blob(blobs, {
          type: recorder.mimeType || "video/webm",
        });

        const formData = new FormData();
        formData.set("video", blob);

        const res = await fetch("http://localhost:5001/video/upload", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();

        const schema = z.object({
          success: z.literal(true),
          path: z.string(),
        });

        const data = schema.parse(json);

        // const url = URL.createObjectURL(blob);
        const url = `http://localhost:5001/video/${data.path}`;

        const newRecording: Recording = {
          id: `rec_${Date.now()}`,
          url,
          name: `Recording ${recordings.length + 1}`,
          timestamp: Date.now(),
        };
        console.log("setting new recording", newRecording);

        setRecordings((prev) => [...prev, newRecording]);

        setCurrentVideoUrl(url);
        setRecordingState("recorded");

        mediaRecorderRef.current = null;
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        // const errorMessage =
        //   (event as any)?.error?.message || "Unknown recording error";
        // setError(`Recording error: ${errorMessage}`);
        cleanupActiveRecording();
        setRecordingState("error");
      };

      recorder.start();
      setRecordingState("recording");
    } catch (err) {
      console.error("Error starting screen recording:", err);
      let message = "An unknown error occurred.";
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          message = "Permission denied. Please allow screen recording access.";
        } else if (err.message.includes("MediaRecorder")) {
          message = `Recording setup failed: ${err.message}`;
        } else {
          message = `Failed to start recording: ${err.message}`;
        }
      }
      // setError(message);
      cleanupActiveRecording();
      setRecordingState("error");
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      setRecordingState("stopping");
      // console.log('record');

      mediaRecorderRef.current.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    } else {
      console.warn(
        `Stop recording called but recorder not active (state: ${mediaRecorderRef.current?.state}, ref: ${mediaRecorderRef.current})`,
      );
      cleanupActiveRecording();
      setRecordingState("idle");
    }
  };

  useEffect(() => {
    return () => {
      // console.log("Cleaning up recorder component, revoking URLs...");
      // cleanupActiveRecording();
      // recordings.forEach((rec) => URL.revokeObjectURL(rec.url));
      // if (
      //   currentVideoUrl &&
      //   !recordings.some((r) => r.url === currentVideoUrl)
      // ) {
      //   console.log("Revoking dangling currentVideoUrl");
      //   URL.revokeObjectURL(currentVideoUrl);
      // }
    };
  }, [cleanupActiveRecording, recordings]);

  // const isRecorderActive =
  //   recordingState === "recording" &&
  //   mediaRecorderRef.current?.state === "recording";
  const isRecordingProcessActive =
    // recordingState === "starting" ||
    recordingState === "recording" || recordingState === "stopping";

  // const toolbarActions: ToolbarAction[] = [
  //   {
  //     id: "record",
  //     label: isRecordingProcessActive ? "Stop Recording" : "Record Screen",
  //     icon: (
  //       <span
  //         style={{
  //           width: "10px",
  //           height: "10px",
  //           borderRadius: isRecordingProcessActive ? "2px" : "50%",
  //           backgroundColor: "white",
  //           display: "inline-block",
  //           animation:
  //             isRecordingProcessActive && isRecorderActive
  //               ? "pulse 1.5s infinite ease-in-out"
  //               : "none",
  //         }}
  //       ></span>
  //     ),
  //     onClick: isRecordingProcessActive ? stopRecording : startRecording,
  //     disabled: isRecordingProcessActive && !isRecorderActive,
  //     primary: true,
  //   },
  //   {
  //     id: "recordings",
  //     label: `Recordings (${recordings.length})`,
  //     onClick: toggleListView,
  //     disabled: isRecordingProcessActive,
  //   },
  // ];

  return (
    <>
      <Toolbar
        recordings={recordings}
        startRecording={startRecording}
        stopRecording={stopRecording}
        closeToolbar={() => {
          toolbar.actions.setIsRecording(false);
        }}
        isRecording={isRecordingProcessActive}
      />
    </>
  );
};

const Toolbar = ({
  closeToolbar,
  startRecording,
  stopRecording,
  isRecording,
  recordings,
}: {
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  closeToolbar: () => void;
  recordings: Array<Recording>;
}) => {
  const [showRecordingsList, setShowRecordingsList] = useState(false);
  const context = useChatStore((state) => state.context);

  return (
    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-[1000000]">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/95 p-2 shadow-lg backdrop-blur">
          <RadioGroup defaultValue="screen" className="flex gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="screen" id="r1" />
              <Label htmlFor="r1" className="text-sm">Screen</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="area" id="r2" />
              <Label htmlFor="r2" className="text-sm">Area</Label>
            </div>
          </RadioGroup>

          <div className="h-4 w-[1px] bg-border/40" />

          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <Button
                onClick={() => {
                  if (isRecording) {
                    stopRecording();
                    return;
                  }
                  startRecording();
                }}
                variant="ghost"
                size="sm"
                className={cn(
                  "relative h-8 w-8 rounded-full bg-background p-0 hover:bg-background/90",
                  isRecording && "bg-red-500/10 hover:bg-red-500/20"
                )}
              >
                <div
                  className={cn(
                    "absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 transition-all",
                    isRecording && "rounded-sm"
                  )}
                />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent side="bottom" align="center" className="w-auto">
              <p className="text-xs">{isRecording ? "Stop Recording" : "Start Recording"}</p>
            </HoverCardContent>
          </HoverCard>

          <div className="h-4 w-[1px] bg-border/40" />

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8"
            onClick={() => setShowRecordingsList((prev) => !prev)}
          >
            <ListIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8"
            onClick={closeToolbar}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        {showRecordingsList && recordings.length > 0 && (
          <div className="w-[400px] rounded-lg border border-border/40 bg-background/95 p-2 shadow-lg backdrop-blur">
            <ScrollArea className="h-[300px]">
              <div className="flex flex-col gap-2">
                {recordings.map((recording) => (
                  <div
                    key={recording.id}
                    className="group relative overflow-hidden rounded-md border border-border/40 bg-background/50 p-2 hover:border-border"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium">{recording.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(recording.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => {
                          const filePath = recording.url.split("/").at(-1);
                          if (!filePath) {
                            throw new Error("Invalid URL format");
                          }
                          context.actions.pushItem({
                            kind: "video",
                            filePath,
                            name: recording.name,
                          });
                        }}
                      >
                        Add to Context
                      </Button>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="relative aspect-video cursor-pointer overflow-hidden rounded-md bg-black/10">
                          <video src={recording.url} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                            <Video className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent
                        className="max-h-[90vh] max-w-[90vw]"
                        style={{ zIndex: 2147483647 }}
                      >
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <span>{recording.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(recording.timestamp).toLocaleString()}
                            </span>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="relative aspect-video">
                          <video
                            src={recording.url}
                            controls
                            className="h-full w-full rounded-md"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};
