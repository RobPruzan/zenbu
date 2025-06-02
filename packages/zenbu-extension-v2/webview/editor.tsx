import React from "react";

export const EditorApp: React.FC = () => {
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>
        🎉 Yay I'm in editor wooo! 🎉
      </h1>
      <p style={{ fontSize: "20px", color: "#666" }}>
        This is the editor view with hot reload enabled!
      </p>
      <div style={{ marginTop: "40px" }}>
        <p>Edit this file and see it update instantly!</p>
      </div>
    </div>
  );
};
