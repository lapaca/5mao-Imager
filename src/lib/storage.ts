import type { ApiConfig, HistoryRecord } from "./types";

const CONFIG_KEY = "gptimage2.config";
const HISTORY_KEY = "gptimage2.history";
const DEFAULT_PROVIDER_BASE_URL = "https://cc-vibe.com";
const DEFAULT_CONFIG_FIELDS = {
  model: "gpt-image-2",
  generationPath: "/images/generations",
  editPath: "/images/edits",
  useLocalProxy: false,
};

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

export function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) {
    return "/";
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function normalizeApiConfig(config: Partial<ApiConfig> & Pick<ApiConfig, "apiKey" | "baseUrl">): ApiConfig {
  const normalizedBaseUrl = normalizeBaseUrl(config.baseUrl);
  const isLegacyLocalProxyUrl = normalizedBaseUrl.includes("/gptimage2-proxy");

  return {
    apiKey: config.apiKey,
    baseUrl: isLegacyLocalProxyUrl ? DEFAULT_PROVIDER_BASE_URL : normalizedBaseUrl,
    model: config.model?.trim() || DEFAULT_CONFIG_FIELDS.model,
    generationPath: normalizePath(config.generationPath || DEFAULT_CONFIG_FIELDS.generationPath),
    editPath: normalizePath(config.editPath || DEFAULT_CONFIG_FIELDS.editPath),
    useLocalProxy: isLegacyLocalProxyUrl || Boolean(config.useLocalProxy),
  };
}

export function saveApiConfig(config: Partial<ApiConfig> & Pick<ApiConfig, "apiKey" | "baseUrl">): void {
  const normalized = normalizeApiConfig(config);
  localStorage.setItem(
    CONFIG_KEY,
    JSON.stringify(normalized)
  );
}

export function loadApiConfig(): ApiConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ApiConfig>;
    if (typeof parsed.apiKey !== "string" || typeof parsed.baseUrl !== "string") {
      return null;
    }

    return normalizeApiConfig({
      apiKey: parsed.apiKey,
      baseUrl: parsed.baseUrl,
      model: parsed.model,
      generationPath: parsed.generationPath,
      editPath: parsed.editPath,
      useLocalProxy: parsed.useLocalProxy,
    });
  } catch {
    return null;
  }
}

export function saveHistory(history: HistoryRecord[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function loadHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isHistoryRecord);
  } catch {
    return [];
  }
}

function isHistoryRecord(record: unknown): record is HistoryRecord {
  if (!record || typeof record !== "object") {
    return false;
  }

  const candidate = record as Partial<HistoryRecord>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.imageUrl === "string" &&
    (candidate.mode === "text-to-image" || candidate.mode === "image-to-image") &&
    typeof candidate.prompt === "string" &&
    typeof candidate.size === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.saved === "boolean" &&
    typeof candidate.fileName === "string"
  );
}
