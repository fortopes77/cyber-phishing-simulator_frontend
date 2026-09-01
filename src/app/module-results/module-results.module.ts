import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { ModuleResultsEffects } from './+state/module-results.effects';
import { moduleResultsReducer } from './+state/module-results.reducer';

@NgModule({
  imports: [
    StoreModule.forFeature('moduleResults', moduleResultsReducer),
    EffectsModule.forFeature([ModuleResultsEffects]),
  ],
})
export class ModuleResultsModule {}
