import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './auth/components/login/login.component';

import { CommonModule, UpperCasePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EffectsModule } from '@ngrx/effects';
import { provideStore, StoreModule } from '@ngrx/store';
import { AdminDashboardComponent } from './admin/components/admin-dashboard/admin-dashboard.component';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './guards/auth.guard';
import { UserDashboardComponent } from './learner/components/user-dashboard/user-dashboard.component';
import { NavComponent } from './shared/components/navigation/nav.component';
import { DataCardComponent } from 'src/app/shared/components/data-card/data-card.component';
import { metaReducers } from './meta.reducer';
import { ProgressRowComponent } from './shared/components/progress-row/progress-row.component';
import { DashboardCardComponent } from './shared/components/dashboard-card/dashboard-card.component';
import { ActivityItemComponent } from './admin/components/activity-item/activity-item.component';
import { ActivityListComponent } from './admin/components/activity-list/activity-list.component';
import { ActionCardComponent } from 'src/app/shared/components/action-card/action-card.component';
// import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

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
    StoreModule.forRoot({}),
    EffectsModule.forRoot([]),
    DataCardComponent,
    ProgressRowComponent,
    DashboardCardComponent,
    ActivityItemComponent,
    ActivityListComponent,
    ActionCardComponent,
  ],
  providers: [
    AuthGuard,
    provideHttpClient(),
    provideStore({}, { metaReducers }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
