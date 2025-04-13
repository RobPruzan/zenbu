import { SliceCreator } from "../chat-store";

export type ChatControlsInitialState = {
  input: string;
};
export type ChatControlsSlice = {
  state: {
    input: string;
  };
  actions: {
    setInput: (input: string) => void;
  };
};

export const createChatControlsSlice =
  (initialState: ChatControlsInitialState): SliceCreator<ChatControlsSlice> =>
  (set, get) => ({
    state: {
      input: initialState.input,
    },
    actions: {
      setInput: (input) =>
        set((prev) => {
          prev.chatControls.state.input = input;
        }),
    },
  });
