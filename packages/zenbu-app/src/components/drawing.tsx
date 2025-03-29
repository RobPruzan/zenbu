import { Tldraw } from "tldraw";

import "tldraw/tldraw.css";
export const Draw = ({ children }: { children: React.ReactNode }) => {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {children}
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
            editor.user.updateUserPreferences({ colorScheme: 'dark' });
          }}
        />
      </div>
    </div>
  );
};
