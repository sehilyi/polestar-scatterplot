import darkTheme from "./theme-dark";
import voxTheme from "./theme-vox";
import fivethirtyeighttheme from "./theme-fivethirtyeight";
import quartzTheme from "./theme-quartz";
import excelTheme from "./theme-excel";
import ggplot2Theme from "./theme-ggplot2";
import basic from "./theme-basic";

/**
 * Themes for vega charts
 */
export type VegaTheme = 'basic' | 'excel' | 'ggplot2' | 'quartz' | 'vox' | 'fivethirtyeight' | 'dark';
export const ALL_TEHEMS = ['basic', 'excel', 'ggplot2', 'quartz', 'vox', 'fivethirtyeight', 'dark'];

export let themeDict: {[id: string] : any;} = {};
themeDict['basic'] = basic;
themeDict['excel'] = excelTheme;
themeDict['ggplot2'] = ggplot2Theme;
themeDict['quartz'] = quartzTheme;
themeDict['vox'] = voxTheme;
themeDict['fivethirtyeight'] = fivethirtyeighttheme;
themeDict['dark'] = darkTheme;

export interface Themes {
  theme: VegaTheme;
};

export const DEFAULT_THEME: Themes = {
  theme: 'basic'
};