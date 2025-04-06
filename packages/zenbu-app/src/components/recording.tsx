import { useCallback, useEffect, useRef, useState } from "react";

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
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isListVisible, setIsListVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [visibleToolbarActions, setVisibleToolbarActions] = useState<string[]>(
    [],
  );

  const cleanupActiveRecording = useCallback(() => {
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
  }, []);

  const handleClosePlayer = useCallback(() => {
    setCurrentVideoUrl(null);
    setRecordingState((prev) => (prev === "recorded" ? "idle" : prev));
  }, []);

  const handleSelectRecording = useCallback((recording: Recording) => {
    setCurrentVideoUrl(recording.url);
    setRecordingState("viewing");
    setIsListVisible(false);
  }, []);
  const toggleListView = useCallback(() => {
    setIsListVisible((prev) => !prev);
  }, []);

  const toggleSettingsView = useCallback(() => {
    setIsSettingsVisible((prev) => !prev);
    if (isListVisible) setIsListVisible(false);
  }, [isListVisible]);

  const startRecording = useCallback(async () => {
    if (
      recordingState !== "idle" &&
      recordingState !== "error" &&
      recordingState !== "recorded"
    ) {
      console.warn("Already starting or recording.");
      return;
    }
    cleanupActiveRecording();
    setError(null);
    setIsListVisible(false);
    setRecordingState("starting");

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" } as any,
        audio: true,
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

      recorder.onstop = () => {
        if (recordedChunksRef.current.length === 0) {
          console.warn("Recording stopped with no data chunks.");
          setRecordingState("idle");
          cleanupActiveRecording();
          return;
        }

        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });
        const url = URL.createObjectURL(blob);

        const newRecording: Recording = {
          id: `rec_${Date.now()}`,
          url: url,
          name: `Recording ${recordings.length + 1}`,
          timestamp: Date.now(),
        };
        setRecordings((prev) => [...prev, newRecording]);

        setCurrentVideoUrl(url);
        setRecordingState("recorded");

        mediaRecorderRef.current = null;
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        const errorMessage =
          (event as any)?.error?.message || "Unknown recording error";
        setError(`Recording error: ${errorMessage}`);
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
      setError(message);
      cleanupActiveRecording();
      setRecordingState("error");
    }
  }, [cleanupActiveRecording, recordings.length, recordingState]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      setRecordingState("stopping");
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
  }, [cleanupActiveRecording]);

  useEffect(() => {
    return () => {
      console.log("Cleaning up recorder component, revoking URLs...");
      cleanupActiveRecording();
      recordings.forEach((rec) => URL.revokeObjectURL(rec.url));
      if (
        currentVideoUrl &&
        !recordings.some((r) => r.url === currentVideoUrl)
      ) {
        console.log("Revoking dangling currentVideoUrl");
        URL.revokeObjectURL(currentVideoUrl);
      }
    };
  }, [cleanupActiveRecording, recordings]); 

  const isRecorderActive =
    recordingState === "recording" &&
    mediaRecorderRef.current?.state === "recording";
  const isRecordingProcessActive =
    recordingState === "starting" ||
    recordingState === "recording" ||
    recordingState === "stopping";

  const toolbarActions: ToolbarAction[] = [
    {
      id: "record",
      label: isRecordingProcessActive ? "Stop Recording" : "Record Screen",
      icon: (
        <span
          style={{
            width: "10px",
            height: "10px",
            borderRadius: isRecordingProcessActive ? "2px" : "50%",
            backgroundColor: "white",
            display: "inline-block",
            animation:
              isRecordingProcessActive && isRecorderActive
                ? "pulse 1.5s infinite ease-in-out"
                : "none",
          }}
        ></span>
      ),
      onClick: isRecordingProcessActive ? stopRecording : startRecording,
      disabled: isRecordingProcessActive && !isRecorderActive,
      primary: true,
    },
    {
      id: "recordings",
      label: `Recordings (${recordings.length})`,
      onClick: toggleListView,
      disabled: isRecordingProcessActive,
    },
  ];

  return (
    <>
      <Toolbar
        actions={toolbarActions}
        visibleActionIds={[]}
        isRecording={isRecordingProcessActive}
        isRecorderActive={isRecorderActive}
        onOpenSettings={toggleSettingsView}
      />
    </>
  );
};

type ToolbarProps = {
  actions: ToolbarAction[];
  visibleActionIds?: string[];
  isRecording: boolean;
  isRecorderActive: boolean;
  onOpenSettings?: () => void;
};

const Toolbar = ({
  actions,
  visibleActionIds = [],
  isRecording,
  isRecorderActive,
  onOpenSettings,
}: ToolbarProps) => {
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const overflowButtonRef = useRef<HTMLDivElement>(null);
  const overflowMenuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<"right" | "left">("right");

  const visibleActions = actions.filter((action) =>
    visibleActionIds.includes(action.id),
  );

  const overflowActions = actions.filter(
    (action) => !visibleActionIds.includes(action.id),
  );

  useEffect(() => {
    if (
      isOverflowOpen &&
      overflowButtonRef.current &&
      overflowMenuRef.current
    ) {
      const buttonRect = overflowButtonRef.current.getBoundingClientRect();
      const menuWidth = overflowMenuRef.current.offsetWidth;
      const windowWidth = window.innerWidth;

      if (buttonRect.right + menuWidth > windowWidth - 20) {
        setMenuPosition("left");
      } else {
        setMenuPosition("right");
      }
    }
  }, [isOverflowOpen]);

  useEffect(() => {
    if (!isOverflowOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        overflowMenuRef.current &&
        overflowButtonRef.current &&
        !overflowMenuRef.current.contains(event.target as Node) &&
        !overflowButtonRef.current.contains(event.target as Node)
      ) {
        setIsOverflowOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOverflowOpen]);

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        backgroundColor: "rgba(30, 30, 30, 0.7)",
        backdropFilter: "blur(8px)",
        padding: "10px 15px",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      {visibleActions.map((action) => (
        <button
          key={action.id}
          onClick={action.onClick}
          disabled={action.disabled}
          style={{
            padding: action.primary ? "8px 16px" : "8px 12px",
            cursor: action.disabled ? "not-allowed" : "pointer",
            backgroundColor: action.primary
              ? isRecording
                ? "rgba(239, 68, 68, 0.8)"
                : "rgba(59, 130, 246, 0.8)"
              : "rgba(255, 255, 255, 0.1)",
            color: "white",
            border: action.primary
              ? "none"
              : "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition:
              "background-color 0.2s ease, transform 0.1s ease, opacity 0.2s ease",
            whiteSpace: "nowrap",
            opacity: action.disabled ? 0.5 : 1,
          }}
          onMouseDown={(e) =>
            !action.disabled &&
            (e.currentTarget.style.transform = "scale(0.98)")
          }
          onMouseUp={(e) =>
            !action.disabled && (e.currentTarget.style.transform = "scale(1)")
          }
          onMouseLeave={(e) =>
            !action.disabled && (e.currentTarget.style.transform = "scale(1)")
          }
        >
          {action.icon}
          {action.label}
        </button>
      ))}

      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          disabled={isRecording}
          style={{
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "8px",
            cursor: isRecording ? "not-allowed" : "pointer",
            transition: "background-color 0.2s ease",
            opacity: isRecording ? 0.5 : 1,
          }}
          onMouseOver={(e) =>
            !isRecording &&
            (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)")
          }
          onMouseOut={(e) =>
            !isRecording &&
            (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)")
          }
          title="Toolbar Settings"
        >
          <span style={{ color: "white", fontSize: "14px" }}>⚙️</span>
        </button>
      )}

      {overflowActions.length > 0 && (
        <div style={{ position: "relative" }} ref={overflowButtonRef}>
          <button
            onClick={() => setIsOverflowOpen((prev) => !prev)}
            style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.2)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.1)")
            }
          >
            <span style={{ color: "white", fontSize: "16px" }}>⋯</span>
          </button>

          {isOverflowOpen && (
            <div
              ref={overflowMenuRef}
              style={{
                position: "absolute",
                top: "40px",
                [menuPosition]: "0",
                backgroundColor: "rgba(40, 40, 40, 0.9)",
                backdropFilter: "blur(10px)",
                borderRadius: "8px",
                padding: "6px",
                minWidth: "180px",
                maxWidth: "240px",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                zIndex: 51,
              }}
            >
              {overflowActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    action.onClick();
                    setIsOverflowOpen(false);
                  }}
                  disabled={action.disabled}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "8px 10px",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "4px",
                    color: "white",
                    fontSize: "14px",
                    textAlign: "left",
                    cursor: action.disabled ? "not-allowed" : "pointer",
                    opacity: action.disabled ? 0.5 : 1,
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseOver={(e) =>
                    !action.disabled &&
                    (e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.1)")
                  }
                  onMouseOut={(e) =>
                    !action.disabled &&
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
