import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AdminDashboardComponent } from './dashboards/admin-dashboard/admin-dashboard.component';
import { UserDashboardComponent } from './dashboards/user-dashboard/user-dashboard.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  // Public route
  { path: 'login', component: LoginComponent },

  // Protected routes
  {
    path: 'learner',
    canActivate: [AuthGuard],
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
    canActivate: [AuthGuard],
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
