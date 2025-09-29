export function ChatMessageLoading() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-800 rounded-lg p-4 max-w-4xl">
        <div className="flex items-center gap-2 text-gray-400">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
          </div>
          <span className="text-sm">AI is thinking...</span>
        </div>
      </div>
    </div>
  );
}
