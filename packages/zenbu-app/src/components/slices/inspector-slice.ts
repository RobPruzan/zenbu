import { InspectorState } from "zenbu-devtools";
import { SliceCreator } from "../chat-store";


export type InspectorSliceInitialState = {
  state: InspectorState;
};


export type InspectorSlice = {
  state: InspectorState;
  actions: {
    setInspectorState: (state: InspectorState) => void;
  };
};

export const createInspectorSlice =
  (initialState: InspectorSliceInitialState): SliceCreator<InspectorSlice> =>
  (set, get) => ({
    state: initialState.state,
    actions: {
      setInspectorState: (inspectorState) =>
        set((state) => {
          state.inspector.state = {
            ...state.inspector.state,
            ...inspectorState,
          };
        }),
    },
  });
