import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "~/components/ImageUpload";
import { ImagePreview } from "~/components/ImagePreview";
import { ProcessingStatus } from "~/components/ProcessingStatus";
import {
  DownloadButton,
  BatchDownloadButton,
} from "~/components/DownloadButton";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Gemini Watermark Remover" },
    {
      name: "description",
      content: "Remove Gemini watermarks from images with ease.",
    },
  ];
}

interface UploadedImage {
  id: string;
  originalName: string;
  file: File;
}

type ViewState = "upload" | "processing" | "results";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [viewState, setViewState] = useState<ViewState>("upload");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () => new Set()
  );
  const [errorIds, setErrorIds] = useState<Set<string>>(() => new Set());
  const [isUploading, setIsUploading] = useState(false);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > 10) {
        toast.warning("Maximum 10 files. Extra files were not added.");
        return combined.slice(0, 10);
      }
      return combined;
    });
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearAll = useCallback(() => {
    setFiles([]);
  }, []);

  const handleProcessImages = useCallback(async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Upload failed");
        setIsUploading(false);
        return;
      }

      const data = await res.json();
      const accepted: UploadedImage[] = [];
      let rejectedCount = 0;

      for (const result of data.results) {
        if (result.status === "accepted") {
          const file = files.find((f) => f.name === result.originalName);
          if (file) {
            accepted.push({
              id: result.id,
              originalName: result.originalName,
              file,
            });
          }
        } else {
          rejectedCount++;
          toast.error(`${result.originalName}: ${result.error}`);
        }
      }

      if (accepted.length > 0) {
        setUploadedImages(accepted);
        setViewState("processing");
        toast.success(
          `${accepted.length} image${accepted.length > 1 ? "s" : ""} uploaded for processing`
        );
      }

      if (rejectedCount > 0 && accepted.length === 0) {
        toast.error("All files were rejected. Check the file requirements.");
      }
    } catch {
      toast.error("Upload failed. Please check your connection and try again.");
    } finally {
      setIsUploading(false);
    }
  }, [files]);

  const handleComplete = useCallback((id: string) => {
    setCompletedIds((prev) => new Set(prev).add(id));
  }, []);

  const handleError = useCallback((id: string, message: string) => {
    setErrorIds((prev) => new Set(prev).add(id));
  }, []);

  const handleStartOver = useCallback(() => {
    setFiles([]);
    setUploadedImages([]);
    setCompletedIds(new Set());
    setErrorIds(new Set());
    setViewState("upload");
  }, []);

  const allDone =
    uploadedImages.length > 0 &&
    uploadedImages.every(
      (img) => completedIds.has(img.id) || errorIds.has(img.id)
    );

  const completedArray = uploadedImages
    .filter((img) => completedIds.has(img.id))
    .map((img) => img.id);

  // Auto-transition to results when all done
  if (allDone && viewState === "processing") {
    setViewState("results");
  }

  return (
    <div className="space-y-6">
      {viewState === "upload" && (
        <>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Remove Gemini Watermarks
            </h2>
            <p className="text-muted-foreground">
              Upload your images and we'll remove Gemini watermarks
              automatically.
            </p>
          </div>

          <ImageUpload
            onFilesSelected={handleFilesSelected}
            disabled={isUploading}
          />

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {files.length} file{files.length > 1 ? "s" : ""} selected
                </p>
                <Button variant="ghost" size="sm" onClick={handleClearAll}>
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {files.map((file, index) => (
                  <ImagePreview
                    key={`${file.name}-${index}`}
                    file={file}
                    onRemove={() => handleRemoveFile(index)}
                  />
                ))}
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleProcessImages}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  `Process ${files.length} Image${files.length > 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          )}

          {files.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                <p className="text-sm">
                  No images selected yet. Upload images above to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {(viewState === "processing" || viewState === "results") && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {viewState === "processing"
                  ? "Processing Images"
                  : "Results"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {completedIds.size} of {uploadedImages.length} complete
                {errorIds.size > 0 &&
                  ` (${errorIds.size} failed)`}
              </p>
            </div>
            <div className="flex gap-2">
              {completedArray.length > 1 && (
                <BatchDownloadButton ids={completedArray} />
              )}
              <Button variant="outline" onClick={handleStartOver}>
                Start Over
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {uploadedImages.map((img) => (
              <div key={img.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <ProcessingStatus
                    id={img.id}
                    originalName={img.originalName}
                    onComplete={handleComplete}
                    onError={handleError}
                  />
                </div>
                {completedIds.has(img.id) && (
                  <DownloadButton
                    id={img.id}
                    originalName={img.originalName}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
