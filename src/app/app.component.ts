import { Component, ElementRef, ViewChild, AfterViewInit, Renderer2, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

// Constants & Services
import { DEFAULT_COLORS, MESSAGE_BOX_DEFAULTS } from './home/home.constants';
import { UiEffectsService } from './home/home.ui-effects.service';
import { HomeStateService } from './home/home.state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, AfterViewInit {
  messageBoxText = MESSAGE_BOX_DEFAULTS.TEXT;
  messageBoxClass = MESSAGE_BOX_DEFAULTS.CLASS;
  showBackButton = false;

  @ViewChild('colorfulHeader', { static: true }) colorfulHeader!: ElementRef<HTMLHeadingElement>;

  private currentColors = [...DEFAULT_COLORS];
  private lastX = 50;

  constructor(
    private renderer: Renderer2,
    private uiService: UiEffectsService,
    public state: HomeStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Listen to route changes to update selectedView and showBackButton visibility
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const path = event.urlAfterRedirects.replace('/', '').toLowerCase();
        const currentView = path || 'home';

        this.showBackButton = currentView !== 'home' && currentView !== '';

        if (currentView !== this.state.selectedView) {
          this.state.updateView(currentView);
        }
      });
  }

  ngAfterViewInit(): void {
    this.updateHeaderGradient(50);
    if (this.colorfulHeader?.nativeElement) {
      this.colorfulHeader.nativeElement.onclick = () => this.onHeaderClick();
    }
  }

  goHome(): void {
    this.state.updateView('home');
    this.router.navigate(['/']);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.colorfulHeader?.nativeElement) return;
    this.lastX = (event.clientX / window.innerWidth) * 100;
    this.updateHeaderGradient(this.lastX);
  }

  @HostListener('window:mouseout', ['$event'])
  onMouseOut(event: MouseEvent) {
    if (!event.relatedTarget) this.updateHeaderGradient(50);
  }

  private updateHeaderGradient(x: number) {
    const gradient = this.uiService.generateGradientString(x, this.currentColors);
    this.renderer.setStyle(this.colorfulHeader.nativeElement, 'backgroundImage', gradient);
  }

  private onHeaderClick() {
    this.currentColors = this.uiService.getRandomizedColors(DEFAULT_COLORS.length);
    this.updateHeaderGradient(this.lastX);
  }
}