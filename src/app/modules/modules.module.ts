import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { ModulesEffects } from './+state/modules.effects';
import { modulesReducer } from './+state/modules.reducer';

@NgModule({
  imports: [
    StoreModule.forFeature('modules', modulesReducer),
    EffectsModule.forFeature([ModulesEffects]),
  ],
})
export class LearnerModulesModule {}
