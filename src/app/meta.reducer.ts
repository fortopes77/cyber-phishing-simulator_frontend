import { ActionReducer, MetaReducer } from '@ngrx/store';
import { localStorageSync } from 'ngrx-store-localstorage';

export function localStorageSyncReducer(
  reducer: ActionReducer<any>,
): ActionReducer<any> {
  return localStorageSync({
    keys: ['auth'], // Only these state slices will be saved
    rehydrate: true, // Automatically pull data from storage on init
  })(reducer);
}

// Add it to your metaReducers array
export const metaReducers: MetaReducer<any>[] = [localStorageSyncReducer];
