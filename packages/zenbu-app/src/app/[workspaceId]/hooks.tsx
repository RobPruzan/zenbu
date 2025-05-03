"use client";

import { useParams } from "next/navigation";
import { trpc } from "src/lib/trpc";

export const useUploadBackgroundImage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const setBackgroundImageMutation =
    trpc.workspace.setBackgroundImage.useMutation();

  return {
    setBackgroundImageMutation,
    upload: () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      input.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        if (!target || !target.files) return;
        const files = target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        const blob = new Blob([await files[0].arrayBuffer()]);
        formData.append("file", blob);

        const res = await fetch("http://localhost:5001/uploads", {
          body: formData,
          method: "POST",
        });

        const json = (await res.json()) as {
          success: true;
          fileName: string;
        };

        console.log("res", json);

        setBackgroundImageMutation.mutate({
          backgroundImageUrl: `http://localhost:5001/uploads/${json.fileName}`,
          workspaceId,
        });
      };

      input.click();
    },
  };
};
