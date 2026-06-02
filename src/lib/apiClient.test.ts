import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError, generateImageEdit, generateTextImage } from "./apiClient";
import type { ApiConfig } from "./types";

const baseConfig: ApiConfig = {
  apiKey: "private-key",
  baseUrl: "https://cc-vibe.com",
  model: "gpt-image-2",
  generationPath: "/images/generations",
  editPath: "/images/edits",
  useLocalProxy: false,
};

describe("api client", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("posts text generation requests to the configured base URL", async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => {
      void _input;
      void _init;
      return Response.json({ data: [{ url: "https://example.com/result.png" }] });
    });

    const result = await generateTextImage({
      config: baseConfig,
      prompt: "A wallpaper",
      size: "1320x2868",
      fetcher: fetchMock as unknown as typeof fetch,
      timeoutMs: 1000,
    });

    expect(result).toBe("https://example.com/result.png");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://cc-vibe.com/images/generations",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer private-key",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          model: "gpt-image-2",
          prompt: "A wallpaper",
          n: 1,
          size: "1320x2868",
        }),
      })
    );
  });

  it("uses configured model and generation path", async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => {
      void _input;
      void _init;
      return Response.json({ data: [{ url: "https://example.com/custom.png" }] });
    });

    await generateTextImage({
      config: {
        apiKey: "private-key",
        baseUrl: "https://third-party.example",
        model: "custom-image-model",
        generationPath: "/v1/custom/generate",
        editPath: "/v1/custom/edit",
        useLocalProxy: false,
      },
      prompt: "A wallpaper",
      size: "1024x1024",
      fetcher: fetchMock as unknown as typeof fetch,
      timeoutMs: 1000,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://third-party.example/v1/custom/generate",
      expect.objectContaining({
        body: JSON.stringify({
          model: "custom-image-model",
          prompt: "A wallpaper",
          n: 1,
          size: "1024x1024",
        }),
      })
    );
  });

  it("routes requests through the local proxy when enabled", async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => {
      void _input;
      void _init;
      return Response.json({ data: [{ url: "https://example.com/proxy.png" }] });
    });

    await generateTextImage({
      config: {
        apiKey: "private-key",
        baseUrl: "https://third-party.example/",
        model: "custom-image-model",
        generationPath: "images",
        editPath: "edits",
        useLocalProxy: true,
      },
      prompt: "A wallpaper",
      size: "1024x1024",
      fetcher: fetchMock as unknown as typeof fetch,
      timeoutMs: 1000,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/gptimage2-proxy/images",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer private-key",
          "Content-Type": "application/json",
          "X-GPTImage2-Target-Base-URL": "https://third-party.example",
        }),
      })
    );
  });

  it("posts image edits as multipart form data", async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => {
      void _input;
      void _init;
      return Response.json({ data: [{ url: "https://example.com/edit.png" }] });
    });
    const image = new File(["image"], "base.png", { type: "image/png" });

    const result = await generateImageEdit({
      config: baseConfig,
      prompt: "Make it brighter",
      size: "1024x1024",
      image,
      fetcher: fetchMock as unknown as typeof fetch,
      timeoutMs: 1000,
    });

    expect(result).toBe("https://example.com/edit.png");
    const options = fetchMock.mock.calls[0]?.[1];
    if (!options) {
      throw new Error("Expected fetch options");
    }
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ Authorization: "Bearer private-key" });
    expect(options.body).toBeInstanceOf(FormData);
  });

  it("surfaces API error messages", async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => {
      void _input;
      void _init;
      return Response.json({ error: { message: "Insufficient balance" } }, { status: 402 });
    });

    await expect(
      generateTextImage({
        config: baseConfig,
        prompt: "A wallpaper",
        size: "1320x2868",
        fetcher: fetchMock as unknown as typeof fetch,
        timeoutMs: 1000,
      })
    ).rejects.toMatchObject({
      kind: "failure",
      message: "Insufficient balance",
    } satisfies Partial<ApiRequestError>);
  });

  it("uses base64 image responses when the API does not return a URL", async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => {
      void _input;
      void _init;
      return Response.json({ data: [{ b64_json: "abc123" }] });
    });

    const result = await generateTextImage({
      config: baseConfig,
      prompt: "A wallpaper",
      size: "1024x1024",
      fetcher: fetchMock as unknown as typeof fetch,
      timeoutMs: 1000,
    });

    expect(result).toBe("data:image/png;base64,abc123");
  });

  it("does not double-prefix base64 data URLs", async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => {
      void _input;
      void _init;
      return Response.json({ data: [{ b64_json: "data:image/png;base64,abc123" }] });
    });

    const result = await generateTextImage({
      config: baseConfig,
      prompt: "A wallpaper",
      size: "1024x1024",
      fetcher: fetchMock as unknown as typeof fetch,
      timeoutMs: 1000,
    });

    expect(result).toBe("data:image/png;base64,abc123");
  });

  it("rejects unresolved requests after the timeout", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_input: string | URL | Request, _init?: RequestInit) => {
      void _input;
      return new Promise<Response>((_resolve, reject) => {
        _init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("The operation was aborted.", "AbortError")),
          { once: true }
        );
      });
    });

    const request = generateTextImage({
      config: baseConfig,
      prompt: "A wallpaper",
      size: "1320x2868",
      fetcher: fetchMock as unknown as typeof fetch,
      timeoutMs: 50,
    });

    const assertion = expect(request).rejects.toMatchObject({
      kind: "timeout",
      message: "Generation timed out, please try again later",
    } satisfies Partial<ApiRequestError>);
    await vi.advanceTimersByTimeAsync(51);
    await assertion;
  });
});
