import { TitleFeatureConfig, TitleFeatureContext } from './title.interfaces';

export type FeatureCategory = 'font' | 'color' | 'motion' | 'misc';

export interface CategorizedFeatureConfig extends TitleFeatureConfig {
  category: FeatureCategory;
}

export class TitleFeaturesRegistry {
  private static features: Map<string, CategorizedFeatureConfig> = new Map();

  public static register(config: CategorizedFeatureConfig): void {
    this.features.set(config.id, config);
  }

  public static get(id: string): CategorizedFeatureConfig | undefined {
    return this.features.get(id);
  }

  public static getByCategory(category: FeatureCategory): string[] {
    const ids: string[] = [];
    this.features.forEach((feat, id) => {
      if (feat.category === category) {
        ids.push(id);
      }
    });
    return ids;
  }

  public static getAllIds(): string[] {
    return Array.from(this.features.keys());
  }

  public static execute(id: string, context: TitleFeatureContext): void {
    const feat = this.features.get(id);
    if (feat && context.intensity > 0) {
      feat.handler(context);
    }
  }
}

export const DEFAULT_GRAY = '#A3A3A3';

export const PALETTE = {
  brightBlue: '#0546ff',
  pink: '#f637e3',
  darkBlue: '#1f17b7',
  red: '#b90000',
  yellow: '#b8b600',
  green: '#32881f',
  blue: '#104aee',
  violet: '#8001c6'
};

export const FONT_POOL = [
  'Inter, system-ui, sans-serif',
  'Georgia, serif',
  '"Courier New", monospace',
  '"Trebuchet MS", sans-serif',
  'Impact, Arial Black, sans-serif'
];

export class ColorUtils {
  public static hexToRgb(hex: string): { r: number; g: number; b: number } {
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

  public static lerpColor(c1: string, c2: string, t: number): string {
    const rgb1 = this.hexToRgb(c1);
    const rgb2 = this.hexToRgb(c2);
    return this.rgbToHex(
      rgb1.r + (rgb2.r - rgb1.r) * t,
      rgb1.g + (rgb2.g - rgb1.g) * t,
      rgb1.b + (rgb2.b - rgb1.b) * t
    );
  }
}

export class ColorShiftManager {
  private static currentColors: [string, string, string] = [DEFAULT_GRAY, DEFAULT_GRAY, DEFAULT_GRAY];
  private static targetColors: [string, string, string] = [DEFAULT_GRAY, DEFAULT_GRAY, DEFAULT_GRAY];
  public static gradientStyle: 'horizontal' | 'vertical' | 'radial' | 'diagonal' = 'horizontal';

  public static setTargets(stops: [string, string, string], style?: 'horizontal' | 'vertical' | 'radial' | 'diagonal'): void {
    this.targetColors = stops;
    if (style) {
      this.gradientStyle = style;
    }
  }

  public static update(): void {
    for (let i = 0; i < 3; i++) {
      this.currentColors[i] = ColorUtils.lerpColor(this.currentColors[i], this.targetColors[i], 0.04);
    }
  }

  public static getColors(): [string, string, string] {
    return this.currentColors;
  }

  public static createGradient(ctx: CanvasRenderingContext2D, width: number, height: number, frame: number): CanvasGradient {
    const [c1, c2, c3] = this.currentColors;
    let grad: CanvasGradient;

    // Dynamic animated circulation & pulsing stop offsets
    const angle = frame * 0.02;
    const pulseStop = 0.5 + Math.sin(frame * 0.05) * 0.15;

    switch (this.gradientStyle) {
      case 'vertical': {
        const yShift = Math.sin(angle) * (height * 0.2);
        grad = ctx.createLinearGradient(0, -height / 2 + yShift, 0, height / 2 + yShift);
        break;
      }
      case 'radial': {
        const radiusPulse = (width / 2) * (0.8 + Math.sin(angle) * 0.2);
        grad = ctx.createRadialGradient(0, 0, 2, 0, 0, radiusPulse);
        break;
      }
      case 'diagonal': {
        const dx = Math.cos(angle) * (width / 2);
        const dy = Math.sin(angle) * (height / 2);
        grad = ctx.createLinearGradient(-dx, -dy, dx, dy);
        break;
      }
      case 'horizontal':
      default: {
        const xShift = Math.cos(angle) * (width * 0.2);
        grad = ctx.createLinearGradient(-width / 2 + xShift, 0, width / 2 + xShift, 0);
        break;
      }
    }

    grad.addColorStop(0.0, c1);
    grad.addColorStop(Math.max(0.1, Math.min(0.9, pulseStop)), c2);
    grad.addColorStop(1.0, c3);
    return grad;
  }
}

// COLOR CATEGORY
TitleFeaturesRegistry.register({
  id: 'neonGradient',
  name: 'Neon Spectrum Gradient',
  category: 'color',
  handler: ({ ctx, canvasWidth, canvasHeight, frame, intensity }) => {
    if (intensity < 0.01) return;
    ColorShiftManager.setTargets([PALETTE.brightBlue, PALETTE.pink, PALETTE.violet], 'horizontal');
    const grad = ColorShiftManager.createGradient(ctx, canvasWidth, canvasHeight, frame);
    ctx.fillStyle = grad;
  }
});

TitleFeaturesRegistry.register({
  id: 'sunsetGradient',
  name: 'Sunset Fire Gradient',
  category: 'color',
  handler: ({ ctx, canvasWidth, canvasHeight, frame, intensity }) => {
    if (intensity < 0.01) return;
    ColorShiftManager.setTargets([PALETTE.yellow, PALETTE.red, PALETTE.darkBlue], 'vertical');
    const grad = ColorShiftManager.createGradient(ctx, canvasWidth, canvasHeight, frame);
    ctx.fillStyle = grad;
  }
});

TitleFeaturesRegistry.register({
  id: 'cyberGradient',
  name: 'Cyber Diagonal Gradient',
  category: 'color',
  handler: ({ ctx, canvasWidth, canvasHeight, frame, intensity }) => {
    if (intensity < 0.01) return;
    ColorShiftManager.setTargets([PALETTE.green, PALETTE.brightBlue, PALETTE.pink], 'diagonal');
    const grad = ColorShiftManager.createGradient(ctx, canvasWidth, canvasHeight, frame);
    ctx.fillStyle = grad;
  }
});

TitleFeaturesRegistry.register({
  id: 'radialPulse',
  name: 'Radial Glow Gradient',
  category: 'color',
  handler: ({ ctx, canvasWidth, canvasHeight, frame, intensity }) => {
    if (intensity < 0.01) return;
    ColorShiftManager.setTargets([PALETTE.pink, PALETTE.violet, PALETTE.brightBlue], 'radial');
    const grad = ColorShiftManager.createGradient(ctx, canvasWidth, canvasHeight, frame);
    ctx.fillStyle = grad;
  }
});

// FONT CATEGORY
TitleFeaturesRegistry.register({
  id: 'globalFontSwap',
  name: 'Global Title Font Cross-Fade',
  category: 'font',
  handler: () => {}
});

// MOTION CATEGORY
TitleFeaturesRegistry.register({
  id: 'staggeredWave',
  name: 'Staggered Wave Motion',
  category: 'motion',
  handler: ({ letter, frame, intensity }) => {
    const wave = Math.sin(frame * 0.04 + letter.index * 0.3);
    letter.offsetY += wave * 6 * intensity;
  }
});

TitleFeaturesRegistry.register({
  id: 'pulseBounce',
  name: 'Vertical Pulse Bounce',
  category: 'motion',
  handler: ({ letter, frame, intensity }) => {
    const bounce = Math.abs(Math.sin(frame * 0.05)) * -8;
    letter.offsetY += bounce * intensity;
  }
});

TitleFeaturesRegistry.register({
  id: 'horizontalDrift',
  name: 'Subtle Horizontal Sway',
  category: 'motion',
  handler: ({ letter, frame, intensity }) => {
    const sway = Math.cos(frame * 0.03 + letter.index * 0.2) * 4;
    letter.x += sway * intensity;
  }
});

TitleFeaturesRegistry.register({
  id: 'waveTilt',
  name: 'Left-to-Right Depth Wave Tilt',
  category: 'motion',
  handler: ({ letter, frame, intensity }) => {
    const scaleFactor = Math.sin(frame * 0.05 + letter.index * 0.35) * 0.25 * intensity;
    letter.scaleX += scaleFactor;
    letter.scaleY += scaleFactor;
  }
});

TitleFeaturesRegistry.register({
  id: 'randomPulseScale',
  name: 'Random Letter Grow & Shrink',
  category: 'motion',
  handler: ({ letter, frame, intensity }) => {
    const pseudoRandomPhase = (letter.index * 137.5) % 6.28;
    const pulse = Math.sin(frame * 0.04 + pseudoRandomPhase) * 0.2 * intensity;
    letter.scaleX += pulse;
    letter.scaleY += pulse;
  }
});

// MISC CATEGORY
TitleFeaturesRegistry.register({
  id: 'fontStyleShift',
  name: 'Letter Font Morph',
  category: 'misc',
  handler: ({ ctx, letter, frame, intensity }) => {
    if (intensity < 0.05) return;
    const fonts = [
      `900 ${letter.fontSize}px Inter, sans-serif`,
      `italic 800 ${letter.fontSize}px Georgia, serif`,
      `900 ${letter.fontSize}px 'Courier New', monospace`,
      `italic 900 ${letter.fontSize}px 'Trebuchet MS', sans-serif`
    ];
    const fontIndex = Math.floor((frame * 0.003 + letter.index * 0.1) % fonts.length);
    ctx.font = fonts[fontIndex];
  }
});

TitleFeaturesRegistry.register({
  id: 'letterDissolve',
  name: 'Disappearing Letter Fade',
  category: 'misc',
  handler: ({ letter, frame, intensity }) => {
    const cycle = Math.sin(frame * 0.03 + letter.index * 0.5);
    if (cycle < -0.5) {
      const dropAlpha = Math.max(0, (cycle + 0.5) / -0.5);
      letter.opacity *= 1 - dropAlpha * intensity * 0.6;
    }
  }
});

TitleFeaturesRegistry.register({
  id: 'strokeGrowth',
  name: 'Tight Dark Outline',
  category: 'misc',
  handler: ({ ctx, letter, intensity }) => {
    letter.strokeWidth = (0.5 + 0.75 * intensity);
    ctx.lineWidth = letter.strokeWidth;
    ctx.strokeStyle = `rgba(15, 23, 42, ${0.7 * intensity})`;
    ctx.lineJoin = 'round';
  }
});

TitleFeaturesRegistry.register({
  id: 'ambientGlow',
  name: 'Tight Ambient Edge Glow',
  category: 'misc',
  handler: ({ ctx, frame, intensity }) => {
    ctx.shadowColor = PALETTE.brightBlue;
    ctx.shadowBlur = (1 + Math.sin(frame * 0.04) * 1.5) * intensity;
  }
});