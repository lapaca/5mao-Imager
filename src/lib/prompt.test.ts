import { describe, expect, it } from "vitest";
import { buildImagePrompt, buildTextPrompt } from "./prompt";

describe("prompt merging", () => {
  it("uses only the positive prompt when no negative prompt is provided", () => {
    expect(buildTextPrompt("A calm mountain lake", "")).toBe("A calm mountain lake");
  });

  it("appends negative constraints for text-to-image", () => {
    expect(buildTextPrompt("A calm mountain lake", "low quality")).toBe(
      "A calm mountain lake\n\nAvoid: low quality"
    );
  });

  it("merges denoising guidance into image-to-image prompts", () => {
    expect(buildImagePrompt("Make it cyberpunk", 0.35)).toBe(
      "Make it cyberpunk\n\nDenoising strength guidance: 0.35. 0 means preserve the original image as much as possible, 1 means regenerate with maximum freedom."
    );
  });
});
