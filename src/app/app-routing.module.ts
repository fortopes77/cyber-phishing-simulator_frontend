import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/components/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { SignOutComponent } from './auth/components/sign-out/sign-out.component';
import { UserDashboardComponent } from './learner/components/user-dashboard/user-dashboard.component';
import { AdminDashboardComponent } from './admin/components/admin-dashboard/admin-dashboard.component';

const routes: Routes = [
  // Public routes
  { path: 'login', component: LoginComponent },
  { path: 'sign-out', component: SignOutComponent },

  // Protected routes
  {
    path: 'learner',
    // canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: UserDashboardComponent },
      { path: 'scenarios/:id', component: UserDashboardComponent },
      { path: 'scenarios/:id/feedback', component: UserDashboardComponent },
      { path: 'results', component: UserDashboardComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'trainer',
    // canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'trainer/users/:id', component: AdminDashboardComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  // Wildcard route - redirect to user dashboard if authenticated, login if not
  { path: '**', redirectTo: '/learner/dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard],
})
export class AppRoutingModule {}
