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
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'admin' },
  },
  {
    path: 'user-dashboard',
    component: UserDashboardComponent,
    canActivate: [AuthGuard],
  },

  // Default redirect
  { path: '', redirectTo: '/user-dashboard', pathMatch: 'full' },

  // Wildcard route - redirect to user dashboard if authenticated, login if not
  { path: '**', redirectTo: '/user-dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
