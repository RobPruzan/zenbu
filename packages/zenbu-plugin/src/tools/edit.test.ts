import { generateText } from "ai";
import { editFile, EditFileParams } from "./edit.js";
import { anthropic } from "@ai-sdk/anthropic";

const sampleReactComponentString = `import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './Counter.css';

/**
 * A complex counter component with multiple features
 * @param {Object} props - Component props
 * @returns {JSX.Element} Counter component
 */
function Counter({ initialValue = 0, step = 1, min = -10, max = 10, theme = 'light' }) {
  const [count, setCount] = useState(initialValue);
  const [history, setHistory] = useState([initialValue]);
  const [isAutoIncrementing, setIsAutoIncrementing] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [error, setError] = useState(null);
  
  const isAtMax = count >= max;
  const isAtMin = count <= min;

  const increment = useCallback(() => {
    setCount(prevCount => {
      const newCount = prevCount + step;
      if (newCount > max) {
        setError(\`Cannot exceed maximum value of \${max}\`);
        return prevCount;
      }
      setError(null);
      return newCount;
    });
  }, [max, step]);

  const decrement = useCallback(() => {
    setCount(prevCount => {
      const newCount = prevCount - step;
      if (newCount < min) {
        setError(\`Cannot go below minimum value of \${min}\`);
        return prevCount;
      }
      setError(null);
      return newCount;
    });
  }, [min, step]);

  const reset = () => {
    setCount(initialValue);
    setHistory([initialValue]);
    setError(null);
  };

  const toggleAutoIncrement = () => {
    setIsAutoIncrementing(prev => !prev);
  };

  const undo = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      setCount(newHistory[newHistory.length - 1]);
      setHistory(newHistory);
    }
  };

  const jumpToValue = (value) => {
    if (value >= min && value <= max) {
      setCount(value);
      setHistory(prev => [...prev, value]);
      setError(null);
    } else {
      setError(\`Value must be between \${min} and \${max}\`);
    }
  };

  useEffect(() => {
    setHistory(prev => [...prev, count]);
  }, [count]);

  useEffect(() => {
    if (isAutoIncrementing) {
      const id = setInterval(() => {
        increment();
      }, 1000);
      setIntervalId(id);
    } else if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAutoIncrementing, increment, intervalId]);

  const counterClass = \`counter counter-\${theme} \${isAtMax ? 'at-max' : ''} \${isAtMin ? 'at-min' : ''}\`;

  return (
    <div className={counterClass}>
      <h2>Counter: {count}</h2>
      {error && <div className="error-message">{error}</div>}
      
      <div className="buttons">
        <button onClick={decrement} disabled={isAtMin}>-</button>
        <button onClick={increment} disabled={isAtMax}>+</button>
        <button onClick={reset}>Reset</button>
        <button onClick={toggleAutoIncrement}>
          {isAutoIncrementing ? 'Stop Auto' : 'Start Auto'}
        </button>
        <button onClick={undo} disabled={history.length <= 1}>Undo</button>
      </div>
      
      <div className="jump-controls">
        <label>
          Jump to:
          <input 
            type="number" 
            min={min} 
            max={max}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                jumpToValue(parseInt(e.target.value, 10));
              }
            }}
          />
        </label>
      </div>
      
      <div className="stats">
        <p>Min: {min}</p>
        <p>Max: {max}</p>
        <p>Step Size: {step}</p>
        <p>History Length: {history.length}</p>
      </div>
    </div>
  );
}

Counter.propTypes = {
  initialValue: PropTypes.number,
  step: PropTypes.number,
  min: PropTypes.number,
  max: PropTypes.number,
  theme: PropTypes.oneOf(['light', 'dark', 'colorful'])
};

export default Counter;`;

const requestedEdit: EditFileParams = {
  targetFile: sampleReactComponentString,
  instructions: "Change the counter title from 'Counter:' to 'Count:'",
  codeEdit: `import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './Counter.css';

// ... existing code ...

  return (
    <div className={counterClass}>
      <h2>Count: {count}</h2>
      {error && <div className="error-message">{error}</div>}
      
// ... existing code ...`,
};

const complexEditExample: EditFileParams = {
  targetFile: sampleReactComponentString,
  instructions: "Add a dark mode toggle feature and refactor the component to use React hooks pattern",
  codeEdit: `import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import './Counter.css';

/**
 * A complex counter component with multiple features
 * @param {Object} props - Component props
 * @returns {JSX.Element} Counter component
 */
function Counter({ initialValue = 0, step = 1, min = -10, max = 10, theme: initialTheme = 'light' }) {
  const [count, setCount] = useState(initialValue);
  const [history, setHistory] = useState([initialValue]);
  const [isAutoIncrementing, setIsAutoIncrementing] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(initialTheme);
  
// ... existing code ...

  const toggleTheme = () => {
    setTheme(currentTheme => currentTheme === 'light' ? 'dark' : 'light');
  };

  const counterClass = useMemo(() => {
    return \`counter counter-\${theme} \${isAtMax ? 'at-max' : ''} \${isAtMin ? 'at-min' : ''}\`;
  }, [theme, isAtMax, isAtMin]);

// ... existing code ...

  return (
    <div className={counterClass}>
      <h2>Counter: {count}</h2>
      {error && <div className="error-message">{error}</div>}
      
      <div className="buttons">
        <button onClick={decrement} disabled={isAtMin}>-</button>
        <button onClick={increment} disabled={isAtMax}>+</button>
        <button onClick={reset}>Reset</button>
        <button onClick={toggleAutoIncrement}>
          {isAutoIncrementing ? 'Stop Auto' : 'Start Auto'}
        </button>
        <button onClick={undo} disabled={history.length <= 1}>Undo</button>
        <button onClick={toggleTheme}>Toggle Theme</button>
      </div>
      
// ... existing code ...`,
};

const performanceTestEdit: EditFileParams = {
  targetFile: sampleReactComponentString,
  instructions: "Optimize the component for performance by memoizing callbacks and values",
  codeEdit: `import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import './Counter.css';

// ... existing code ...

  const isAtMax = useMemo(() => count >= max, [count, max]);
  const isAtMin = useMemo(() => count <= min, [count, min]);

  const increment = useCallback(() => {
    setCount(prevCount => {
      const newCount = prevCount + step;
      if (newCount > max) {
        setError(\`Cannot exceed maximum value of \${max}\`);
        return prevCount;
      }
      setError(null);
      return newCount;
    });
  }, [max, step]);

// ... existing code ...

  const counterClass = useMemo(() => {
    return \`counter counter-\${theme} \${isAtMax ? 'at-max' : ''} \${isAtMin ? 'at-min' : ''}\`;
  }, [theme, isAtMax, isAtMin]);

// ... existing code ...`,
};

const isEditCorrect = async (editParams: EditFileParams, editResult: string) => {
  const response = await generateText({
    model: anthropic("claude-3-5-sonnet-latest"),
    prompt: `You are a code review assistant. Please evaluate if the following edit correctly implements the requested changes.

Original file:
${editParams.targetFile}

Edit instructions:
${editParams.instructions}

Requested code edit:
${editParams.codeEdit}

Result after edit:
${editResult}

Is the edit correct? Please respond with "Yes" or "No" followed by a brief explanation.`
  });
  
  return {
    correct: response.text.toLowerCase().startsWith("yes"),
    explanation: response.text
  };
}

async function runTests() {
  console.log("Running simple edit test...");
  const result = await editFile(requestedEdit);
  console.log("Simple edit result:", result.text);
  
  const simpleVerification = await isEditCorrect(requestedEdit, result.text);
  console.log("Simple edit verification:", simpleVerification.correct, "-", simpleVerification.explanation);
  
  console.log("\nRunning complex edit test...");
  const complexResult = await editFile(complexEditExample);
  console.log("Complex edit result:", complexResult.text);
  
  const complexVerification = await isEditCorrect(complexEditExample, complexResult.text);
  console.log("Complex edit verification:", complexVerification.correct, "-", complexVerification.explanation);
  
  console.log("\nRunning performance optimization test...");
  const perfResult = await editFile(performanceTestEdit);
  console.log("Performance edit result:", perfResult.text);
  
  const perfVerification = await isEditCorrect(performanceTestEdit, perfResult.text);
  console.log("Performance edit verification:", perfVerification.correct, "-", perfVerification.explanation);
}

await runTests();
