import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from "./guide-notification.scss";
import * as warn from '../../../images/warning.png';
import * as done from '../../../images/done.png';
import {GuidelineItem} from '../../models/guidelines';
import {ActionHandler, ShelfAction} from '../../actions';
import {GUIDELINE_REMOVE_ITEM, GuidelineAction} from '../../actions/guidelines';
import {ActionableCategory} from './actionable-pane/actionable-category';
import {Schema, ShelfUnitSpec} from '../../models';

export interface GuideNotificationProps extends ActionHandler<GuidelineAction> {
  item: GuidelineItem;

  schema: Schema;
  spec: ShelfUnitSpec;
}

export class GuideNotificationBase extends React.PureComponent<GuideNotificationProps, any> {

  constructor(props: GuideNotificationProps) {
    super(props);

    this.state = {isExpanded: false};
    this.onOpenGuide = this.onOpenGuide.bind(this);
    this.onIgnore = this.onIgnore.bind(this);
  }

  public render() {
    return (
      <div styleName={this.state.isExpanded ? "expanded" : "guideline"}>
        <div styleName="guide-header">
          <img styleName={this.props.item.guideState == "WARN"? 'icon-show' : 'icon-hide'} src={warn} />
          <img styleName={this.props.item.guideState == "DONE"? 'icon-show' : 'icon-hide'} src={done} />
          <div styleName="guide-label">
            <span styleName={this.props.item.guideState == "WARN" ? "guide-category" : "guide-category-done"}>{this.props.item.category}</span>
            <span styleName={this.props.item.guideState == "WARN" ? "guide-title" : "guide-title-done"}>{this.props.item.title}</span>
          </div>
          <span styleName="decision-button">
            <a onClick={this.onOpenGuide}>
              <i className="fa fa-caret-down" styleName="fa-gray" aria-hidden="true" />
            </a>
            <a onClick={this.onIgnore}>
              <i className="fa fa-times" styleName="fa-gray" />
            </a>
          </span>
        </div>
        <div styleName="splitter" />
        <div styleName="guide-content">
          <span styleName="guide-content-text">{this.props.item.content}</span>
        </div>
        <div styleName="guide-interactive">
          {this.renderInteractive()}
        </div>
      </div>
    );
  }
  private renderInteractive() {
    switch (this.props.item.id) {
      case "GUIDELINE_TOO_MANY_CATEGORIES":
        const {item, schema, spec, handleAction} = this.props;
        let domain = schema.domain({field: spec.encoding.color.field.toString()})
        return (
          <ActionableCategory
            item={item}
            domain={domain}
            spec={spec}
            schema={schema}
            handleAction={handleAction}
          />
        );
    }
  }
  private onOpenGuide() {
    this.setState({isExpanded: !this.state.isExpanded});
  }
  private onIgnore() {
    this.props.handleAction({
      type: GUIDELINE_REMOVE_ITEM,
      payload: {
        item: this.props.item
      }
    });
  }
}

export const GuideNotification = CSSModules(GuideNotificationBase, styles);