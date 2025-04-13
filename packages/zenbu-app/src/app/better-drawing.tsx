import { useEffect, useState } from "react";
import { Editor, Tldraw, TLEditorComponents } from "tldraw";
import { useChatStore } from "~/components/chat-store";
import "tldraw/tldraw.css";

const getDrawingComponents = (): TLEditorComponents => {
  // might be smart to have the option to apply a background incase you wanted to make something in isolation?
  return {
    Background: () => null,
  };
};
export const BetterDrawing = () => {
  const { actions, state } = useChatStore((state) => state.toolbar);



  if (!state.drawing.active) {
    // sub optimal if we want to persist state (we do, but ez for now)
    return;
  }

  // useEffect(() => {
  //   if (!editorInstance) {
  //     return;
  //   }

  // }, [editorInstance, active]);
  return (
    <div
      style={{
        position: "absolute",
        // inset: 0,

        pointerEvents: "auto",
        zIndex: 200,
        height: "100%",
        width: "100%",
        background: "transparent",
      }}
      className="tldraw-wrapper"
    >
      {/* <style jsx global>{`
        .tldraw-wrapper .tl-canvas {
          background: transparent !important;
        }
        .tldraw-wrapper .tl-container {
          background: transparent !important;
        }
      `}</style> */}

      <Tldraw
        // hideU1653/690==i
        // hideUi
        cameraOptions={{
          isLocked: true,
        }}
        components={getDrawingComponents()}
        onMount={(editor) => {
          // listeners.forEach((listener) => {
          //   listener(editor);
          // });
          actions.setGetEditor(() => editor);
          // setEditorInstance(editor);
          editor.user.updateUserPreferences({ colorScheme: "dark" });
        }}
      />
    </div>
  );
};

export const captureViewport = async (editor: Editor) => {
  const viewportBounds = editor.getViewportPageBounds();
  if (!viewportBounds) return;

  const shapes = editor.getCurrentPageShapes();

  if (shapes.length) {
    const imageBlob = await editor.toImage(
      shapes.map((s) => s.id),
      {
        bounds: viewportBounds,

        background: false,
        padding: 0,
        format: "png",
        darkMode: true,
      },
    );

    const dataURI = await blobToDataURI(imageBlob.blob);

    return dataURI;
  }
};

function blobToDataURI(blob: Blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
