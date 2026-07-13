import { NgModule } from '@angular/core';
import { ScenarioEffects } from './+state/scenario.effects';
import { EffectsModule } from '@ngrx/effects';
import { scenarioReducer } from './+state/scenario.reducer';
import { StoreModule } from '@ngrx/store';

@NgModule({
  imports: [
    StoreModule.forFeature('scenario', scenarioReducer),
    EffectsModule.forFeature([ScenarioEffects]),
  ],
})
export class ScenarioModule {}
