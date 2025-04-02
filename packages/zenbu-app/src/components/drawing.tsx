import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

export const Draw = () => {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "auto" }}>
      <Tldraw
        components={{
          Background: () => null,
        }}
        cameraOptions={{
          isLocked: true,
        }}
        hideUi={false}
        onMount={(editor) => {
          editor.user.updateUserPreferences({ colorScheme: "dark" });
        }}
      />
    </div>
  );
};
