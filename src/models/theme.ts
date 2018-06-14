import {VegaTheme} from "../components/header/theme";

export interface Themes {
  theme: VegaTheme;
};

//TODO: Why must be undefined??
export const DEFAULT_THEME: Themes = {
  theme: undefined
};