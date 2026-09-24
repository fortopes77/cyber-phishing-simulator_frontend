import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { OrganisationsEffects } from './+state/organisations.effects';
import { organisationsReducer } from './+state/organisations.reducer';

@NgModule({
  imports: [
    StoreModule.forFeature('organisations', organisationsReducer),
    EffectsModule.forFeature([OrganisationsEffects]),
  ],
})
export class OrganisationsModule {}
