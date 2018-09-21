import * as React from 'react';
import * as CSSModules from 'react-css-modules';
import * as CopyToClipboard from 'react-copy-to-clipboard';

import * as styles from './study.scss';
import {ActionHandler} from '../../actions';
import {THEME_CHANGE, ThemeAction} from '../../actions/theme';
import {ALL_TEHEMS, VegaTheme} from '../../models/theme/theme';
import {StudySettingAction, STUDY_SETTING_CHANGE} from '../../actions/study';
import {STUDY_CONDITIONS, StudySetting} from '../../models/study';
import {range} from '../../util';

export const conOptions = STUDY_CONDITIONS.map(con => (
  <option key={con} value={con}>
    {con}
  </option>
));
export const seedOptions = range(40).map(s => (
  <option key={s} value={s}>
    {s}
  </option>
));

export interface StudyProps extends ActionHandler<StudySettingAction> {
  studySetting: StudySetting;
}

export class StudyBase extends React.PureComponent<StudyProps, {}> {
  constructor(props: StudyProps) {
    super(props);

    this.onSeedChange = this.onSeedChange.bind(this);
    this.onConditionChange = this.onConditionChange.bind(this);
  }

  public render() {
    const {studySetting} = this.props;
    return (
      <div styleName='right'>
        {'Study Setting '}

        {!studySetting.isConditionSelected || true ?
          <select value={studySetting.condition} onChange={this.onConditionChange}>
            {conOptions}
          </select>
          :
          <select value={studySetting.condition} onChange={this.onConditionChange} disabled>
            {conOptions}
          </select>
        }
        {!studySetting.isSeedSelected || true ?
          <select value={studySetting.actionOrderSeed} onChange={this.onSeedChange}>
            {seedOptions}
          </select>
          :
          <select value={studySetting.actionOrderSeed} onChange={this.onSeedChange} disabled>
            {seedOptions}
          </select>
        }

        <CopyToClipboard
          text={this.props.studySetting.log}>
          <i title='Copy' className='fa fa-clipboard' styleName='clipboard' />
        </CopyToClipboard>
      </div>
    );
  }
  private onConditionChange(event: any) {
    let condition = event.target.value;
    this.props.handleAction({
      type: STUDY_SETTING_CHANGE,
      payload: {
        condition,
        actionOrderSeed: this.props.studySetting.actionOrderSeed,
        isConditionSelected: true,
        isSeedSelected: this.props.studySetting.isSeedSelected,
        log: this.props.studySetting.log
      }
    });
  }
  private onSeedChange(event: any) {
    let actionOrderSeed = event.target.value;
    this.props.handleAction({
      type: STUDY_SETTING_CHANGE,
      payload: {
        actionOrderSeed,
        condition: this.props.studySetting.condition,
        isConditionSelected: this.props.studySetting.isConditionSelected,
        isSeedSelected: true,
        log: this.props.studySetting.log
      }
    });
  }
}

export const Study = (CSSModules(StudyBase, styles));