import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from "./guide-element.scss";
import * as warn from '../../../images/warning.png';
import * as done from '../../../images/done.png';
import * as ignore from '../../../images/ignore.png';
import {GuidelineItemTypes, GuidelineItemActionableCategories} from '../../models/guidelines';
import {ActionHandler} from '../../actions';
import {GuidelineAction, GUIDELINE_SHOW_RECT_INDICATOR, GUIDELINE_HIDE_INDICATOR, GUIDELINE_TOGGLE_IGNORE_ITEM, GUIDELINE_TOGGLE_ISEXPANDED} from '../../actions/guidelines';
import {ActionableCategory} from './actionable-pane/actionable-category';
import {Schema, ShelfUnitSpec, ShelfFilter, filterIndexOf, filterHasField} from '../../models';
import {InlineData} from 'vega-lite/build/src/data';
import {FacetedCompositeUnitSpec} from 'vega-lite/build/src/spec';
import {Themes} from '../../models/theme/theme';
import {OneOfFilter} from '../../../node_modules/vega-lite/build/src/filter';

export interface GuideElementProps extends ActionHandler<GuidelineAction> {
  item: GuidelineItemTypes;

  schema: Schema;
  spec: ShelfUnitSpec;

  // for vega preview
  data: InlineData;
  mainSpec: FacetedCompositeUnitSpec;
  filters: ShelfFilter[];
  theme: Themes;
}

export interface GuideElementState {
  isExpanded: boolean;
}

export class GuideElementBase extends React.PureComponent<GuideElementProps, GuideElementState> {

  constructor(props: GuideElementProps) {
    super(props);
    this.state = ({
      isExpanded: false
    })

    this.onShowIndicator = this.onShowIndicator.bind(this);
    this.onHideIndicator = this.onHideIndicator.bind(this);
    this.onOpenGuide = this.onOpenGuide.bind(this);
    this.onIgnore = this.onIgnore.bind(this);
  }

  public render() {

    if (this.state.isExpanded === true && this.props.item.guideState == "IGNORE")
      this.setState({isExpanded: false});

    const {guideState, content, category, title} = this.props.item;

    return (
      <div styleName={this.state.isExpanded ? "expanded" : "guideline"}
        onMouseEnter={this.onShowIndicator}
        onMouseLeave={this.onHideIndicator}>
        <div styleName="guide-header">
          <img styleName={guideState == "WARN" ? 'icon-show' : 'icon-hide'} src={warn} />
          <img styleName={guideState == "DONE" ? 'icon-show' : 'icon-hide'} src={done} />
          <img styleName={guideState == "IGNORE" ? 'icon-show' : 'icon-hide'} src={ignore} />
          <div styleName="guide-label">
            <span styleName={guideState == "WARN" ? "guide-category" : guideState == "DONE" ? "guide-category-done" : "guide-category-ignore"}>{category}</span>
            <span styleName={guideState == "WARN" ? "guide-title" : guideState == "DONE" ? "guide-title-done" : "guide-title-ignore"}>{title}</span>
          </div>
          <span styleName="decision-button">
            {guideState != "IGNORE" ?
              <a onClick={this.onOpenGuide}>
                <i className="fa fa-caret-down fa-gray" aria-hidden="true" />
              </a>
              : null
            }
            {guideState != "DONE" ?
              <a onClick={this.onIgnore}>
                <i className="fa fa-eye-slash fa-gray" aria-hidden="true" />
              </a>
              : null
            }
          </span>
        </div>
        <div styleName="splitter" />
        <div styleName="actionable-pane">
          {this.renderActionablePane()}
        </div>
        <div styleName="guide-content">
          <span styleName="guide-content-text">{content}</span>
        </div>
      </div>
    );
  }
  private renderActionablePane() {
    const {id} = this.props.item;

    switch (id) {
      case "GUIDELINE_TOO_MANY_CATEGORIES": {
        const {item, schema, spec, handleAction, data, mainSpec, theme, filters} = this.props;
        let field = spec.encoding.color.field.toString();
        const domainWithFilter = (filterHasField(filters, field) ?
          (filters[filterIndexOf(filters, field)] as OneOfFilter).oneOf :
          schema.domain({field}));
        const domain = schema.domain({field});

        return (
          <ActionableCategory
            item={item as GuidelineItemActionableCategories}
            domain={domain}
            domainWithFilter={domainWithFilter}
            spec={spec}
            schema={schema}
            handleAction={handleAction}

            // for vega preview
            data={data}
            mainSpec={mainSpec}
            theme={theme}
            filters={filters}
          />
        );
      }
      case "GUIDELINE_NONE":
        break;
    }
  }

  private onShowIndicator() {
    const BOX_MARGIN = 4;
    const root = document.getElementById('root'),
      legend = root.getElementsByClassName('role-legend')[0],
      specifiedView = document.getElementById('specified-view');

    let size = {width: legend.getBoundingClientRect().width, height: legend.getBoundingClientRect().height},
      position = {x: legend.getBoundingClientRect().left, y: legend.getBoundingClientRect().top};

    position.x -= (specifiedView.getBoundingClientRect().left + BOX_MARGIN);
    position.y -= (specifiedView.getBoundingClientRect().top + BOX_MARGIN);
    size.width += BOX_MARGIN * 2;
    size.height += BOX_MARGIN * 2;

    this.props.handleAction({
      type: GUIDELINE_SHOW_RECT_INDICATOR,
      payload: {
        size,
        position
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
    this.setState({
      isExpanded: !this.state.isExpanded
    });
  }

  private onIgnore() {
    const {item} = this.props;
    this.props.handleAction({
      type: GUIDELINE_TOGGLE_IGNORE_ITEM,
      payload: {item}
    });
  }
}

export const GuideElement = CSSModules(GuideElementBase, styles);