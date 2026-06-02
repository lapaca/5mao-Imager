import { MAX_UPLOAD_BYTES } from "./constants";
import type { GenerationMode } from "./types";

const SUPPORTED_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

export function validateImageFile(file: File): string | null {
  if (!SUPPORTED_TYPES.has(file.type)) {
    return "Only PNG, JPG, JPEG, and WebP are supported";
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return "Image size cannot exceed 25MB";
  }

  return null;
}

export function createImageFileName(
  mode: GenerationMode,
  date = new Date(),
  shortId = crypto.randomUUID().slice(0, 6)
): string {
  const prefix = mode === "text-to-image" ? "text" : "image";
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");

  return `gptimage2-${prefix}-${stamp}-${shortId}.png`;
}

export function downloadImageUrl(imageUrl: string, fileName: string): void {
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function saveImageToDirectory(
  directoryHandle: FileSystemDirectoryHandle,
  imageUrl: string,
  fileName: string
): Promise<void> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Unable to download generated image for auto-save");
  }

  const blob = await response.blob();
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}
