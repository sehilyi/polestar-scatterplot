import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './number-adjuster.scss';

export interface NumberAdjusterProps {
  id: string;
  title?: string;
  subtitle?: string;
  defaultNumber: number;
  min: number;
  max: number;
  step: number;
  adjustedNumberAction: (adjusted: number) => void;
}

export interface NumberAdjusterState {
  adjustedNumber: number;
}

export class NumberAdjusterBase extends React.PureComponent<NumberAdjusterProps, NumberAdjusterState> {
  constructor(props: NumberAdjusterProps) {
    super(props);
    this.state = {
      adjustedNumber: this.props.defaultNumber
    }
  }

  public render() {
    const {id, title, subtitle, min, max, step, defaultNumber} = this.props;
    const {adjustedNumber} = this.state;
    return (
      <div id={id} styleName='number-adjuster'>
        {title != '' ?
          <h2>{title}</h2> :
          null
        }
        {subtitle != '' ?
          <h3>{subtitle}</h3> :
          null
        }
        <div styleName='slider'>
          <div>{this.state.adjustedNumber}</div>
          <div>
            <span>{min + ' '}</span>
            <input type='range'
              id={id}
              styleName='range-input'
              min={min} max={max} step={step}
              defaultValue={defaultNumber.toString()}
              value={adjustedNumber}
              onChange={this.changeValue.bind(this)} />
            <span>{' ' + max}</span>
          </div>
        </div>
      </div>
    );
  }

  private changeValue(event: any) {
    let value = event.target.value;
    const {adjustedNumberAction} = this.props;
    this.setState({adjustedNumber: value});
    adjustedNumberAction(value);
  }
}

export const NumberAdjuster = (CSSModules(NumberAdjusterBase, styles));