import { Injectable, ElementRef, Renderer2 } from '@angular/core';
import { HomeStateService } from './home.state.service';
import { calculateExactFontSize } from './tip-fit.utility';

@Injectable({
  providedIn: 'root'
})
export class TipTransitionService {
  private isTipAnimating = false;
  private canvasContext: CanvasRenderingContext2D | null = null;

  constructor(private state: HomeStateService) {
    const canvas = document.createElement('canvas');
    this.canvasContext = canvas.getContext('2d');
  }

  cycleTipWithFade(tipsElementRef: ElementRef<HTMLElement>, renderer: Renderer2): void {
    if (this.isTipAnimating || !tipsElementRef || !tipsElementRef.nativeElement) {
      return;
    }

    this.isTipAnimating = true;
    const el = tipsElementRef.nativeElement;

    // Phase 1: Fade Out
    renderer.addClass(el, 'is-fading');

    // Phase 2: Cycle state, recalculate exact font size, and Fade In
    setTimeout(() => {
      this.state.cycleTip();
      this.fitTipText(tipsElementRef, renderer);

      renderer.removeClass(el, 'is-fading');

      setTimeout(() => {
        this.isTipAnimating = false;
      }, 300);
    }, 300);
  }

  fitTipText(tipsElementRef: ElementRef<HTMLElement>, renderer: Renderer2): void {
    if (!tipsElementRef || !tipsElementRef.nativeElement) {
      return;
    }

    const el = tipsElementRef.nativeElement;
    const text = this.state.currentTipText || el.textContent || '';
    if (!text.trim()) {
      return;
    }

    const container = el.parentElement;
    const targetWidthPx = container && container.clientWidth > 0 ? container.clientWidth : 400;

    const computedStyle = window.getComputedStyle(el);
    const fontFamily = computedStyle.fontFamily || 'sans-serif';

    const calculatedFontSize = calculateExactFontSize(
      text,
      targetWidthPx,
      fontFamily,
      this.canvasContext
    );

    renderer.setStyle(el, 'font-size', `${calculatedFontSize}px`);
  }
}