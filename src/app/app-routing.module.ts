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
import { ModuleEditComponent } from './modules/components/module-edit/module-edit.component';
import { UserEditComponent } from './users/components/user-edit/user-edit.component';

/**
 * Route-level access control. Every protected route declares the roles that
 * may enter it via `data.roles`, and AuthGuard turns away anyone else (sending
 * them to their own landing page). Learner-facing routes accept trainers too so
 * a trainer can walk through the same content their learners see; the trainer
 * section is trainer-only.
 */
const LEARNER_ROLES = ['user', 'trainer'];
const TRAINER_ROLES = ['trainer'];
const ANY_ROLE = ['user', 'trainer'];

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
    data: { breadcrumb: 'Learner', roles: LEARNER_ROLES },
    children: [
      {
        path: 'dashboard',
        component: UserDashboardComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'Dashboard', roles: LEARNER_ROLES },
      },
      {
        path: 'modules',
        component: LearnerModulesListComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'Modules', roles: LEARNER_ROLES },
      },
      {
        path: 'modules/:id',
        component: ModulePageComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'Module', roles: LEARNER_ROLES },
      },
      {
        path: 'scenarios/:id',
        component: ScenarioPageComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'Scenario', roles: LEARNER_ROLES },
      },
      {
        path: 'scenarios/:id/feedback',
        component: ScenarioChoiceComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'Feedback', roles: LEARNER_ROLES },
      },
      {
        path: 'results',
        component: ModuleResultsComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'Results', roles: LEARNER_ROLES },
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'trainer',
    canActivate: [AuthGuard],
    data: { breadcrumb: 'Trainer', roles: TRAINER_ROLES },
    children: [
      {
        path: 'dashboard',
        component: AdminDashboardComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'Dashboard', roles: TRAINER_ROLES },
      },
      {
        path: 'trainer/users/:id',
        component: AdminDashboardComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'User', roles: TRAINER_ROLES },
      },
      {
        path: 'learners',
        component: LearnerListComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'Learners', roles: TRAINER_ROLES },
      },
      {
        path: 'learners/:id/edit',
        component: UserEditComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'Edit Learner', roles: TRAINER_ROLES },
      },
      {
        path: 'learners/create',
        component: UserEditComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'Add Learner', roles: TRAINER_ROLES },
      },
      {
        path: 'modules',
        component: TrainerModulesListComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'Modules', roles: TRAINER_ROLES },
      },
      {
        path: 'modules/:id/edit',
        component: ModuleEditComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'Edit Module', roles: TRAINER_ROLES },
      },
      {
        path: 'modules/create',
        component: ModuleEditComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'Create Module', roles: TRAINER_ROLES },
      },
      {
        path: 'cohorts',
        component: CohortsListComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'Cohorts', roles: TRAINER_ROLES },
      },
      {
        path: 'scenarios',
        component: ScenarioListComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'Scenarios', roles: TRAINER_ROLES },
      },
      {
        path: 'scenarios/:id/edit',
        component: ScenarioEditComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'Edit Scenario', roles: TRAINER_ROLES },
      },
      {
        path: 'scenarios/create',
        component: ScenarioEditComponent,
        canActivate: [AuthGuard],
        data: { breadcrumb: 'Create Scenario', roles: TRAINER_ROLES },
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  {
    path: 'settings',
    component: UserSettingsComponent,
    canActivate: [AuthGuard],
    data: { breadcrumb: 'Settings', roles: ANY_ROLE },
  },
  // Wildcard route - redirect to the learner dashboard; AuthGuard then bounces
  // an unauthenticated visitor to login and a trainer on to /trainer/dashboard.
  { path: '**', redirectTo: '/learner/dashboard' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    ScenarioEditComponent,
    LearnerListComponent,
    CohortsListComponent,
    TrainerModulesListComponent,
    ModuleEditComponent,
    UserEditComponent,
  ],
  exports: [RouterModule],
  providers: [AuthGuard],
})
export class AppRoutingModule {}
