import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { DashboardEffects } from './+state/dashboard.effects';
import { dashboardReducer } from './+state/dashboard.reducer';
import { ReportsEffects } from './+state/reports.effects';
import { reportsReducer } from './+state/reports.reducer';

@NgModule({
  imports: [
    StoreModule.forFeature('dashboard', dashboardReducer),
    StoreModule.forFeature('reports', reportsReducer),
    EffectsModule.forFeature([DashboardEffects, ReportsEffects]),
  ],
})
export class AdminModule {}
