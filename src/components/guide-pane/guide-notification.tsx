import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from "./guide-notification.scss";
import * as logo from '../../../images/icon-encoding.png';
import {GuidelineItem} from '../../models/guidelines';
import {ActionHandler} from '../../actions';
import {GUIDELINE_REMOVE_ITEM, GuidelineAction} from '../../actions/guidelines';

export interface GuideNotificationProps extends ActionHandler<GuidelineAction> {
  guideHeader: GuidelineItem;
}

export class GuideNotificationBase extends React.PureComponent<GuideNotificationProps, any> {

  constructor(props: GuideNotificationProps) {
    super(props);

    this.state = {isExpanded: false};
    this.onOpenGuide = this.onOpenGuide.bind(this);
  }

  public render() {
    return (
      <div styleName={this.state.isExpanded ? "expanded" : "guideline"}>
        <div styleName="guide-header" onClick={this.onOpenGuide}>
          <img styleName='icon' src={logo} />
          <div styleName="guide-label">
            <span styleName="guide-category">{this.props.guideHeader.category}</span>
            <span styleName="guide-title">{this.props.guideHeader.title}</span>
          </div>
          <span styleName="ignore-button">
            <a onClick={this.onIgnore}>
              <i className="fa fa-times"></i>
            </a>
          </span>
        </div>
        <div styleName="splitter" />
        <div styleName="guide-content">
          <span styleName="guide-content-text">{this.props.guideHeader.content}</span>
        </div>
        <div styleName="guide-interactive">
        </div>
      </div>
    );
  }

  private onIgnore() {
    console.log('onIgnore');
    this.props.handleAction({
      type: GUIDELINE_REMOVE_ITEM,
      payload: {
        item: this.props.guideHeader
      }
    });
  }

  private onOpenGuide() {
    this.setState({isExpanded: !this.state.isExpanded});
  }
}

export const GuideNotification = CSSModules(GuideNotificationBase, styles);