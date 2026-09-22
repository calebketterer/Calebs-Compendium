import { TitleStateManager } from './title.state-manager';
import { TitleFeaturesRegistry } from './title-features.registry';
import { LetterState, TitleFeatureContext } from './title.interfaces';
import { AngularThemeManager } from '../angular-theme.manager';

export class HeaderTitleEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private frame = 0;
  private text = "Caleb's Compendium";
  private clickTimer: any = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    TitleStateManager.init();
    this.resize();
  }

  public start(): void {
    if (this.animFrameId) return;
    const loop = () => {
      this.render();
      this.animFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  public stop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  public handleCanvasClick(): void {
    if (this.clickTimer) {
      clearTimeout(this.clickTimer);
      this.clickTimer = null;
      TitleStateManager.handleDoubleClick(this.frame);
    } else {
      this.clickTimer = setTimeout(() => {
        this.clickTimer = null;
        TitleStateManager.handleSingleClick(this.frame);
      }, 220);
    }
  }

  private render(): void {
    if (!TitleStateManager.isFrozen) {
      this.frame++;
    }
    TitleStateManager.update(this.frame);

    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h / 2;

    this.ctx.clearRect(0, 0, w, h);

    const fontSize = Math.min(w * 0.08, 44);
    
    this.ctx.save();
    this.ctx.translate(cx, cy);

    if (TitleStateManager.fontMorphProgress < 1) {
      this.renderTitleWithFont(TitleStateManager.previousFont, fontSize, w, h, 1 - TitleStateManager.fontMorphProgress);
      this.renderTitleWithFont(TitleStateManager.currentFont, fontSize, w, h, TitleStateManager.fontMorphProgress);
    } else {
      this.renderTitleWithFont(TitleStateManager.currentFont, fontSize, w, h, 1);
    }

    this.ctx.restore();
  }

  private renderTitleWithFont(fontFamily: string, fontSize: number, canvasWidth: number, canvasHeight: number, alphaMultiplier: number): void {
    this.ctx.font = `900 ${fontSize}px ${fontFamily}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const chars = this.text.split('');
    const baseWidths = chars.map(char => this.ctx.measureText(char).width);
    const totalWidth = baseWidths.reduce((a, b) => a + b, 0);
    let currentX = -totalWidth / 2;

    chars.forEach((char, index) => {
      const charWidth = baseWidths[index];
      const charCenterX = currentX + charWidth / 2;

      const letter: LetterState = {
        char,
        index,
        totalLetters: chars.length,
        x: charCenterX,
        y: 0,
        width: charWidth,
        fontSize,
        opacity: 1,
        strokeWidth: 0,
        offsetY: 0,
        scaleX: 1,
        scaleY: 1,
        colorGradient: 'angular'
      };

      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = AngularThemeManager.getShiftedGradient(this.ctx, totalWidth, this.frame);
      this.ctx.font = `600 ${fontSize}px ${fontFamily}`;

      const allFeatureIds = TitleFeaturesRegistry.getAllIds();
      allFeatureIds.forEach(featureId => {
        const intensity = TitleStateManager.getIntensity(featureId);
        if (intensity > 0) {
          const featCtx: TitleFeatureContext = {
            ctx: this.ctx,
            letter,
            frame: this.frame,
            intensity,
            canvasWidth,
            canvasHeight
          };
          TitleFeaturesRegistry.execute(featureId, featCtx);
        }
      });

      this.ctx.save();
      this.ctx.translate(letter.x, letter.y + letter.offsetY);
      this.ctx.scale(letter.scaleX, letter.scaleY);
      this.ctx.globalAlpha = Math.max(0, Math.min(1, letter.opacity * alphaMultiplier));

      if (letter.shadowBlur && letter.shadowColor) {
        this.ctx.shadowBlur = letter.shadowBlur;
        this.ctx.shadowColor = letter.shadowColor;
      }

      if (letter.strokeWidth > 0) {
        const ox = letter.strokeOffsetX || 0;
        const oy = letter.strokeOffsetY || 0;
        this.ctx.strokeText(char, ox, oy);
      }
      
      this.ctx.fillText(char, 0, 0);

      this.ctx.restore();

      currentX += charWidth;
    });
  }
}