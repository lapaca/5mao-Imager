import { describe, expect, it } from "vitest";
import { createImageFileName, validateImageFile } from "./files";

describe("file helpers", () => {
  it("creates local-time filenames with a short id", () => {
    const date = new Date("2026-06-02T09:30:12.000Z");

    expect(createImageFileName("text-to-image", date, "abc123")).toMatch(
      /^gptimage2-text-\d{8}-\d{6}-abc123\.png$/
    );
  });

  it("accepts PNG, JPG, JPEG, and WebP uploads under 25MB", () => {
    const file = new File(["image"], "base.webp", { type: "image/webp" });

    expect(validateImageFile(file)).toBeNull();
  });

  it("rejects unsupported image types", () => {
    const file = new File(["image"], "base.gif", { type: "image/gif" });

    expect(validateImageFile(file)).toBe("Only PNG, JPG, JPEG, and WebP are supported");
  });
});
