import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { AuthEffects } from './+state/auth.effects';
import { authReducer } from './+state/auth.reducer';

import { NgModule } from '@angular/core';

@NgModule({
  imports: [
    StoreModule.forFeature('auth', authReducer),
    EffectsModule.forFeature([AuthEffects]),
  ],
})
export class AuthModule {}
