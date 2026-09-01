import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { DashboardEffects } from './+state/dashboard.effects';
import { dashboardReducer } from './+state/dashboard.reducer';

@NgModule({
  imports: [
    StoreModule.forFeature('dashboard', dashboardReducer),
    EffectsModule.forFeature([DashboardEffects]),
  ],
})
export class AdminModule {}
