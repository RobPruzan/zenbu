import { SliceCreator } from "../chat-instance-context";

export type ToolbarSliceInitialState = {
  state: Idle;
};

export type ToolbarState = Recording | Drawing | Idle;

type Recording = {
  kind: "recording";
};

type Drawing = {
  kind: "drawing";
};

type Idle = {
  kind: "idle";
};

export type ToolbarSlice = {
  state: ToolbarState;
  actions: {
    setState: (state: ToolbarState) => void;
  };
};

export const createToolbarSLice =
  (initialState: ToolbarSliceInitialState): SliceCreator<ToolbarSlice> =>
  (set) => ({
    state: initialState.state,
    actions: {
      setState: (toolbarState) =>
        set((writableState) => {
          writableState.toolbar.state = toolbarState;
        }),
    },
  });
