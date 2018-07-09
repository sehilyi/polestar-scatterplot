import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from "./guide-notification.scss";
import * as warn from '../../../images/warning.png';
import * as done from '../../../images/done.png';
import * as ignore from '../../../images/ignore.png';
import {GuidelineItem} from '../../models/guidelines';
import {ActionHandler, ShelfAction} from '../../actions';
import {GUIDELINE_REMOVE_ITEM, GuidelineAction, GUIDELINE_SHOW_INDICATOR, GUIDELINE_HIDE_INDICATOR, GUIDELINE_TOGGLE_IGNORE_ITEM} from '../../actions/guidelines';
import {ActionableCategory} from './actionable-pane/actionable-category';
import {Schema, ShelfUnitSpec, DEFAULT_SHELF_UNIT_SPEC} from '../../models';

export interface GuideNotificationProps extends ActionHandler<GuidelineAction> {
  item: GuidelineItem;

  schema: Schema;
  spec: ShelfUnitSpec;
}

export class GuideNotificationBase extends React.PureComponent<GuideNotificationProps, any> {

  constructor(props: GuideNotificationProps) {
    super(props);

    this.state = {isExpanded: false};
    this.onShowIndicator = this.onShowIndicator.bind(this);
    this.onHideIndicator = this.onHideIndicator.bind(this);
    this.onOpenGuide = this.onOpenGuide.bind(this);
    this.onIgnore = this.onIgnore.bind(this);
  }

  public render() {
    const {guideState} = this.props.item;

    return (
      <div styleName={this.state.isExpanded ? "expanded" : "guideline"}
        onMouseEnter={this.onShowIndicator}
        onMouseLeave={this.onHideIndicator}>
        <div styleName="guide-header">
          <img styleName={guideState == "WARN" ? 'icon-show' : 'icon-hide'} src={warn} />
          <img styleName={guideState == "DONE" ? 'icon-show' : 'icon-hide'} src={done} />
          <img styleName={guideState == "IGNORE" ? 'icon-show' : 'icon-hide'} src={ignore} />
          <div styleName="guide-label">
            <span styleName={guideState == "WARN" ? "guide-category" : guideState == "DONE" ? "guide-category-done" : "guide-category-ignore"}>{this.props.item.category}</span>
            <span styleName={guideState == "WARN" ? "guide-title" : guideState == "DONE" ? "guide-title-done" : "guide-title-ignore"}>{this.props.item.title}</span>
          </div>
          <span styleName="decision-button">
            {guideState != "IGNORE" ?
              <a onClick={this.onOpenGuide}>
                <i className="fa fa-caret-down" styleName="fa-gray" aria-hidden="true" />
              </a>
              : null}
            {guideState != "DONE" ?
              <a onClick={this.onIgnore}>
                <i className="fa fa-eye-slash" styleName="fa-gray" aria-hidden="true" />
                {/* <i className="fa fa-times" styleName="fa-gray" /> */}
              </a>
              : null}
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
  private onShowIndicator() {
    //TODO: change systematically for other guidelines
    const boxMargin = 4;
    const root = document.getElementById('root'),
      legend = root.getElementsByClassName('role-legend')[0],
      specifiedView = document.getElementById('specified-view');

    let size = {width: legend.getBoundingClientRect().width, height: legend.getBoundingClientRect().height},
      position = {x: legend.getBoundingClientRect().left, y: legend.getBoundingClientRect().top};

    position.x = position.x - specifiedView.getBoundingClientRect().left - boxMargin;
    position.y = position.y - specifiedView.getBoundingClientRect().top - boxMargin;
    size.width += boxMargin * 2;
    size.height += boxMargin * 2;

    this.props.handleAction({
      type: GUIDELINE_SHOW_INDICATOR,
      payload: {
        size: size,
        position: position
      }
    })
  }
  private onHideIndicator() {
    this.props.handleAction({
      type: GUIDELINE_HIDE_INDICATOR,
      payload: {}
    })
  }
  private onOpenGuide() {
    this.setState({isExpanded: !this.state.isExpanded});
  }
  private onIgnore() {
    this.props.handleAction({
      type: GUIDELINE_TOGGLE_IGNORE_ITEM,
      payload: {
        item: this.props.item
      }
    });
    const {guideState} = this.props.item;
    this.setState({isExpanded: guideState == "WARN" ? false : this.state.isExpanded});
  }
}

export const GuideNotification = CSSModules(GuideNotificationBase, styles);