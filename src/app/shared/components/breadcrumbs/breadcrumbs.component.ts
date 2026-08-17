import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import { filter, Subscription } from 'rxjs';

export interface BreadcrumbItem {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumbs',
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss',
  standalone: true,
})
export class BreadcrumbsComponent implements OnInit, OnDestroy {
  breadcrumbs: BreadcrumbItem[] = [];
  private navigationSubscription?: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.updateBreadcrumbs();

    this.navigationSubscription = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe(() => this.updateBreadcrumbs());
  }

  ngOnDestroy(): void {
    this.navigationSubscription?.unsubscribe();
  }

  private updateBreadcrumbs(): void {
    const breadcrumbs: BreadcrumbItem[] = [];
    const urlSegments: string[] = [];
    let route: ActivatedRouteSnapshot | null =
      this.router.routerState.snapshot.root;

    // Follow only the active primary route. This avoids adding routes from
    // secondary outlets and gives every URL segment its own breadcrumb.
    while (route) {
      const activeRoute: ActivatedRouteSnapshot = route;

      activeRoute.url.forEach((segment, index) => {
        urlSegments.push(segment.path);

        const isLastSegment = index === activeRoute.url.length - 1;
        const label = isLastSegment
          ? this.getBreadcrumbLabel(activeRoute, segment.path)
          : this.formatSegment(segment.path);

        if (label) {
          breadcrumbs.push({ label, url: '/' + urlSegments.join('/') });
        }
      });

      route =
        activeRoute.children.find((child) => child.outlet === 'primary') ??
        null;
    }

    this.breadcrumbs = breadcrumbs;
  }

  private getBreadcrumbLabel(
    route: ActivatedRouteSnapshot,
    segment: string,
  ): string {
    const routeLabel = route.routeConfig?.data?.['breadcrumb'];
    if (routeLabel) {
      return String(routeLabel);
    }

    return this.formatSegment(segment);
  }

  private formatSegment(segment: string): string {
    return decodeURIComponent(segment)
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
