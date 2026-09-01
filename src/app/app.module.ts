import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './auth/components/login/login.component';

import { CommonModule, UpperCasePipe } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EffectsModule } from '@ngrx/effects';
import { provideStore, Store, StoreModule } from '@ngrx/store';
import { rehydrateSessionOnBootstrap } from './auth/session-bootstrap';
import { ActionCardComponent } from 'src/app/shared/components/action-card/action-card.component';
import { DataCardComponent } from 'src/app/shared/components/data-card/data-card.component';
import { ActivityItemComponent } from './admin/components/activity-item/activity-item.component';
import { ActivityListComponent } from './admin/components/activity-list/activity-list.component';
import { AdminDashboardComponent } from './admin/components/admin-dashboard/admin-dashboard.component';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './guards/auth.guard';
import { UserDashboardComponent } from './learner/components/user-dashboard/user-dashboard.component';
import { DashboardCardComponent } from './shared/components/dashboard-card/dashboard-card.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { ListComponent } from './shared/components/list/list.component';
import { NavComponent } from './shared/components/navigation/nav.component';
import { ProgressRowComponent } from './shared/components/progress-row/progress-row.component';
import { LearningProgressCardComponent } from './learner/components/learning-progress-card/learning-progress-card.component';
import { AssignedModuleCardComponent } from './learner/components/assigned-module-card/assigned-module-card.component';
import { ScenarioModule } from './scenario/scenario.module';
import { AttemptsModule } from './attempts/attempts.module';
import { LearnerModulesModule } from './modules/modules.module';
import { BreadcrumbsComponent } from './shared/components/breadcrumbs/breadcrumbs.component';
import { FeedbackModule } from './feedback/feedback.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';
import { ModuleResultsModule } from './module-results/module-results.module';
import { authInterceptor } from './auth/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    AdminDashboardComponent,
    UserDashboardComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    CommonModule,
    UpperCasePipe,
    FontAwesomeModule,
    NavComponent,
    AuthModule,
    ScenarioModule,
    AttemptsModule,
    LearnerModulesModule,
    FeedbackModule,
    AdminModule,
    UsersModule,
    ModuleResultsModule,
    StoreModule.forRoot({}),
    EffectsModule.forRoot([]),
    DataCardComponent,
    ProgressRowComponent,
    DashboardCardComponent,
    HeaderComponent,
    AssignedModuleCardComponent,
    ActivityItemComponent,
    ActivityListComponent,
    ActionCardComponent,
    LearningProgressCardComponent,
    ListComponent,
    BreadcrumbsComponent,
  ],
  providers: [
    AuthGuard,
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({}),
    // Restores a persisted session (just user + token - see
    // session-storage.util.ts) into the store before the router's initial
    // navigation, so a reload doesn't get bounced to /login by AuthGuard
    // racing an empty store.
    {
      provide: APP_INITIALIZER,
      useFactory: rehydrateSessionOnBootstrap,
      deps: [Store],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
