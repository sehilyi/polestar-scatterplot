import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './theme.scss';
import {ActionHandler} from '../../actions';
import {THEME_CHANGE, ThemeAction} from '../../actions/theme';
import {ALL_TEHEMS, VegaTheme} from '../../models/theme/theme';

export const options = ALL_TEHEMS.map(theme => (
  <option key={theme} value={theme}>
    {theme}
  </option>
));

export interface ThemeProps extends ActionHandler<ThemeAction> {
  theme: string;
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
      <div styleName='right'>
        <i className="fa fa-bar-chart" aria-hidden="true">
          &nbsp;
          Theme
          &nbsp;&nbsp;
        </i>
        <select disabled
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

export const Themes = (CSSModules(ThemesBase, styles));