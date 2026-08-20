import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { AttemptsEffects } from './+state/attempts.effects';
import { attemptsReducer } from './+state/attempts.reducer';

@NgModule({
  imports: [
    StoreModule.forFeature('attempts', attemptsReducer),
    EffectsModule.forFeature([AttemptsEffects]),
  ],
})
export class AttemptsModule {}
