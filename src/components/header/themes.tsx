import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './themes.scss';
import {ActionHandler} from '../../actions';
import {ReduxAction} from '../../actions/redux-action';

export namespace VegaTheme {
  export const BASIC: 'basic' = 'basic';
  export const FIVE38: '538' = '538';
}

/**
 * Themes for vega charts
 */
export type VegaTheme = typeof VegaTheme.BASIC | typeof VegaTheme.FIVE38;

export const BASIC = VegaTheme.BASIC;
export const FIVE38 = VegaTheme.FIVE38;

export const THEME_CHANGE_TYPE = 'THEME_CHANGE_TYPE';
export type ThemeChangeType = ReduxAction<typeof THEME_CHANGE_TYPE, VegaTheme>;

// export type VegaThemes = VegaTheme | 'A';

export interface ThemeProps {//extends ActionHandler<ThemeChangeType> {
  theme: string;
}

export const ALL_TEHEMS = ["Basic", "538"];

export const options = ALL_TEHEMS.map(theme => (
  <option key={theme} value={theme}>
    {theme}
  </option>
));

export class ThemesBase extends React.PureComponent<ThemeProps, {}> {
  constructor(props: ThemeProps) {
    super(props);

    // Bind - https://facebook.github.io/react/docs/handling-events.html
    // this.onThemeChange = this.onThemeChange.bind(this);
  }

  public render() {
    // const {theme} = this.props;
    return (
      <div styleName='theme-selecter'>
        Themes
        <select
          value='s'
        >
          {options}
        </select>
      </div>
    );
  }
  // private onThemeChange(event: any) {
  //   this.props.handleAction({
  //     type: THEME_CHANGE_TYPE,
  //     payload: event.target.value as VegaThemes
  //   });
  // }
}

export const Themes = CSSModules(ThemesBase, styles);