import { Project } from "zenbu-daemon";
import { SliceCreator } from "../chat-store";

export type IFrameSliceInitialState = {
  url: string;
  project: Project;
};
export type IFrameSliceState = {
  url: string;
  project: Project;
};

export type IFrameSlice = {
  state: IFrameSliceInitialState;
  actions: {
    setState: (state: Partial<IFrameSliceState>) => void;
  };
};

// export const createIFrameSlice =
//   (initialState: IFrameSliceInitialState): SliceCreator<IFrameSlice> =>
//   (set, get) => ({
//     state: initialState,
//     actions: {
//       setState: (inspectorState) =>
//         set((state) => {
//           state.iframe.state = {
//             ...state.iframe.state,
//             ...inspectorState,
//           };
//         }),
//     },
//   });
