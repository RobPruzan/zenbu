import { Editor } from "tldraw";
import { SliceCreator } from "../chat-instance-context";

export type Route = "network" | "console" | "performance" | "off";

export type ToolbarSliceInitialState = {
  state: ToolbarState;
};

export type ToolbarState = {
  activeRoute: Route;
  drawing:
    | {
        active: false;
        getEditor: () => Editor | null;
      }
    | {
        active: true;
        getEditor: () => Editor | null;
      };
  screenshotting:
    | {
        active: false;
      }
    | {
        active: true;
      };
};

export type ToolbarSlice = {
  state: ToolbarState;
  actions: {
    // setState: (state: ToolbarState) => void;
    setIsDrawing: (isDrawing: boolean) => void;
    setIsScreenshotting: (isScreenshotting: boolean) => void;
    setRoute: (route: Route) => void;
    setGetEditor: (getEditor: () => Editor) => void;
  };
};

export const createToolbarSLice =
  (initialState: ToolbarSliceInitialState): SliceCreator<ToolbarSlice> =>
  (set) => ({
    state: initialState.state,
    actions: {
      setGetEditor: (getEditor) =>
        set((state) => {
          state.toolbar.state.drawing.getEditor = getEditor;
        }),
      setIsDrawing: (isDrawing) =>
        set((state) => {
          if (!isDrawing) {
            state.toolbar.state.drawing.getEditor = () => null;
          }
          state.toolbar.state.drawing.active = isDrawing;
        }),
      setIsScreenshotting: (isScreenshotting) =>
        set((state) => {
          state.toolbar.state.screenshotting.active = isScreenshotting;
        }),
      setRoute: (route) =>
        set((state) => {
          state.toolbar.state.activeRoute = route;
        }),
    },
  });
