import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { UsersEffects } from './+state/users.effects';
import { usersReducer } from './+state/users.reducer';

@NgModule({
  imports: [
    StoreModule.forFeature('users', usersReducer),
    EffectsModule.forFeature([UsersEffects]),
  ],
})
export class UsersModule {}
