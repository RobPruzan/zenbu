import { ChatMessage } from "zenbu-plugin/src/ws/utils";

export const AssistantMessage = ({ message }: { message: ChatMessage }) => {
  return (
    <div className="group mb-6 max-w-full pl-2">
      <div className="text-xs text-[#F2F2F7] whitespace-pre-wrap font-light leading-relaxed break-words overflow-auto">
        {message.content}
      </div>
    </div>
  );
};
