export function buildTextPrompt(positivePrompt: string, negativePrompt: string): string {
  const positive = positivePrompt.trim();
  const negative = negativePrompt.trim();

  if (!negative) {
    return positive;
  }

  return `${positive}\n\nAvoid: ${negative}`;
}

export function buildImagePrompt(
  modificationPrompt: string,
  denoisingStrength: number,
  negativePrompt = ""
): string {
  const parts = [
    modificationPrompt.trim(),
    `Denoising strength guidance: ${denoisingStrength}. 0 means preserve the original image as much as possible, 1 means regenerate with maximum freedom.`,
  ];
  const negative = negativePrompt.trim();

  if (negative) {
    parts.push(`Avoid: ${negative}`);
  }

  return parts.join("\n\n");
}
