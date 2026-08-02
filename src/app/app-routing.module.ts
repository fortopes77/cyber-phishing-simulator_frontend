import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/components/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { SignOutComponent } from './auth/components/sign-out/sign-out.component';
import { UserSettingsComponent } from './auth/components/user-settings/user-settings.component';
import { ModulePageComponent } from './learner/components/module-page/module-page.component';
import { ScenarioChoiceComponent } from './scenario/components/scenario-choice/scenario-choice.component';
import { ScenarioPageComponent } from './scenario/components/scenario-page/scenario-page.component';
import { ModuleResultsComponent } from './learner/components/module-results/module-results.component';
import { UserDashboardComponent } from './learner/components/user-dashboard/user-dashboard.component';
import { AdminDashboardComponent } from './admin/components/admin-dashboard/admin-dashboard.component';
import { ScenarioEditComponent } from './scenario/components/scenario-edit/scenario-edit.component';
import { ScenarioListComponent } from './scenario/components/scenario-list/scenario-list.component';
import { LearnerListComponent } from './learner/components/learner-list/learner-list.component';
import { CohortsListComponent } from './cohorts/components/cohorts-list/cohorts-list.component';

const routes: Routes = [
  // Public routes
  // Public routes
  { path: 'login', component: LoginComponent },
  { path: 'sign-out', component: SignOutComponent },

  // Protected routes
  {
    path: 'learner',
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: UserDashboardComponent },
      { path: 'scenarios/:id', component: ScenarioPageComponent },
      { path: 'scenarios/:id/feedback', component: ScenarioChoiceComponent },
      { path: 'results', component: ModuleResultsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'trainer',
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'trainer/users/:id', component: AdminDashboardComponent },
      { path: 'learners', component: LearnerListComponent },
      { path: 'cohorts', component: CohortsListComponent },
      { path: 'scenarios', component: ScenarioListComponent },
      { path: 'scenarios/:id/edit', component: ScenarioEditComponent },
      { path: 'scenarios/create', component: ScenarioEditComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'learning/:slug',
    component: ModulePageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'settings',
    component: UserSettingsComponent,
    canActivate: [AuthGuard],
  },
  // Wildcard route - redirect to user dashboard if authenticated, login if not
  { path: '**', redirectTo: '/learner/dashboard' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    ScenarioEditComponent,
    LearnerListComponent,
    CohortsListComponent,
  ],
  exports: [RouterModule],
  providers: [AuthGuard],
})
export class AppRoutingModule {}
