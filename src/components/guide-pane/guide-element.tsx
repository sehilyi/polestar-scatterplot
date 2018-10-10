import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from "./guide-element.scss";
import * as warn from '../../../images/warning.png';
import * as tip from '../../../images/tip.png';
import * as done from '../../../images/done.png';
import * as ignore from '../../../images/ignore.png';
import {GuidelineItemTypes, GuidelineItemActionableCategories, isAllowedScatterplot, getGuidedSpec, GuidelineItem, Guidelines} from '../../models/guidelines';
import {ActionHandler} from '../../actions';
import {GuidelineAction, GUIDELINE_SHOW_RECT_INDICATOR, GUIDELINE_HIDE_INDICATOR, GUIDELINE_TOGGLE_IGNORE_ITEM, GUIDELINE_TOGGLE_ISEXPANDED} from '../../actions/guidelines';
import {Schema, ShelfUnitSpec, ShelfFilter, filterIndexOf, filterHasField} from '../../models';
import {InlineData} from 'vega-lite/build/src/data';
import {FacetedCompositeUnitSpec} from 'vega-lite/build/src/spec';
import {Themes} from '../../models/theme/theme';
import {OneOfFilter} from '../../../node_modules/vega-lite/build/src/filter';
import {COLOR, SHAPE} from '../../../node_modules/vega-lite/build/src/channel';
import {ActionableOverplotting} from './actionable-pane/actionable-overplotting';
import {showContourInD3Chart, hideContourInD3Chart} from '../../models/d3-chart';
import {StudySetting} from '../../models/study';

export interface GuideElementProps extends ActionHandler<GuidelineAction> {
  item: GuidelineItemTypes;

  schema: Schema;
  spec: ShelfUnitSpec;

  // for vega preview
  data: InlineData;
  mainSpec: FacetedCompositeUnitSpec;
  filters: ShelfFilter[];
  theme: Themes;
  studySetting: StudySetting;

  // TODO: try to remove this
  guidelines: GuidelineItemTypes[];
}

export interface GuideElementState {
  isExpanded: boolean;
}

export class GuideElementBase extends React.PureComponent<GuideElementProps, GuideElementState> {

  constructor(props: GuideElementProps) {
    super(props);
    this.state = ({
      isExpanded: true
    })

    this.onShowIndicator = this.onShowIndicator.bind(this);
    this.onHideIndicator = this.onHideIndicator.bind(this);
    this.onShowContour = this.onShowContour.bind(this);
    this.onHideContour = this.onHideContour.bind(this);
    this.onOpenGuide = this.onOpenGuide.bind(this);
    this.onIgnore = this.onIgnore.bind(this);
  }

  public render() {

    if (this.state.isExpanded === true && this.props.item.guideState == "IGNORE")
      this.setState({isExpanded: false});

    const {guideState, content, title, subtitle} = this.props.item;

    return (
      <div styleName={this.state.isExpanded ? "expanded" : "guideline"}>
        <div styleName="actionable-pane">
          {this.renderActionablePane()}
        </div>
      </div>
    );
  }
  private renderActionablePane() {
    const {id} = this.props.item;
    const {item, schema, spec, handleAction, data, mainSpec, theme, filters, guidelines, studySetting} = this.props;

    switch (id) {
      case 'GUIDELINE_OVER_PLOTTING': {
        return (
          <ActionableOverplotting
            item={item as GuidelineItemActionableCategories}
            schema={schema}
            filters={filters}
            handleAction={handleAction}
            studySetting={studySetting}

            // for vega preview
            data={data}
            mainSpec={getGuidedSpec(mainSpec, guidelines, schema)}
            theme={theme}
          />
        );
      }
      case "GUIDELINE_NONE":
        break;
    }
  }

  private onShowContour() {
    if (isAllowedScatterplot(this.props.mainSpec)) {
      // showContourInD3Chart(this.props.mainSpec, this.props.data.values);
    }
  }
  private onHideContour() {
    // hideContourInD3Chart();
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