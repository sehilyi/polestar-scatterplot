import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from "./guide-notification.scss";
import * as warn from '../../../images/warning.png';
import * as done from '../../../images/done.png';
import * as ignore from '../../../images/ignore.png';
import {GuidelineItem} from '../../models/guidelines';
import {ActionHandler, ShelfAction} from '../../actions';
import {GUIDELINE_REMOVE_ITEM, GuidelineAction, GUIDELINE_SHOW_INDICATOR, GUIDELINE_HIDE_INDICATOR, GUIDELINE_TOGGLE_IGNORE_ITEM, GUIDELINE_TOGGLE_ISEXPANDED} from '../../actions/guidelines';
import {ActionableCategory} from './actionable-pane/actionable-category';
import {Schema, ShelfUnitSpec, DEFAULT_SHELF_UNIT_SPEC, ShelfFilter, filterIndexOf, filterHasField} from '../../models';
import {InlineData} from 'vega-lite/build/src/data';
import {FacetedCompositeUnitSpec} from 'vega-lite/build/src/spec';
import {Themes} from '../../models/theme/theme';
import {OneOfFilter} from '../../../node_modules/vega-lite/build/src/filter';

export interface GuideNotificationProps extends ActionHandler<GuidelineAction> {
  item: GuidelineItem;

  schema: Schema;
  spec: ShelfUnitSpec;

  //preveiw
  data: InlineData;
  mainSpec: FacetedCompositeUnitSpec;
  theme: Themes;
  filters: ShelfFilter[];
}

export class GuideNotificationBase extends React.PureComponent<GuideNotificationProps, {}> {

  constructor(props: GuideNotificationProps) {
    super(props);

    this.onShowIndicator = this.onShowIndicator.bind(this);
    this.onHideIndicator = this.onHideIndicator.bind(this);
    this.onOpenGuide = this.onOpenGuide.bind(this);
    this.onIgnore = this.onIgnore.bind(this);

    console.log("constructor of GuideNotificationBase");
  }

  public render() {
    const {isExpanded, guideState} = this.props.item;

    return (
      <div styleName={isExpanded ? "expanded" : "guideline"}
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
        <div styleName="guide-interactive">
          {this.renderInteractive()}
        </div>
        <div styleName="guide-content">
          <span styleName="guide-content-text">{this.props.item.content}</span>
        </div>
      </div>
    );
  }
  private renderInteractive() {
    switch (this.props.item.id) {
      case "GUIDELINE_TOO_MANY_CATEGORIES":
        const {item, schema, spec, handleAction, data, mainSpec, theme, filters} = this.props;
        let field = spec.encoding.color.field.toString();
        const domainWithFilter = (filterHasField(filters, field) ?
          (filters[filterIndexOf(filters, field)] as OneOfFilter).oneOf :
          schema.domain({field}));
        const domain = schema.domain({field});

        return (
          <ActionableCategory
            item={item}
            domain={domain}
            domainWithFilter={domainWithFilter}
            spec={spec}
            schema={schema}
            handleAction={handleAction}

            data={data}
            mainSpec={mainSpec}
            theme={theme}
            filters={filters}
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
    const {item} = this.props;
    this.props.handleAction({
      type: GUIDELINE_TOGGLE_ISEXPANDED,
      payload: {
        item: item
      }
    });
  }
  private onIgnore() {
    this.props.handleAction({
      type: GUIDELINE_TOGGLE_IGNORE_ITEM,
      payload: {
        item: this.props.item
      }
    });
  }
}

export const GuideNotification = CSSModules(GuideNotificationBase, styles);