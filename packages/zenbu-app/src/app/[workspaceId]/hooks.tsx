"use client";

import { useParams } from "next/navigation";
import { useRef, useState, useMemo, useEffect } from "react";
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

export const THUMBNAIL_WIDTH_PX = 160;
export const useThumbnailScaleCalc = () => {
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [measuredSize, setMeasuredSize] = useState<{
    width: number | null;
    height: number | null;
  }>({ width: null, height: null });

  const thumbnailScale = useMemo(() => {
    const width = measuredSize.width ?? 800;
    return THUMBNAIL_WIDTH_PX / width;
  }, [measuredSize.width]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setMeasuredSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    const currentRef = previewContainerRef.current;
    if (currentRef) {
      setMeasuredSize({
        width: currentRef.offsetWidth,
        height: currentRef.offsetHeight,
      });
      observer.observe(currentRef);
    }
    return () => {
      if (currentRef) observer.unobserve(currentRef);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--thumbnail-scale",
      thumbnailScale.toString(),
    );
  }, [thumbnailScale]);

  return { previewContainerRef, measuredSize };
};

export const useThumbnailDim = ({
  measuredSize,
}: {
  measuredSize: { width: number | null; height: number | null };
}) => {
  const measuredAspectRatio = useMemo(() => {
    const { width, height } = measuredSize;
    return width && height ? height / width : 2 / 3;
  }, [measuredSize]);

  const thumbnailContainerHeight = useMemo(
    () => THUMBNAIL_WIDTH_PX * measuredAspectRatio,
    [measuredAspectRatio],
  );

  const iframeW = measuredSize.width ?? 800;
  const iframeH = measuredSize.height ?? iframeW * measuredAspectRatio;

  return {
    iframeW,
    iframeH,
    thumbnailContainerHeight
  };
};
