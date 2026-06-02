import type { ApiConfig, ImageSize } from "./types";

type Fetcher = typeof fetch;

interface CommonRequest {
  config: ApiConfig;
  prompt: string;
  size: ImageSize;
  signal?: AbortSignal;
  timeoutMs: number;
  fetcher?: Fetcher;
}

interface ImageEditRequest extends CommonRequest {
  image: File;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly kind: "failure" | "timeout" | "network" | "cors"
  ) {
    super(message);
  }
}

export async function generateTextImage({
  config,
  prompt,
  size,
  signal,
  timeoutMs,
  fetcher = fetch,
}: CommonRequest): Promise<string> {
  const response = await fetchWithTimeout(
    buildRequestUrl(config, config.generationPath || "/images/generations"),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...buildProxyHeaders(config),
      },
      body: JSON.stringify({
        model: config.model || "gpt-image-2",
        prompt,
        n: 1,
        size,
      }),
      signal,
    },
    timeoutMs,
    fetcher
  );

  return parseImageUrl(response);
}

export async function generateImageEdit({
  config,
  prompt,
  size,
  image,
  signal,
  timeoutMs,
  fetcher = fetch,
}: ImageEditRequest): Promise<string> {
  const form = new FormData();
  form.append("model", config.model || "gpt-image-2");
  form.append("prompt", prompt);
  form.append("n", "1");
  form.append("size", size);
  form.append("image", image);

  const response = await fetchWithTimeout(
    buildRequestUrl(config, config.editPath || "/images/edits"),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        ...buildProxyHeaders(config),
      },
      body: form,
      signal,
    },
    timeoutMs,
    fetcher
  );

  return parseImageUrl(response);
}

function buildRequestUrl(config: ApiConfig, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (config.useLocalProxy) {
    return `/gptimage2-proxy${normalizedPath}`;
  }

  return `${config.baseUrl.replace(/\/+$/, "")}${normalizedPath}`;
}

function buildProxyHeaders(config: ApiConfig): Record<string, string> {
  if (!config.useLocalProxy) {
    return {};
  }

  return {
    "X-GPTImage2-Target-Base-URL": config.baseUrl.replace(/\/+$/, ""),
  };
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  fetcher: Fetcher
): Promise<Response> {
  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(() => timeoutController.abort(), timeoutMs);
  const signal = combineSignals(options.signal ?? undefined, timeoutController.signal);

  try {
    const response = await fetcher(url, { ...options, signal });
    if (!response.ok) {
      throw new ApiRequestError(await readErrorMessage(response), "failure");
    }

    return response;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }
    if (timeoutController.signal.aborted) {
      throw new ApiRequestError("Generation timed out, please try again later", "timeout");
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ApiRequestError(
      "Network request failed. Please check network, Base URL, or CORS support.",
      "network"
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function parseImageUrl(response: Response): Promise<string> {
  const payload = (await response.json()) as unknown;
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    const first = (payload as { data: Array<{ b64_json?: unknown; url?: unknown }> }).data[0];
    if (first && typeof first.url === "string" && first.url) {
      return first.url;
    }
    if (first && typeof first.b64_json === "string" && first.b64_json) {
      return first.b64_json.startsWith("data:")
        ? first.b64_json
        : `data:image/png;base64,${first.b64_json}`;
    }
  }

  throw new ApiRequestError("API response did not include a generated image", "failure");
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: { message?: string }; message?: string };
    return payload.error?.message || payload.message || "Image generation failed";
  } catch {
    return "Image generation failed";
  }
}

function combineSignals(signalA: AbortSignal | undefined, signalB: AbortSignal): AbortSignal {
  if (!signalA) {
    return signalB;
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  signalA.addEventListener("abort", abort, { once: true });
  signalB.addEventListener("abort", abort, { once: true });
  return controller.signal;
}
