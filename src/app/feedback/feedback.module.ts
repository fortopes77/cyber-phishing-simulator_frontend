import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { FeedbackEffects } from './+state/feedback.effects';
import { feedbackReducer } from './+state/feedback.reducer';

@NgModule({
  imports: [
    StoreModule.forFeature('feedback', feedbackReducer),
    EffectsModule.forFeature([FeedbackEffects]),
  ],
})
export class FeedbackModule {}
