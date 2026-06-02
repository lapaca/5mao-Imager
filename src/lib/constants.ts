import type { DimensionPreset } from "./types";

export const MODEL_NAME = "gpt-image-2";
export const DEFAULT_SIZE = "1024x1024";
export const REQUEST_TIMEOUT_MS = 600_000;
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const DIMENSION_PRESETS: DimensionPreset[] = [
  { category: "Avatar/Square", label: "1:1 Avatar - 1024", value: "1024x1024" },
  { category: "Avatar/Square", label: "1:1 HD Square - 2048", value: "2048x2048" },
  { category: "Mobile Wallpaper", label: "9:16 Mobile - 1080p", value: "1080x1920" },
  { category: "Mobile Wallpaper", label: "iOS Vertical", value: "1320x2868" },
  { category: "Mobile Wallpaper", label: "2K Vertical", value: "1440x2560" },
  { category: "Mobile Wallpaper", label: "4K Vertical", value: "2160x3840" },
  { category: "PC Wallpaper", label: "16:9 Desktop - 1080p", value: "1920x1080" },
  { category: "PC Wallpaper", label: "16:9 Desktop - 2K", value: "2560x1440" },
  { category: "PC Wallpaper", label: "16:9 Desktop - 4K", value: "3840x2160" },
  { category: "Social Vertical", label: "4:5 Social Vertical", value: "1080x1350" },
  { category: "Social Vertical", label: "3:4 Social Vertical", value: "1080x1440" },
];
