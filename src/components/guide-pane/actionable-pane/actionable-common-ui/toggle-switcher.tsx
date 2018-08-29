import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './toggle-switcher.scss';
import {isNullOrUndefined} from '../../../../util';

export interface ToggleSwitcherProps {
  id: string;
  title?: string;
  subtitle?: string;
  defaultIsOn?: boolean;
  toggleAction: (filled: boolean) => void;
}

export interface ToggleSwitcherState {
  isOn: boolean;
}

export class ToggleSwitcherBase extends React.PureComponent<ToggleSwitcherProps, ToggleSwitcherState> {
  constructor(props: ToggleSwitcherProps) {
    super(props);
    const {defaultIsOn} = this.props;
    this.state = {
      isOn: isNullOrUndefined(defaultIsOn) ? true : defaultIsOn
    }
  }

  public render() {
    const {id, title, subtitle} = this.props;
    const {isOn} = this.state;
    return (
      <div id={id} styleName='toggle-switcher'>
        {title != '' ?
          <h2>{title}</h2> :
          null
        }
        {subtitle != '' ?
          <h3>{subtitle}</h3> :
          null
        }
        <div styleName='slider'>
          <label styleName="switch">
            <input type="checkbox" checked={isOn} onClick={this.onCheck.bind(this)} />
            <span styleName="slider-round"></span>
          </label>
        </div>
      </div>
    )
  }

  public onCheck() {
    this.props.toggleAction(this.state.isOn);
    this.setState({isOn: !this.state.isOn})
  }
}

export const ToggleSwitcher = (CSSModules(ToggleSwitcherBase, styles));