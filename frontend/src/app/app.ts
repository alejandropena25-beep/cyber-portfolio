import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Footer } from './layout/footer';
import { Header } from './layout/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly meta = inject(Meta);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        let route = this.activatedRoute;
        let description: unknown;
        let robots = 'index,follow';

        while (true) {
          description = route.snapshot.data['description'] ?? description;
          robots = route.snapshot.data['robots'] ?? robots;
          if (!route.firstChild) break;
          route = route.firstChild;
        }

        if (typeof description === 'string') {
          this.meta.updateTag({ name: 'description', content: description });
        }
        this.meta.updateTag({ name: 'robots', content: robots });
      });
  }
}
