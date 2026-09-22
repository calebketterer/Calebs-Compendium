export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export class AngularThemeManager {
  // Angular SVG gradient stops
  public static readonly STOPS: string[] = [
    '#F0060B',
    '#F0070C',
    '#CC26D5',
    '#7702FF'
  ];

  public static hexToRgb(hex: string): RGBColor {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    const num = parseInt(clean, 16) || 0;
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  public static rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  public static rotateRgb(rgb: RGBColor, degrees: number): RGBColor {
    const rad = (degrees * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const r = rgb.r * (0.213 + 0.787 * cos - 0.213 * sin) +
              rgb.g * (0.715 - 0.715 * cos - 0.715 * sin) +
              rgb.b * (0.072 - 0.072 * cos + 0.928 * sin);

    const g = rgb.r * (0.213 - 0.213 * cos + 0.143 * sin) +
              rgb.g * (0.715 + 0.285 * cos + 0.140 * sin) +
              rgb.b * (0.072 - 0.072 * cos - 0.283 * sin);

    const b = rgb.r * (0.213 - 0.213 * cos - 0.787 * sin) +
              rgb.g * (0.715 - 0.715 * cos + 0.715 * sin) +
              rgb.b * (0.072 + 0.928 * cos + 0.072 * sin);

    return {
      r: Math.max(0, Math.min(255, r)),
      g: Math.max(0, Math.min(255, g)),
      b: Math.max(0, Math.min(255, b))
    };
  }

  public static getShiftedGradient(ctx: CanvasRenderingContext2D, width: number, frame: number): CanvasGradient {
    // 5s duration at 60fps = 300 frames per full 360deg cycle (matches hueBreathing2 5s)
    const degrees = ((frame % 300) / 300) * 360;
    
    // Tighten bounds to (-width / 2) to (width / 2) so all stops span across the text width
    const grad = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);

    // Repeat/tile the stops across the word so multiple vibrant color transitions show simultaneously
    const stopsPattern = [
      ...this.STOPS,
      ...this.STOPS.slice().reverse()
    ];

    stopsPattern.forEach((stopHex, idx) => {
      const originalRgb = this.hexToRgb(stopHex);
      const rotatedRgb = this.rotateRgb(originalRgb, degrees);
      const hex = this.rgbToHex(rotatedRgb.r, rotatedRgb.g, rotatedRgb.b);
      const stopPosition = idx / (stopsPattern.length - 1);
      grad.addColorStop(stopPosition, hex);
    });

    return grad;
  }
}