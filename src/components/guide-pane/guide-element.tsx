import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from "./guide-element.scss";
import * as warn from '../../../images/warning.png';
import * as tip from '../../../images/tip.png';
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
import {COLOR, SHAPE} from '../../../node_modules/vega-lite/build/src/channel';
import {ActionableNewVis} from './actionable-pane/actionable-new-vis';
import {ActionableOverplotting} from './actionable-pane/actionable-overplotting';

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

    const {guideState, content, title, subtitle} = this.props.item;

    return (
      <div styleName={this.state.isExpanded ? "expanded" : "guideline"}>
        <div styleName="guide-header">
          <img styleName={guideState == "WARN" ? 'icon-show' : 'icon-hide'} src={warn} />
          <img styleName={guideState == "TIP" ? 'icon-show' : 'icon-hide'} src={tip} />
          <img styleName={guideState == "DONE" ? 'icon-show' : 'icon-hide'} src={done} />
          <img styleName={guideState == "IGNORE" ? 'icon-show' : 'icon-hide'} src={ignore} />
          <div styleName="guide-label" className="hover-background">
            <span styleName={guideState == "WARN" || guideState == "TIP" ? "guide-category" : guideState == "DONE" ? "guide-category-done" : "guide-category-ignore"}
              onMouseEnter={this.onShowIndicator}
              onMouseLeave={this.onHideIndicator}>
              <span styleName={this.props.item.noneIndicator ? null : "guide-hover-highlighter"}>
                {title + ' '}
                {this.props.item.noneIndicator ? null : <i className="fa fa-question" styleName="fa-dim" aria-hidden="true" />}
              </span>
            </span>
            <span styleName={guideState == "WARN" || guideState == "TIP" ? "guide-title" : guideState == "DONE" ? "guide-title-done" : "guide-title-ignore"}>{subtitle}</span>
          </div>
          <span styleName="decision-button">
            {guideState != "IGNORE" ?
              <a onClick={this.onOpenGuide}>
                <i className="fa fa-caret-down fa-gray" aria-hidden="true" />
              </a>
              : null
            }
            <a onClick={this.onIgnore}>
              <i className="fa fa-eye-slash fa-gray" aria-hidden="true" />
            </a>
          </span>
        </div>
        <div styleName="splitter" />
        <div styleName="guide-content">
          {content != '' ?
            <h2>Why Is This Matter?</h2> :
            null
          }
          <span styleName="guide-content-text">{content}</span>
        </div>
        <div styleName="actionable-pane">
          {this.renderActionablePane()}
        </div>
      </div>
    );
  }
  private renderActionablePane() {
    const {id} = this.props.item;
    const {item, schema, spec, handleAction, data, mainSpec, theme, filters} = this.props;

    switch (id) {
      case 'GUIDELINE_OVER_PLOTTING': {
        return (
          <ActionableOverplotting
            item={item as GuidelineItemActionableCategories}
            //
            handleAction={handleAction}

            // for vega preview
            data={data}
            mainSpec={mainSpec}
            theme={theme}
          />
        );
      }
      case "GUIDELINE_TOO_MANY_COLOR_CATEGORIES": {
        let field = spec.encoding.color.field.toString();
        const domainWithFilter = (filterHasField(filters, field) ?
          (filters[filterIndexOf(filters, field)] as OneOfFilter).oneOf :
          schema.domain({field}));
        const domain = schema.domain({field});

        return (
          <ActionableCategory
            item={item as GuidelineItemActionableCategories}
            field={field}
            channel={COLOR}
            domain={domain}
            domainWithFilter={domainWithFilter}
            spec={spec}
            schema={schema}
            handleAction={handleAction}
            isSelectionUsing={true}

            // for vega preview
            data={data}
            mainSpec={mainSpec}
            theme={theme}
            filters={filters}
          />
        );
      }
      case "GUIDELINE_TOO_MANY_SHAPE_CATEGORIES": {
        let field = spec.encoding.shape.field.toString();
        const domainWithFilter = (filterHasField(filters, field) ?
          (filters[filterIndexOf(filters, field)] as OneOfFilter).oneOf :
          schema.domain({field}));
        const domain = schema.domain({field});

        return (
          <ActionableCategory
            item={item as GuidelineItemActionableCategories}
            field={field}
            channel={SHAPE}
            domain={domain}
            domainWithFilter={domainWithFilter}
            spec={spec}
            schema={schema}
            handleAction={handleAction}
            isSelectionUsing={false}

            // for vega preview
            data={data}
            mainSpec={mainSpec}
            theme={theme}
            filters={filters}
          />
        );
      }
      case "NEW_CHART_BINNED_SCATTERPLOT": {
        return (
          <ActionableNewVis
            item={item}
            handleAction={handleAction}

            // for vega preview
            data={data}
            mainSpec={mainSpec}
            theme={theme}
          />
        );
      }
      case "GUIDELINE_NONE":
        break;
    }
  }

  // As reviewed, legends are shown with the following order: color, size, shape
  private onShowIndicator() {
    if (this.props.item.noneIndicator) return;

    const BOX_MARGIN = 4;
    const root = document.getElementById('root'),
      legends = root.getElementsByClassName('role-legend'),
      specifiedView = document.getElementById('specified-view'),
      legend_index = this.bestGuessLegendIndex();
    const legend = legends[legend_index];

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

  /**
   * Legend priority: color => size => shape
   * But they can be combined if fields are the same
   * TODO: should also consider when color scale is specified
   */
  private bestGuessLegendIndex(): number {
    switch (this.props.item.id) {
      case "GUIDELINE_TOO_MANY_COLOR_CATEGORIES":
        return 0;
      case "GUIDELINE_TOO_MANY_SHAPE_CATEGORIES": {
        const {encoding} = this.props.spec;
        if (typeof encoding.color == 'undefined' && typeof encoding.size == 'undefined') return 0;
        else if (typeof encoding.color != 'undefined' && typeof encoding.size == 'undefined') {
          if (encoding.color == encoding.shape) return 0;
          else return 1;
        }
        else if (typeof encoding.color == 'undefined' && typeof encoding.size != 'undefined') {
          if (encoding.size == encoding.shape) return 0;
          else return 1;
        }
        else if (typeof encoding.color != 'undefined' && typeof encoding.size != 'undefined') {
          if (encoding.color == encoding.shape) return 0; // shape legend will be combined with the color's
          else if (encoding.size == encoding.shape) return 1;  //shape legend will be combined with the size's
          else if (encoding.color == encoding.size) return 1;  //shape legend will be combined with the size's
          else return 2;
        }
      }
    }
    return 0;
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