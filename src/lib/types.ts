export type GenerationMode = "text-to-image" | "image-to-image";

export type ImageSize =
  | "1024x1024"
  | "2048x2048"
  | "1080x1920"
  | "1320x2868"
  | "1440x2560"
  | "2160x3840"
  | "1920x1080"
  | "2560x1440"
  | "3840x2160"
  | "1080x1350"
  | "1080x1440";

export interface ApiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  generationPath: string;
  editPath: string;
  useLocalProxy: boolean;
}

export interface HistoryRecord {
  id: string;
  imageUrl: string;
  mode: GenerationMode;
  prompt: string;
  size: ImageSize;
  createdAt: string;
  saved: boolean;
  fileName: string;
}

export interface DimensionPreset {
  category: string;
  label: string;
  value: ImageSize;
}

export type RequestStatus = "idle" | "loading" | "success" | "failure" | "timeout";
