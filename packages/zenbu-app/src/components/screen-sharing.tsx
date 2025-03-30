import React, { useState, useRef, useCallback, ReactNode, useEffect } from 'react';

// --- Types ---
type Recording = {
  id: string;
  url: string;
  name: string;
  timestamp: number;
};

type VideoPlayerProps = {
  src: string;
  onClose: () => void;
};

type ToolbarProps = {
  isRecording: boolean; // Indicates the *intent* or general state
  isRecorderActive: boolean; // Indicates if MediaRecorder instance is actually 'recording'
  onStart: () => void;
  onStop: () => void;
  onToggleList: () => void;
  recordingCount: number;
};

type RecordingsListProps = {
  recordings: Recording[];
  onSelect: (recording: Recording) => void;
  isVisible: boolean;
};

type RecorderProps = {
  children: ReactNode;
};

type RecordingState = 'idle' | 'starting' | 'recording' | 'stopping' | 'recorded' | 'error' | 'viewing'; // Added intermediate states


// --- VideoPlayer Component ---
// A more polished video player overlay
const VideoPlayer = ({ src, onClose }: VideoPlayerProps) => {
  return (
    <div style={{
      position: 'fixed', // Use fixed to overlay everything
      inset: 0, // Cover the whole viewport
      backgroundColor: 'rgba(0, 0, 0, 0.85)', // Darker overlay
      backdropFilter: 'blur(10px)', // Frosted glass effect
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000, // Ensure it's on top
      padding: '20px', // Add some padding around
    }}>
      <div style={{
        position: 'relative',
        width: '90%',
        height: '90%',
        maxWidth: '1200px', // Max width for large screens
        maxHeight: '80vh', // Max height
        backgroundColor: '#111', // Dark background for the video container
        borderRadius: '12px', // Rounded corners
        overflow: 'hidden', // Keep video inside rounded corners
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)', // Subtle shadow
      }}>
        <video
          src={src}
          controls // Keep default controls for now, styling them is complex
          autoPlay
          style={{
            display: 'block', // Remove extra space below video
            width: '100%',
            height: '100%',
            objectFit: 'contain', // Ensure video fits without distortion
            borderRadius: '12px', // Match container rounding
          }}
        />
        <button
          onClick={onClose}
          aria-label="Close video player"
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: '18px',
            lineHeight: '32px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            backdropFilter: 'blur(5px)', // Blur behind the button
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// --- RecordingsList Component ---
const RecordingsList = ({ recordings, onSelect, isVisible }: RecordingsListProps) => {
    if (!isVisible) return null;

    return (
        <div style={{
            position: 'absolute',
            top: '70px', // Position below the toolbar
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 45, // Below toolbar, above error
            backgroundColor: 'rgba(40, 40, 40, 0.8)',
            backdropFilter: 'blur(8px)',
            padding: '10px',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxHeight: '300px',
            overflowY: 'auto',
            minWidth: '250px',
            color: 'white',
        }}>
            {recordings.length === 0 ? (
                <div style={{ padding: '10px', textAlign: 'center', color: '#aaa' }}>No recordings yet.</div>
            ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {recordings.slice().reverse().map((rec) => ( // Show newest first
                        <li key={rec.id}
                            onClick={() => onSelect(rec)}
                            style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                transition: 'background-color 0.2s ease',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '14px',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <span>{rec.name}</span>
                            <span style={{ fontSize: '12px', color: '#aaa' }}>
                                {new Date(rec.timestamp).toLocaleTimeString()}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};


// --- Toolbar Component ---
// Positioned at the top
const Toolbar = ({ isRecording, isRecorderActive, onStart, onStop, onToggleList, recordingCount }: ToolbarProps) => {
  const isButtonDisabled = isRecording && !isRecorderActive; // Disable stop if state is 'recording' but recorder isn't active yet/anymore

  return (
    <div style={{
      position: 'absolute',
      top: '20px', // Position at the top
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 50, // Above children, list, error, below player
      backgroundColor: 'rgba(30, 30, 30, 0.7)', // Dark, semi-transparent
      backdropFilter: 'blur(8px)', // Frosted glass
      padding: '10px 15px',
      borderRadius: '10px', // Rounded corners
      display: 'flex',
      alignItems: 'center', // Center items vertically
      gap: '12px', // Space between elements
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)', // Subtle shadow
      border: '1px solid rgba(255, 255, 255, 0.1)', // Subtle border
    }}>
      <button
        onClick={isRecording ? onStop : onStart}
        disabled={isButtonDisabled} // Use the calculated disabled state
        style={{
          padding: '8px 16px',
          cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
          backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.8)', // Red for stop, Blue for start
          color: 'white',
          border: 'none',
          borderRadius: '8px', // Rounded button
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'background-color 0.2s ease, transform 0.1s ease, opacity 0.2s ease',
          whiteSpace: 'nowrap',
          opacity: isButtonDisabled ? 0.5 : 1,
        }}
        onMouseDown={(e) => !isButtonDisabled && (e.currentTarget.style.transform = 'scale(0.98)')}
        onMouseUp={(e) => !isButtonDisabled && (e.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={(e) => !isButtonDisabled && (e.currentTarget.style.transform = 'scale(1)')}
      >
        {/* Basic icon simulation */}
        <span style={{
          width: '10px',
          height: '10px',
          borderRadius: isRecording ? '2px' : '50%', // Square for stop, Circle for record
          backgroundColor: 'white',
          display: 'inline-block',
          animation: isRecording && isRecorderActive ? 'pulse 1.5s infinite ease-in-out' : 'none', // Pulse only when actively recording
        }}></span>
        {isRecording ? 'Stop Recording' : 'Record Screen'}
      </button>

      {/* View Recordings Button */}
      <button
        onClick={onToggleList}
        disabled={isRecording} // Disable while recording process is active
        style={{
          padding: '8px 12px',
          cursor: isRecording ? 'not-allowed' : 'pointer',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'background-color 0.2s ease, transform 0.1s ease, opacity 0.2s ease',
          opacity: isRecording ? 0.5 : 1,
        }}
        onMouseDown={(e) => !isRecording && (e.currentTarget.style.transform = 'scale(0.98)')}
        onMouseUp={(e) => !isRecording && (e.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={(e) => !isRecording && (e.currentTarget.style.transform = 'scale(1)')}
      >
        Recordings ({recordingCount})
      </button>

      {/* CSS for pulse animation */}
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


// --- Recorder Component ---
export const Recorder = ({ children }: RecorderProps) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null); // URL for the player
  const [recordings, setRecordings] = useState<Recording[]>([]); // List of saved recordings
  const [isListVisible, setIsListVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Cleanup active recording resources (stream, recorder instance)
  const cleanupActiveRecording = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;

    if (mediaRecorderRef.current) {
        // Remove event listeners before nullifying
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.onerror = null;
        // Check state before trying to stop, might already be stopped or inactive
        if (mediaRecorderRef.current.state !== 'inactive') {
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
    setCurrentVideoUrl(null); // Hide player
    // If the last action was 'recorded', go back to idle, otherwise stay in current state (e.g. error)
    setRecordingState(prev => prev === 'recorded' ? 'idle' : prev);
    // Do not revoke URL, it's stored in the recordings list
  }, []);

  const handleSelectRecording = useCallback((recording: Recording) => {
    setCurrentVideoUrl(recording.url);
    setRecordingState('viewing'); // Use 'viewing' state
    setIsListVisible(false); // Hide list when viewing
  }, []);

  const toggleListView = useCallback(() => {
    setIsListVisible(prev => !prev);
  }, []);

  const startRecording = useCallback(async () => {
    if (recordingState !== 'idle' && recordingState !== 'error' && recordingState !== 'recorded') {
        console.warn("Already starting or recording.");
        return;
    }
    cleanupActiveRecording();
    setError(null);
    setIsListVisible(false);
    setRecordingState('starting'); // Indicate process has begun

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" } as any,
        audio: true,
      });
      mediaStreamRef.current = stream;
      recordedChunksRef.current = [];

      stream.getVideoTracks()[0].onended = () => {
        console.log("Screen share stopped via browser UI.");
        // Check ref and state before calling stopRecording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
           stopRecording();
        } else {
            // If not actively recording (e.g., user cancelled prompt, or stopped before recorder started fully)
            cleanupActiveRecording();
            setRecordingState('idle');
        }
      };

      const options = { mimeType: 'video/webm; codecs=vp9' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        console.warn("VP9 codec might not be supported, trying default.", e);
        try {
            recorder = new MediaRecorder(stream); // Fallback to default
        } catch (fallbackError) {
            console.error("Failed to create MediaRecorder with default options:", fallbackError);
            // Provide a more specific error if possible
            const message = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
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
        // Check if chunks were actually recorded
        if (recordedChunksRef.current.length === 0) {
            console.warn("Recording stopped with no data chunks.");
            setRecordingState('idle'); // Go back to idle if nothing was saved
            cleanupActiveRecording(); // Clean up stream etc.
            return;
        }

        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);

        const newRecording: Recording = {
            id: `rec_${Date.now()}`, // More unique ID
            url: url,
            name: `Recording ${recordings.length + 1}`,
            timestamp: Date.now(),
        };
        setRecordings(prev => [...prev, newRecording]);

        setCurrentVideoUrl(url); // Set for potential immediate viewing
        setRecordingState('recorded'); // Indicate recording finished and saved

        // Important: Don't call cleanupActiveRecording here, as the recorder instance is already stopped.
        // Nullify the ref as it's no longer active/valid for recording.
        mediaRecorderRef.current = null;
        // Stream tracks are stopped either by onended or explicitly in stopRecording call if needed.
      };

       recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        const errorMessage = (event as any)?.error?.message || 'Unknown recording error';
        setError(`Recording error: ${errorMessage}`);
        cleanupActiveRecording();
        setRecordingState('error');
      };

      // Start the recorder
      recorder.start();
      // Update state *after* recorder starts successfully
      setRecordingState('recording');

    } catch (err) {
      console.error("Error starting screen recording:", err);
       let message = "An unknown error occurred.";
       if (err instanceof Error) {
            if (err.name === 'NotAllowedError') {
                message = "Permission denied. Please allow screen recording access.";
            } else if (err.message.includes("MediaRecorder")) {
                 message = `Recording setup failed: ${err.message}`;
            } else {
                message = `Failed to start recording: ${err.message}`;
            }
       }
       setError(message);
       cleanupActiveRecording();
       setRecordingState('error');
    }
  }, [cleanupActiveRecording, recordings.length, recordingState]); // Added recordingState dependency

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      setRecordingState('stopping'); // Indicate stopping process
      mediaRecorderRef.current.stop(); // This triggers 'onstop' eventually
      // Stop stream tracks immediately for responsiveness
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null; // Clear stream ref
      // State change to 'recorded' or 'idle' happens in 'onstop'
    } else {
        console.warn(`Stop recording called but recorder not active (state: ${mediaRecorderRef.current?.state}, ref: ${mediaRecorderRef.current})`);
        // If stop is called unexpectedly, ensure cleanup and reset state
        cleanupActiveRecording();
        setRecordingState('idle');
    }
  }, [cleanupActiveRecording]);

  // Effect for cleanup on component unmount - Revoke all stored URLs
  useEffect(() => {
    return () => {
      console.log("Cleaning up recorder component, revoking URLs...");
      cleanupActiveRecording(); // Clean up any active resources first
      recordings.forEach(rec => URL.revokeObjectURL(rec.url)); // Revoke stored URLs
      // Check if currentVideoUrl exists and is not part of the recordings list before revoking
      if (currentVideoUrl && !recordings.some(r => r.url === currentVideoUrl)) {
          console.log("Revoking dangling currentVideoUrl");
          URL.revokeObjectURL(currentVideoUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanupActiveRecording, recordings]); // Rerun if recordings list changes

  // Determine if the recorder instance itself is actively recording
  const isRecorderActive = recordingState === 'recording' && mediaRecorderRef.current?.state === 'recording';
  // Determine the general recording state for UI purposes (includes starting/stopping phases)
  const isRecordingProcessActive = recordingState === 'starting' || recordingState === 'recording' || recordingState === 'stopping';


  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {children}
      <Toolbar
        isRecording={isRecordingProcessActive} // Pass the general recording state
        isRecorderActive={isRecorderActive} // Pass the specific MediaRecorder state
        onStart={startRecording}
        onStop={stopRecording}
        onToggleList={toggleListView}
        recordingCount={recordings.length}
      />
       <RecordingsList
            recordings={recordings}
            onSelect={handleSelectRecording}
            isVisible={isListVisible}
        />
      {(recordingState === 'recorded' || recordingState === 'viewing') && currentVideoUrl && (
        <VideoPlayer src={currentVideoUrl} onClose={handleClosePlayer} />
      )}
      {recordingState === 'error' && error && (
         <div style={{
            position: 'absolute',
            top: '80px', // Position below the toolbar
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(239, 68, 68, 0.8)', // Error red, semi-transparent
            backdropFilter: 'blur(8px)',
            color: 'white',
            padding: '10px 15px',
            borderRadius: '8px',
            zIndex: 40, // Below toolbar/list but above content potentially
            fontSize: '14px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxWidth: '80%',
         }}>
            Error: {error}
            <button
              onClick={() => { setError(null); setRecordingState('idle'); }}
              style={{
                marginLeft: '10px',
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer',
                opacity: 0.7,
                verticalAlign: 'middle', // Align better with text
              }}
              aria-label="Dismiss error"
            >✕</button>
         </div>
      )}
    </div>
  );
};
