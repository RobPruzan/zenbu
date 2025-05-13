"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "src/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-start pt-14 gap-4">
      <Image src="/mascot.png" width={400} height={400} alt="Zenbu mascot" />

      <div className="flex flex-col items-center gap-2 -mt-4">
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <p className="text-zinc-400">
          The page you are looking for does not exist.
        </p>
      </div>

      <Button variant="outline" onClick={() => router.push("/home")}>
        Return Home
      </Button>
    </div>
  );
}
