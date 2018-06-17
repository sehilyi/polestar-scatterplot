import * as React from 'react';
import * as CSSModules from 'react-css-modules';
import {connect} from 'react-redux';
import {InlineData} from 'vega-lite/build/src/data';
import * as idlLogo from '../../../images/idl-h56.png';
import * as logo from '../../../images/logo.png';
import {State} from '../../models/index';
import {selectData} from '../../selectors/dataset';
import {Controls} from './controls';
import * as styles from './header.scss';
import {Themes} from './theme';
import {ActionHandler, createDispatchHandler, ThemeAction} from '../../actions';
import {Action} from '../../actions/index';
import {selectTheme} from '../../selectors';
import {Themes as ITheme} from '../../models/theme/theme';

export interface HeaderProps extends ActionHandler<Action> {
  data: InlineData;
  theme: ITheme;
}

export class HeaderBase extends React.PureComponent<HeaderProps, {}> {

  constructor(props: HeaderProps) {
    super(props);
  }

  public render() {
    const {data, theme, handleAction} = this.props;
    return (
      <div styleName='header'>
        <img styleName='voyager-logo' src={logo} />
        {data && <Controls />}
        {data && <Themes theme={theme.theme} handleAction={handleAction} />}
      </div>
    );
  }

  private openLink() {
    window.open('https://idl.cs.washington.edu/');
  }
}

export const Header = connect(
  (state: State) => {
    return {
      data: selectData(state),
      theme: selectTheme(state)
    };
  },
  createDispatchHandler<ThemeAction>()
)(CSSModules(HeaderBase, styles));
