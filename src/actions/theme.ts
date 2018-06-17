import {ReduxAction} from './redux-action';
import {VegaTheme} from '../models/theme/theme';

export type ThemeAction = ThemeChange;

export const THEME_CHANGE = 'THEME_CHANGE';
export type ThemeChange = ReduxAction<typeof THEME_CHANGE, VegaTheme>;