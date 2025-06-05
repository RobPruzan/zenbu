import { useState } from "react";
import { Button } from "./components/ui/button";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="h-screen flex items-center justify-center">
      <Button
        variant={"outline"}
        onClick={() => setCount((count) => count + 1)}
      >
        count is {count}
      </Button>
    </div>
  );
}

export default App;
