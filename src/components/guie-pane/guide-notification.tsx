import * as React from 'react';
import * as CSSModules from 'react-css-modules';
import * as styles from "./guide-notification.scss";
import {GuideNotificationModel} from ".";

import * as logo from '../../../images/icon-encoding.png';

export interface GuideNotificationProps {
  guide: GuideNotificationModel;
}

export class GuideNotificationBase extends React.PureComponent<GuideNotificationProps, {}> {

  constructor(props: GuideNotificationProps) {
    super(props);
  }

  public render() {
    return (
      <div styleName="guideline" onClick={this.onIgnore}>
        <img styleName='icon' src={logo} />
        <div styleName="guide-label">
          <span styleName="guide-category">{this.props.guide.category}</span>
          <span styleName="guide-title">{this.props.guide.title}</span>
        </div>
        <span styleName="ignore-button">
          <a onClick={this.onIgnore}>
            <i className="fa fa-times"></i>
          </a>
        </span>

      </div>
    );
  }

  private onIgnore() {
    this.setState({isIgnored: true}); //TODO: make this working
  }
}

export const GuideNotification = CSSModules(GuideNotificationBase, styles);