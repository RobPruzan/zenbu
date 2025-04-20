export default function Loading() {
  return (
    <div className="flex h-screen bg-black text-white">
      <div className="w-12 h-full bg-black border-r border-zinc-800 animate-pulse"></div>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-[280px] h-7 bg-zinc-800/30 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
}
