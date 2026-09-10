import { Component, ElementRef, ViewChild, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HomeStateService } from './home.state.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  @ViewChild('heyThere', { static: true }) heyThere!: ElementRef<HTMLElement>;
  @ViewChild('goodNews', { static: true }) goodNews!: ElementRef<HTMLElement>;
  @ViewChild('Tips', { static: true }) Tips!: ElementRef<HTMLElement>;

  constructor(
    private renderer: Renderer2,
    public state: HomeStateService,
    private router: Router
  ) {}

  onViewChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.state.updateView(val);
    this.router.navigate([val]);
  }

  // --- Shake Logic ---

  shakeHeyThere() {
    this.state.handleGlobalClick();
    this.applyShake(this.heyThere.nativeElement);
  }

  shakeGoodNews() {
    this.state.handleGlobalClick();
    this.applyShake(this.goodNews.nativeElement);
  }

  shakeTips() {
    this.state.handleGlobalClick();
    this.state.cycleTip();
    this.applyShake(this.Tips.nativeElement);
  }

  private applyShake(element: HTMLElement) {
    this.renderer.removeClass(element, 'shake');
    void element.offsetWidth; // trigger reflow
    this.renderer.addClass(element, 'shake');
  }

  toggleDirection() {
    this.state.handleGlobalClick();
    this.state.reverse = !this.state.reverse;
  }
}