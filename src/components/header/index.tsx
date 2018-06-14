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
import {Themes, ThemesBase, VegaTheme} from './theme';
import {ActionHandler} from '../../actions';
import {ThemeChange} from '../../actions/theme';

export interface HeaderProps extends ActionHandler<ThemeChange>{
  data: InlineData;
}

export class HeaderBase extends React.PureComponent<HeaderProps, {}> {
  public render() {
    const {handleAction, data} = this.props;
    const val: VegaTheme = VegaTheme.BASIC;
    return (
      <div styleName='header'>
        <img styleName='voyager-logo' src={logo} />
        {data && <Controls />}
        {data && <Themes theme={val} handleAction={handleAction}/>}
        {/* <a styleName='idl-logo' onClick={this.openLink}>
          <img src={idlLogo}/>
        </a> */}
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
      data: selectData(state)
    };
  }
)(CSSModules(HeaderBase, styles));
