import type { AppState } from './types';

export interface DrawingSaveValidation {
  aff: boolean;
  screen: boolean;
  isValid: boolean;
}

export function getDrawingSaveValidation(state: AppState): DrawingSaveValidation {
  const aff = (state.settings.affLabel ?? 0) <= 0;
  const screen = state.screen.width <= 0 || state.screen.height <= 0;
  return { aff, screen, isValid: !aff && !screen };
}
