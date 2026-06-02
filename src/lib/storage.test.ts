import { beforeEach, describe, expect, it } from "vitest";
import {
  loadApiConfig,
  loadHistory,
  saveApiConfig,
  saveHistory,
} from "./storage";
import type { HistoryRecord } from "./types";

describe("local storage helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves API config with a normalized base URL", () => {
    saveApiConfig({ apiKey: "secret-key", baseUrl: "https://cc-vibe.com///" });

    expect(loadApiConfig()).toEqual({
      apiKey: "secret-key",
      baseUrl: "https://cc-vibe.com",
      editPath: "/images/edits",
      generationPath: "/images/generations",
      model: "gpt-image-2",
      useLocalProxy: false,
    });
  });

  it("persists custom provider settings", () => {
    saveApiConfig({
      apiKey: "secret-key",
      baseUrl: "https://third-party.example/",
      model: "custom-model",
      generationPath: "v1/generate",
      editPath: "v1/edit",
      useLocalProxy: true,
    });

    expect(loadApiConfig()).toEqual({
      apiKey: "secret-key",
      baseUrl: "https://third-party.example",
      model: "custom-model",
      generationPath: "/v1/generate",
      editPath: "/v1/edit",
      useLocalProxy: true,
    });
  });

  it("migrates legacy local proxy URLs into provider URL plus proxy mode", () => {
    localStorage.setItem(
      "gptimage2.config",
      JSON.stringify({
        apiKey: "secret-key",
        baseUrl: "http://127.0.0.1:5173/gptimage2-proxy",
        model: "gpt-image-2",
        generationPath: "/images/generations",
        editPath: "/images/edits",
      })
    );

    expect(loadApiConfig()).toEqual({
      apiKey: "secret-key",
      baseUrl: "https://cc-vibe.com",
      model: "gpt-image-2",
      generationPath: "/images/generations",
      editPath: "/images/edits",
      useLocalProxy: true,
    });
  });

  it("returns null for malformed config", () => {
    localStorage.setItem("gptimage2.config", "{bad json");

    expect(loadApiConfig()).toBeNull();
  });

  it("persists history records as metadata only", () => {
    const history: HistoryRecord[] = [
      {
        id: "local-id",
        imageUrl: "https://example.com/generated.png",
        mode: "text-to-image",
        prompt: "city wallpaper",
        size: "1320x2868",
        createdAt: "2026-06-02T17:30:12.000Z",
        saved: false,
        fileName: "gptimage2-text-20260602-173012.png",
      },
    ];

    saveHistory(history);

    expect(loadHistory()).toEqual(history);
  });

  it("does not persist base64 image data URLs in history", () => {
    const history: HistoryRecord[] = [
      {
        id: "base64-id",
        imageUrl: "data:image/png;base64,abc123",
        mode: "text-to-image",
        prompt: "city wallpaper",
        size: "1024x1024",
        createdAt: "2026-06-02T17:30:12.000Z",
        saved: false,
        fileName: "gptimage2-text-20260602-173012.png",
      },
    ];

    saveHistory(history);

    expect(loadHistory()).toEqual([]);
  });

  it("removes legacy base64 history records when loading", () => {
    const persistableRecord: HistoryRecord = {
      id: "url-id",
      imageUrl: "https://example.com/generated.png",
      mode: "text-to-image",
      prompt: "city wallpaper",
      size: "1024x1024",
      createdAt: "2026-06-02T17:30:12.000Z",
      saved: false,
      fileName: "gptimage2-text-20260602-173012.png",
    };
    localStorage.setItem(
      "gptimage2.history",
      JSON.stringify([
        persistableRecord,
        {
          ...persistableRecord,
          id: "base64-id",
          imageUrl: "data:image/png;base64,abc123",
        },
      ])
    );

    expect(loadHistory()).toEqual([persistableRecord]);
    expect(JSON.parse(localStorage.getItem("gptimage2.history") ?? "[]")).toEqual([persistableRecord]);
  });
});
