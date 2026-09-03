import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { ResultsEffects } from './+state/results.effects';
import { resultsReducer } from './+state/results.reducer';

@NgModule({
  imports: [
    StoreModule.forFeature('results', resultsReducer),
    EffectsModule.forFeature([ResultsEffects]),
  ],
})
export class ResultsModule {}
