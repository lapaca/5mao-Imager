import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the empty canvas state on first visit", () => {
    render(<App />);

    expect(screen.getByText("Generated images will be displayed here.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "API Settings Unconfigured" })).toBeInTheDocument();
  });

  it("prompts for API configuration before generation", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Positive Prompt"), "A minimal wallpaper");
    await user.click(screen.getByRole("button", { name: "Generate Image" }));

    expect(screen.getByText("Please complete API configuration first")).toBeInTheDocument();
  });

  it("saves API settings locally", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "API Settings Unconfigured" }));
    await user.type(screen.getByLabelText("API Key"), "secret");
    await user.clear(screen.getByLabelText("Provider Base URL"));
    await user.type(screen.getByLabelText("Provider Base URL"), "https://cc-vibe.com/");
    await user.click(screen.getByRole("button", { name: "Save & Confirm" }));

    expect(JSON.parse(localStorage.getItem("gptimage2.config") ?? "{}")).toEqual({
      apiKey: "secret",
      baseUrl: "https://cc-vibe.com",
      editPath: "/images/edits",
      generationPath: "/images/generations",
      model: "gpt-image-2",
      useLocalProxy: false,
    });
    expect(screen.getByRole("button", { name: "API Settings Configured" })).toBeInTheDocument();
  });

  it("can set the local proxy base URL from API settings", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "API Settings Unconfigured" }));
    await user.type(screen.getByLabelText("API Key"), "secret");
    await user.click(screen.getByRole("button", { name: "Use Local Proxy" }));
    await user.click(screen.getByRole("button", { name: "Save & Confirm" }));

    expect(JSON.parse(localStorage.getItem("gptimage2.config") ?? "{}")).toEqual({
      apiKey: "secret",
      baseUrl: "https://cc-vibe.com",
      editPath: "/images/edits",
      generationPath: "/images/generations",
      model: "gpt-image-2",
      useLocalProxy: true,
    });
  });

  it("keeps a custom provider URL when enabling the local proxy", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "API Settings Unconfigured" }));
    await user.type(screen.getByLabelText("API Key"), "secret");
    await user.clear(screen.getByLabelText("Provider Base URL"));
    await user.type(screen.getByLabelText("Provider Base URL"), "https://third-party.example");
    await user.click(screen.getByRole("button", { name: "Use Local Proxy" }));
    await user.click(screen.getByRole("button", { name: "Save & Confirm" }));

    expect(JSON.parse(localStorage.getItem("gptimage2.config") ?? "{}")).toEqual({
      apiKey: "secret",
      baseUrl: "https://third-party.example",
      editPath: "/images/edits",
      generationPath: "/images/generations",
      model: "gpt-image-2",
      useLocalProxy: true,
    });
  });

  it("switches to image-to-image mode", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: "Image-to-Image" }));

    expect(screen.getByLabelText("Modification Prompt")).toBeInTheDocument();
    expect(screen.getByText("Drop or choose a base image")).toBeInTheDocument();
  });

  it("renders persisted history and shows a placeholder when the selected image fails to load", async () => {
    localStorage.setItem(
      "gptimage2.history",
      JSON.stringify([
        {
          id: "history-1",
          imageUrl: "https://example.com/expired.png",
          mode: "text-to-image",
          prompt: "expired image",
          size: "1320x2868",
          createdAt: "2026-06-02T17:30:12.000Z",
          saved: false,
          fileName: "gptimage2-text-20260602-173012-a1b2c3.png",
        },
      ])
    );
    render(<App />);

    fireEvent.error(screen.getByAltText("expired image"));

    expect(screen.getByText("Image URL is unavailable or expired.")).toBeInTheDocument();
  });
});
