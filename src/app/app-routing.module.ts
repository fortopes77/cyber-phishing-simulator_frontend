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
import { LearnerModulesListComponent } from './modules/components/learner-modules-list/learner-modules-list.component';
import { TrainerModulesListComponent } from './modules/components/trainer-modules-list/trainer-modules-list.component';

const routes: Routes = [
  // Public routes
  { path: 'login', component: LoginComponent, data: { breadcrumb: 'Login' } },
  {
    path: 'sign-out',
    component: SignOutComponent,
    data: { breadcrumb: 'Sign Out' },
  },

  // Protected routes
  {
    path: 'learner',
    canActivate: [AuthGuard],
    data: { breadcrumb: 'Learner' },
    children: [
      {
        path: 'dashboard',
        component: UserDashboardComponent,
        data: { breadcrumb: 'Dashboard' },
      },
      {
        path: 'modules',
        component: LearnerModulesListComponent,
        data: { breadcrumb: 'Modules' },
      },
      {
        path: 'modules/:id',
        component: ModulePageComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'Module' },
      },
      {
        path: 'scenarios/:id',
        component: ScenarioPageComponent,
        data: { breadcrumb: 'Scenario' },
      },
      {
        path: 'scenarios/:id/feedback',
        component: ScenarioChoiceComponent,
        data: { breadcrumb: 'Feedback' },
      },
      {
        path: 'results',
        component: ModuleResultsComponent,
        data: { breadcrumb: 'Results' },
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'trainer',
    canActivate: [AuthGuard],
    data: { breadcrumb: 'Trainer' },
    children: [
      {
        path: 'dashboard',
        component: AdminDashboardComponent,
        data: { breadcrumb: 'Dashboard' },
      },
      {
        path: 'trainer/users/:id',
        component: AdminDashboardComponent,
        data: { breadcrumb: 'User' },
      },
      {
        path: 'learners',
        component: LearnerListComponent,
        data: { breadcrumb: 'Learners' },
      },
      {
        path: 'modules',
        component: TrainerModulesListComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'Modules', role: 'trainer' },
      },
      {
        path: 'cohorts',
        component: CohortsListComponent,
        data: { breadcrumb: 'Cohorts' },
      },
      {
        path: 'scenarios',
        component: ScenarioListComponent,
        data: { breadcrumb: 'Scenarios' },
      },
      {
        path: 'scenarios/:id/edit',
        component: ScenarioEditComponent,
        data: { breadcrumb: 'Edit Scenario' },
      },
      {
        path: 'scenarios/create',
        component: ScenarioEditComponent,
        data: { breadcrumb: 'Create Scenario' },
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  {
    path: 'settings',
    component: UserSettingsComponent,
    canActivate: [AuthGuard],
    data: { breadcrumb: 'Settings' },
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
    TrainerModulesListComponent,
  ],
  exports: [RouterModule],
  providers: [AuthGuard],
})
export class AppRoutingModule {}
