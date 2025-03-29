import React, { useState, useEffect, useRef } from 'react';

// ReasoningUI Component (Original with minor adjustments)
const ReasoningUI: React.FC<{ thoughts: string[]; isThinking: boolean; timer: number }> = ({
  thoughts,
  isThinking,
  timer,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Function to toggle expand/collapse state
  const toggleExpand = (): void => {
    setIsExpanded((prev) => !prev);
  };

  // Determine if content should be shown
  const showContent: boolean = isThinking || isExpanded;

  return (
    <div className="bg-gray-900 text-white p-4 min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Mock user prompt */}
        <div className="bg-gray-700 p-2 rounded mb-2">
          User: Write an essay about climate change.
        </div>

        {/* Reasoning container */}
        {(isThinking || thoughts.length > 0) && (
          <div className="bg-gray-800 p-4 rounded-lg">
            {/* Header with state indicator, icon, and timer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {isThinking ? (
                  <span className="text-blue-400 font-semibold">
                    🧠 Thinking {timer}s
                  </span>
                ) : (
                  <span className="text-green-400 font-semibold">
                    💡 Thought for {timer}s
                  </span>
                )}
              </div>
              {/* Expand/Collapse control, only shown when not thinking */}
              {!isThinking && (
                <button
                  onClick={toggleExpand}
                  className="text-gray-400 flex items-center"
                >
                  {isExpanded ? 'Collapse' : 'Expand'} for details
                  <span className="ml-1">{isExpanded ? '▲' : '▼'}</span>
                </button>
              )}
            </div>

            {/* Content area with streaming thoughts */}
            {showContent && (
              <ul className="list-disc list-inside mt-2 text-gray-300">
                {thoughts.map((thought, index) => (
                  <li key={index}>{thought}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// TokenStreamingWrapper Component
export const TokenStreamingWrapper: React.FC = () => {
  const [isThinking, setIsThinking] = useState(false);
  const [tokens, setTokens] = useState<string[]>([]);
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sample text to stream, split into tokens (words)
  const sampleText: string[] = "The quick brown fox jumps over the lazy dog and runs away happily".split(" ");

  // Effect to handle token streaming
  useEffect(() => {
    if (isThinking) {
      intervalRef.current = setInterval(() => {
        setTokens((prev) => {
          if (prev.length < sampleText.length) {
            return [...prev, sampleText[prev.length]];
          } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsThinking(false);
            return prev;
          }
        });
      }, 10); // ~100 tokens per second (10ms per token)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isThinking]);

  // Effect to handle the timer
  useEffect(() => {
    if (isThinking) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000); // Increment timer every second
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [isThinking]);

  // Function to start the streaming process
  const startStreaming = (): void => {
    setTokens([]);
    setTimer(0);
    setIsThinking(true);
  };

  return (
    <div>
      {/* Button to trigger the streaming process */}
      <div className="flex justify-center mb-4">
        <button
          onClick={startStreaming}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Submit Prompt
        </button>
      </div>
      {/* Pass streamed tokens as thoughts to ReasoningUI */}
      <ReasoningUI thoughts={tokens} isThinking={isThinking} timer={timer} />
    </div>
  );
};

export default TokenStreamingWrapper;