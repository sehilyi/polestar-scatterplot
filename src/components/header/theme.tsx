import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './theme.scss';
import {ActionHandler} from '../../actions';
import {THEME_CHANGE, ThemeAction} from '../../actions/theme';

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

export const ALL_TEHEMS = ["Basic", "538"];

export const options = ALL_TEHEMS.map(theme => (
  <option key={theme} value={theme}>
    {theme}
  </option>
));

export interface ThemeProps extends ActionHandler<ThemeAction> {
  theme: VegaTheme;
}

export class ThemesBase extends React.PureComponent<ThemeProps, {}> {
  constructor(props: ThemeProps) {
    super(props);

    // Bind - https://facebook.github.io/react/docs/handling-events.html
    this.onThemeChange = this.onThemeChange.bind(this);
  }

  //TODO: change {theme}
  //TODO: add icon
  public render() {
    const {theme} = this.props;
    return (
      <div styleName='theme-selector'>
        {theme}
        &nbsp;&nbsp;
        <select
          value={theme}
          onChange={this.onThemeChange}
        >
          {options}
        </select>
      </div>
    );
  }
  private onThemeChange(event: any) {
    this.props.handleAction({
      type: THEME_CHANGE,
      payload: event.target.value as VegaTheme
    });
  }
}

export const Themes = CSSModules(ThemesBase, styles);