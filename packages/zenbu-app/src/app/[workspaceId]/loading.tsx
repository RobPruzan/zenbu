export default function Loading() {
  return (
    <div className="w-screen h-screen bg-gradient-to-b from-black to-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-zinc-700 border-t-zinc-300 animate-spin"></div>
        {/* <div className="text-zinc-400 text-lg font-light">Loading workspace...</div> */}
      </div>
    </div>
  );
}
