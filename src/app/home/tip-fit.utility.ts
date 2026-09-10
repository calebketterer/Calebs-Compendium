/**
 * Utility function to calculate the exact font size (in pixels) required 
 * to make a string fit a target pixel width without wrapping or clipping.
 */
export function calculateExactFontSize(
  text: string,
  targetWidthPx: number,
  fontFamily: string,
  canvasContext: CanvasRenderingContext2D | null,
  minFontSize: number = 8,
  maxFontSize: number = 40
): number {
  if (!text || !text.trim() || !canvasContext) {
    return 14;
  }

  const sampleFontSize = 100;
  canvasContext.font = `${sampleFontSize}px ${fontFamily}`;
  const measuredWidth = canvasContext.measureText(text).width;

  if (measuredWidth <= 0) {
    return 14;
  }

  // Linear scaling formula: (Target Width / Measured Width at 100px) * 100px
  const exactFontSize = (targetWidthPx / measuredWidth) * sampleFontSize;

  return Math.min(Math.max(exactFontSize, minFontSize), maxFontSize);
}