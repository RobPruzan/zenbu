import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/button";
import { X, Badge } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface Hint {
  key: string;
  description: string;
  category: string;
}

interface LeaderKeyHintsProps {
  hintsData?: Hint[]; // Make hintsData optional
  isVisible: boolean;
  onClose: () => void; // Optional: If needed for external close triggers
}

// Define Mock Data (can be moved or fetched later)
const mockHintsData: Hint[] = [
  { key: "f", description: "Find file", category: "Navigation" },
  { key: "p", description: "Project Palette", category: "Commands" },
  { key: "c", description: "Toggle Chat (Right)", category: "Panels" },
  { key: "w", description: "Toggle Website Tree (Left)", category: "Panels" },
  { key: "s", description: "Toggle Horizontal Split", category: "View" },
  { key: "m", description: "Toggle Mobile Split", category: "View" },
  { key: "t", description: "Toggle Terminal", category: "Panels" },
  { key: "d", description: "Toggle DevTools", category: "Panels" },
  { key: "i", description: "Inspect Element", category: "Tools" },
  { key: "?", description: "Show Help / Keybinds", category: "Meta" },
];

export function LeaderKeyHints({
  hintsData = mockHintsData, // Use mock data by default
  isVisible,
  onClose,
}: LeaderKeyHintsProps) {
  const hintsRef = React.useRef<HTMLDivElement>(null); // Ref for the main div

  // Effect to handle clicks outside the component
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        hintsRef.current &&
        !hintsRef.current.contains(event.target as Node)
      ) {
        onClose(); // Call onClose if click is outside
      }
    }

    // Bind the event listener only when the hints are visible
    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Cleanup function to remove the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible, onClose]); // Re-run effect if isVisible or onClose changes

  // Group hints by category
  const groupedHints = hintsData.reduce(
    (acc, hint) => {
      const category = hint.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(hint);
      return acc;
    },
    {} as Record<string, Hint[]>,
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform"
          style={{ minWidth: "400px", maxWidth: "600px" }} // Adjust width as needed
          ref={hintsRef} // Assign ref to the motion div
        >
          <Card className="bg-background border border-border/60 shadow-xl relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-7 w-7 rounded-md z-10 text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close Hints</span>
            </Button>
            <CardContent className="p-4 pt-5">
              {" "}
              {/* Added top padding to avoid overlap with button */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {" "}
                {/* Adjust grid columns as needed */}
                {Object.entries(groupedHints).map(([category, hints]) => (
                  <div key={category} className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      {category}
                    </h4>
                    {hints.map((hint) => (
                      <div
                        key={hint.key}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-foreground/90">
                          {hint.description}
                        </span>
                        <Badge
                          variant="outline"
                          className="ml-2 px-1.5 font-mono text-xs"
                        >
                          {hint.key}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
