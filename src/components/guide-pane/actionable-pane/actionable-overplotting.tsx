import * as React from 'react';
import * as CSSModules from 'react-css-modules';
import * as styles from './actionable-overplotting.scss';

import * as d3 from 'd3';
import {Actionables, ACTIONABLE_FILTER_GENERAL, ACTIONABLE_POINT_SIZE, ACTIONABLE_POINT_OPACITY, ACTIONABLE_REMOVE_FILL_COLOR, ACTIONABLE_CHANGE_SHAPE, ACTIONABLE_AGGREGATE, ACTIONABLE_ENCODING_DENSITY, ACTIONABLE_SEPARATE_GRAPH, GuidelineItemOverPlotting, GuideActionItem} from '../../../models/guidelines';
import {GuidelineAction, ActionHandler, GUIDELINE_TOGGLE_IGNORE_ITEM, LogAction, SPEC_MARK_CHANGE_TYPE, SPEC_FIELD_ADD, SPEC_FUNCTION_CHANGE, SpecAction, SPEC_TO_DENSITY_PLOT, SPEC_AGGREGATE_POINTS_BY_COLOR} from '../../../actions';
import {Logger} from '../../util/util.logger';
import {Themes} from '../../../models/theme/theme';
import {FacetedCompositeUnitSpec} from '../../../../node_modules/vega-lite/build/src/spec';
import {InlineData} from '../../../../node_modules/vega-lite/build/src/data';
import {CIRCLE, SQUARE, POINT, Mark, RECT} from '../../../../node_modules/vega-lite/build/src/mark';
import {VegaLite} from '../../vega-lite';
import {QUANTITATIVE, NOMINAL} from '../../../../node_modules/vega-lite/build/src/type';
import {Schema, FieldSchema} from '../../../models';
import {COLOR, X, Y, COLUMN} from '../../../../node_modules/vega-lite/build/src/channel';
import {FieldPicker} from './actionable-common-ui/field-picker';
import {selectRootSVG, onPreviewReset, COMMON_DURATION, CHART_SIZE, CHART_MARGIN, pointsAsDensityPlot, pointsAsMeanScatterplot, NOMINAL_COLOR_SCHEME, reducePointSize, reducePointOpacity, removeFillColor, resizeRootSVG, COMMON_DELAY, renderTransitionTimeline, removeTransitionTimeline, TransitionAttr, COMMON_SHORT_DELAY} from '../../../models/d3-chart';

export interface ActionableOverplottingProps extends ActionHandler<GuidelineAction | LogAction | SpecAction> {
  item: GuidelineItemOverPlotting;
  schema: Schema;

  //preveiw
  data: InlineData;
  mainSpec: FacetedCompositeUnitSpec;
  theme: Themes;
}

export interface ActionableOverplottingState {
  triggeredAction: Actionables;
}

export interface ActionPaneData {
  isPaneUsing: boolean;
  actionItem: GuideActionItem;
  // functions
  renderPreview: () => void;
  onTransition: () => void;
  onAction: () => void;
}

export class ActionableOverplottingBase extends React.PureComponent<ActionableOverplottingProps, ActionableOverplottingState>{

  private plotLogger: Logger;
  private vegaLiteWrapper: HTMLElement;
  private prevAttr: Object = new Object();

  constructor(props: ActionableOverplottingProps) {
    super(props);
    this.state = ({
      triggeredAction: 'NONE'
    });
    this.plotLogger = new Logger(props.handleAction);
  }

  public render() {
    // const vegaReady = typeof this.props.mainSpec != 'undefined';
    const {triggeredAction} = this.state;
    const paneData = this.getPaneData();
    const actionPanes = paneData.map(this.previewPane, this);

    return (
      <div styleName='ac-root'>
        <div styleName={triggeredAction == 'NONE' ? 'guide-previews' : 'guide-previews-hidden'}>
          {actionPanes}
        </div>
        <div className='fa-gray' styleName='ignore-button'>
          <a onClick={this.onIgnore.bind(this)}>
            <i className='fa fa-eye-slash' aria-hidden='true' />
            {/* TODO: d3-chart not working with this feature */}
            {' '} Ignore This Guideline...
            </a>
        </div>
        <div styleName={triggeredAction == 'NONE' ? 'back-button-hidden' : 'back-button'}
          onClick={this.onBackButton.bind(this)}>
          <i className='fa fa-chevron-circle-left' aria-hidden='true' />
          {' '} Back
        </div>
        {/* Detail Actions */}
        <div styleName={triggeredAction == 'AGGREGATE_POINTS' ? '' : 'hidden'}>
          <FieldPicker
            id={this.props.item.id + 'AGGREGATE_POINTS'}
            title='Aggregate Points'
            subtitle='Select one of nominal fields to aggregate points'
            fields={this.getNominalFieldNames()}
            schema={this.props.schema}
            defaultField={this.getDefaultSmallSizedNominalFieldName()}
            pickedFieldAction={this.aggregateByFieldAction}
          />
        </div>
        <div styleName={triggeredAction == 'SEPARATE_GRAPH' ? '' : 'hidden'}>
          <FieldPicker
            id={this.props.item.id + 'SEPARATE_GRAPH'}
            title='Separate Graph'
            subtitle='Select one of nominal fields to separate graph'
            fields={this.getNominalFieldNames()}
            schema={this.props.schema}
            defaultField={this.getDefaultSmallSizedNominalFieldName()}
            pickedFieldAction={this.separateByFieldAction}
          />
        </div>
      </div>
    );
  }
  private previewPane(data: ActionPaneData) {
    if (!data.isPaneUsing) return null;
    return (
      <div styleName='guide-preview' key={data.actionItem.title}>
        <div styleName='transition-progress-bg'>
          <div styleName='transition-progress'></div>
          {/* <p styleName='left-buttons'>
            <i className='fa fa-play' styleName='top-button' aria-hidden='true'
              onClick={data.onTransition.bind(this)} />
            <i className="fa fa-thumb-tack" styleName='top-button' aria-hidden="true"
            // onClick={this.onAggregateTransitionShow.bind(this)}
            />
          </p> */}
          <p styleName='right-buttons'>
            <i className='fa fa-play' styleName='top-button-right' aria-hidden='true'
              onClick={data.onTransition.bind(this)} />
            <i className="fa fa-check" styleName='top-button-right' aria-hidden="true"
              onClick={data.onAction.bind(this)} />
          </p>
        </div>
        <div styleName='guide-preview-inner' className='preview-large' ref={this.vegaLiteWrapperRefHandler}>
          <p styleName='preview-title'>
            <i className={data.actionItem.faIcon} aria-hidden='true' />
            {' ' + data.actionItem.title}
          </p>
          {/* <p styleName='preview-score'>72% experts</p> */}
          {data.renderPreview.bind(this)()}
          <ul styleName='preview-desc' className='fa-ul'>
            <li><i className='fa-li fa fa-thumbs-o-up' styleName='pros' aria-hidden='true' />{data.actionItem.pros}</li>
            <li><i className='fa-li fa fa-thumbs-o-down' styleName='cons' aria-hidden='true' />{data.actionItem.cons}</li>
          </ul>
        </div>
      </div>
    );
  }

  private isChangePointSizeUsing() {
    // TODO:
    return true;
  }
  private isChangeOpacityUsing() {
    // TODO:
    return true;
  }
  private isRemoveFillColorUsing() {
    const {mainSpec} = this.props;
    const {encoding, mark} = mainSpec;
    try {
      if (mark == CIRCLE || mark == SQUARE) {
        return true;
      }
      else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }
  private isChangeShapeUsing() {
    // TODO:
    return false;
  }
  private isAggregateUsing() {
    return this.isThereNominalField();
  }
  private isEncodingDensityUsing() {
    // TODO:
    return true;
  }
  private isSeparateGraphUsing() {
    return this.isThereSmallSizedNominalField();
  }

  private onFilterTransition() {

  }
  private onFilterClick() {

  }
  private onChangePointSizeClick() {

  }
  private onChangeOpacityClick() {

  }
  private onRemoveFillColorClick() {

  }
  private onAggregatePointsClick() {
    this.aggregateByFieldAction(this.getDefaultSmallSizedNominalFieldName());
    this.setState({triggeredAction: 'AGGREGATE_POINTS'});
  }
  private onSeparateGraphClick() {
    this.separateByFieldAction(this.getDefaultSmallSizedNominalFieldName());
    this.setState({triggeredAction: 'SEPARATE_GRAPH'});
  }

  separateByFieldAction = (picked: string) => {
    this.props.handleAction({
      type: SPEC_FIELD_ADD,
      payload: {
        shelfId: {channel: COLUMN},
        fieldDef: {
          field: picked,
          type: NOMINAL
        },
        replace: true
      }
    });
  }
  aggregateByFieldAction = (picked: string) => {
    this.props.handleAction({
      type: SPEC_AGGREGATE_POINTS_BY_COLOR,
      payload: {
        shelfId: {channel: COLOR},
        fieldDef: {
          field: picked,
          type: NOMINAL
        },
        replace: true
      }
    });
  }

  private onEncodingDensityClick() {
    this.props.handleAction({
      type: SPEC_TO_DENSITY_PLOT
    })
  }
  private onRemoveFillColorTransition() {
    onPreviewReset(this.props.mainSpec, this.props.data.values);
    removeFillColor(COMMON_DURATION);
    this.onRemoveFillColorMouseLeave();
  }
  private onChangeOpacityTransition() {
    onPreviewReset(this.props.mainSpec, this.props.data.values);
    reducePointOpacity(0.3, COMMON_DURATION);
    this.onChangeOpacityMouseLeave();
  }
  private onChangePointSizeTransition() {
    onPreviewReset(this.props.mainSpec, this.props.data.values);
    renderTransitionTimeline('Animated Transition for Change Point', this.AggregateStages, true);
    reducePointSize(COMMON_DURATION);
    this.onChangePointSizeMouseLeave();
  }
  private onChangePointSizeTransitionMouseEnter() {
    renderTransitionTimeline('Animated Transition for Change Point', this.AggregateStages, true);
  }
  private onChangePointSizeTransitionMouseLeave() {
    // removeTransitionTimeline();
  }

  private onAggregateTransitionShow() {
    renderTransitionTimeline('', this.AggregateStages, false);
  }
  private onAggregateTransition() {
    onPreviewReset(this.props.mainSpec, this.props.data.values);
    renderTransitionTimeline('', this.AggregateStages, true);
    pointsAsMeanScatterplot(this.props.mainSpec, this.props.data.values, this.props.schema, this.getDefaultSmallSizedNominalFieldName(), this.AggregateStages, COMMON_DURATION);
    onPreviewReset(this.props.mainSpec, this.props.data.values, COMMON_DURATION, d3.sum(this.AggregateStages.map(x => x.duration)));
  }
  private onEncodingDensityTransition() {
    onPreviewReset(this.props.mainSpec, this.props.data.values);
    pointsAsDensityPlot(this.props.mainSpec, this.props.data.values, COMMON_DURATION);
    this.onEncodingDensityMouseLeave();
  }
  private onSeparateGraphTransition() {
    onPreviewReset(this.props.mainSpec, this.props.data.values);
    let svg = selectRootSVG();
    const {values} = this.props.data,
      xField = this.props.mainSpec.encoding.x['field'],
      yField = this.props.mainSpec.encoding.y['field'];

    let categoryField = this.getDefaultSmallSizedNominalFieldName();
    let numOfCategory = this.props.schema.domain({field: categoryField}).length;
    const width = 200;
    let widthPlusMargin = width + CHART_MARGIN.left + CHART_MARGIN.right;
    svg.transition().duration(COMMON_DURATION).attr('width', function (d) {
      return widthPlusMargin * numOfCategory;
    });
    for (let i = 0; i < numOfCategory; i++) {
      if (i == 0) continue;

      let x = d3.scaleLinear().domain([0, d3.max(values, function (d) {return d[xField]})]).nice().range([0, width]);
      let y = d3.scaleLinear().domain([0, d3.max(values, function (d) {return d[yField]})]).nice().range([CHART_SIZE.height, 0]);

      let xAxis = d3.axisBottom(x).ticks(Math.ceil(width / 40));
      let yAxis = d3.axisLeft(y).ticks(Math.ceil(CHART_SIZE.height / 40));
      let xGrid = d3.axisBottom(x).ticks(Math.ceil(width / 40)).tickFormat(null).tickSize(-width);
      let yGrid = d3.axisLeft(y).ticks(Math.ceil(CHART_SIZE.height / 40)).tickFormat(null).tickSize(-CHART_SIZE.height);

      svg.append('g')
        .classed('grid remove-when-reset', true)
        .attr('transform', 'translate(' + (CHART_MARGIN.left + widthPlusMargin * i) + ',' + (CHART_SIZE.height + CHART_MARGIN.top) + ')')
        .call(xGrid);

      svg.append('g')
        .classed('grid remove-when-reset', true)
        .attr('transform', 'translate(' + (CHART_MARGIN.left + widthPlusMargin * i) + ',' + CHART_MARGIN.top + ')')
        .call(yGrid);

      svg.append('g')
        .classed('axis remove-when-reset', true)
        .attr('transform', 'translate(' + (CHART_MARGIN.left + widthPlusMargin * i) + ',' + (CHART_SIZE.height + CHART_MARGIN.top) + ')')
        .attr('stroke', '#888888')
        .attr('stroke-width', 0.5)
        .call(xAxis)
        .append('text')
        .classed('label', true)
        .attr('x', width / 2)
        .attr('y', CHART_MARGIN.bottom - 10)
        .style('fill', 'black')
        .style('font-weight', 'bold')
        .style('font-family', 'sans-serif')
        .style('font-size', 11)
        .style('text-anchor', 'middle')
        .text(xField);

      svg.append('g')
        .classed('axis remove-when-reset', true)
        .attr('transform', 'translate(' + (CHART_MARGIN.left + widthPlusMargin * i) + ',' + CHART_MARGIN.top + ')')
        .attr('stroke', '#888888')
        .attr('stroke-width', 0.5)
        .call(yAxis)
        .append('text')
        .classed('label', true)
        .attr('transform', 'rotate(-90)')
        .attr('x', -width / 2)
        .attr('y', -50)
        .attr('dy', '.71em')
        .style('font-weight', 'bold')
        .style('font-family', 'sans-serif')
        .style('font-size', 11)
        .style('fill', 'black')
        .style('text-anchor', 'middle')
        .text(yField);

      let category = this.props.schema.domain({field: categoryField})[i];
      svg.selectAll('.point')
        .filter(function (d) {return d[categoryField] == category;})
        .transition().duration(COMMON_DURATION)
        .attr('x', function (d) {
          return parseFloat(d3.select(this).attr('x')) + widthPlusMargin * i;
        });
    }
    svg.selectAll('.point').raise();
    svg.selectAll('.remove-when-reset').attr('opacity', 0).transition().duration(COMMON_DURATION).attr('opacity', 1);
    this.onSeparateGraphMouseLeave();
  }

  // TODO: do we have to consider exact reversing animation?
  private onChangePointSizeMouseLeave() {
    onPreviewReset(this.props.mainSpec, this.props.data.values, COMMON_DURATION, COMMON_DELAY);
  }
  private onChangeOpacityMouseLeave() {
    onPreviewReset(this.props.mainSpec, this.props.data.values, COMMON_DURATION, COMMON_DELAY);
  }
  private onRemoveFillColorMouseLeave() {
    onPreviewReset(this.props.mainSpec, this.props.data.values, COMMON_DURATION, COMMON_DELAY);
  }
  private onEncodingDensityMouseLeave() {
    onPreviewReset(this.props.mainSpec, this.props.data.values, COMMON_DURATION, COMMON_DELAY * 2);
  }
  private onSeparateGraphMouseLeave() {
    resizeRootSVG(1, false, COMMON_DURATION, COMMON_DELAY);
    onPreviewReset(this.props.mainSpec, this.props.data.values, COMMON_DURATION, COMMON_DELAY);
  }

  private renderFilterPreview() {
    // TODO: how to set default filter?
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;
    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} isPreview={true} />
    );
  }
  private renderChangePointSizePreview() {
    // TODO: handle a case where size is already used
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;
    previewSpec.encoding = {
      ...previewSpec.encoding,
      size: {value: 10}
    }
    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} isPreview={true} />
    );
  }
  private renderChangeOpacityPreview() {
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;

    previewSpec.encoding = {
      ...previewSpec.encoding,
      opacity: {value: 0.3}
    }
    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} isPreview={true} />
    );
  }
  private renderRemoveFillColorPreview() {
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;
    previewSpec.mark = {
      type: previewSpec.mark as Mark,
      filled: false
    };
    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} isPreview={true} />
    );
  }
  private renderChangeShapePreview() {
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;

    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} isPreview={true} />
    );
  }
  private renderAggregatePreview() {
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;

    previewSpec.encoding.x = {
      ...previewSpec.encoding.x,
      aggregate: 'mean'
    };

    previewSpec.encoding.y = {
      ...previewSpec.encoding.y,
      aggregate: 'mean'
    };

    let field = this.getDefaultSmallSizedNominalFieldName();
    previewSpec.encoding.color = {
      field,
      type: NOMINAL
    };

    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} isPreview={true} />
    );
  }
  private renderEncodingDensityPreview() {
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;

    //TODO: What should we do when color have a field?
    previewSpec.encoding.color = {
      aggregate: 'count',
      field: '*',
      type: QUANTITATIVE,
      scale: {scheme: 'greenblue'}
    };

    previewSpec.encoding.x = {
      ...previewSpec.encoding.x,
      bin: {maxbins: 60}
    };

    previewSpec.encoding.y = {
      ...previewSpec.encoding.y,
      bin: {maxbins: 60}
    };

    previewSpec.mark = RECT;

    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} isPreview={true} />
    );
  }
  private renderSeparateGraphPreview() {
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;

    // Select nominal field by default
    let field = this.getDefaultSmallSizedNominalFieldName();

    // If a nominal field used, use it for separation
    // try {
    //   if (previewSpec.encoding.color['type'] == NOMINAL)
    //     field = previewSpec.encoding.color['field'];
    //   else if(previewSpec.encoding.shape['type'] == NOMINAL)
    //     field = previewSpec.encoding.shape['field'];
    // } catch (e) {}

    previewSpec.encoding = {
      ...previewSpec.encoding,
      column: {
        field,
        type: NOMINAL
      }
    }
    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} isPreview={true} />
    );
  }

  //TODO: should move to guideline model
  private getDefaultLargeSizedNominalFieldName() {
    let maxSize = 0, field = '';
    const {schema} = this.props;
    for (let f of schema.fieldSchemas) {
      if (f.vlType == NOMINAL && schema.domain({field: f.name}).length > maxSize) {
        field = f.name;
        maxSize = schema.domain({field: f.name}).length;
      }
    }
    return field;
  }
  private getDefaultSmallSizedNominalFieldName() {
    let minSize = 100, field = '';
    const {schema} = this.props;
    for (let f of schema.fieldSchemas) {
      if (f.vlType == NOMINAL && schema.domain({field: f.name}).length < minSize) {
        field = f.name;
        minSize = schema.domain({field: f.name}).length;
      }
    }
    return field;
  }

  private getNominalFieldNames() {
    let nFields: string[] = [];
    for (let f of this.props.schema.fieldSchemas) {
      if (f.vlType == NOMINAL)
        nFields.push(f.name);
    }
    return nFields;
  }

  private isThereSmallSizedNominalField() {
    const {schema} = this.props;
    for (let f of schema.fieldSchemas) {
      if (f.vlType == NOMINAL && schema.domain({field: f.name}).length < 10)
        return true;
    }
    return false;
  }
  private isThereNominalField() {
    const {schema} = this.props;
    for (let f of schema.fieldSchemas) {
      if (f.vlType == NOMINAL)
        return true;
    }
    return false;
  }

  private onIgnore() {
    const {item} = this.props;
    this.props.handleAction({
      type: GUIDELINE_TOGGLE_IGNORE_ITEM,
      payload: {item}
    });
  }

  private onBackButton() {
    this.setState({triggeredAction: 'NONE'});
  }

  private vegaLiteWrapperRefHandler = (ref: any) => {
    this.vegaLiteWrapper = ref;
  }

  private getPaneData() {
    const PANE_FILTER_GENERAL: ActionPaneData = {
      isPaneUsing: true,
      actionItem: ACTIONABLE_FILTER_GENERAL,
      renderPreview: this.renderFilterPreview,
      onTransition: this.onFilterTransition,
      onAction: this.onFilterClick
    }
    const PANE_POINT_SIZE: ActionPaneData = {
      isPaneUsing: this.isChangePointSizeUsing(),
      actionItem: ACTIONABLE_POINT_SIZE,
      renderPreview: this.renderChangePointSizePreview,
      onTransition: this.onChangePointSizeTransition,
      onAction: this.onChangePointSizeClick
    }
    const PANE_POINT_OPACITY: ActionPaneData = {
      isPaneUsing: this.isChangeOpacityUsing(),
      actionItem: ACTIONABLE_POINT_OPACITY,
      renderPreview: this.renderChangeOpacityPreview,
      onTransition: this.onChangeOpacityTransition,
      onAction: this.onChangeOpacityClick
    };
    const PANE_REMOVE_FILL_COLOR: ActionPaneData = {
      isPaneUsing: this.isRemoveFillColorUsing(),
      actionItem: ACTIONABLE_REMOVE_FILL_COLOR,
      renderPreview: this.renderRemoveFillColorPreview,
      onTransition: this.onRemoveFillColorTransition,
      onAction: this.onRemoveFillColorClick
    }
    const PANE_AGGREGATE: ActionPaneData = {
      isPaneUsing: this.isAggregateUsing(),
      actionItem: ACTIONABLE_AGGREGATE,
      renderPreview: this.renderAggregatePreview,
      onTransition: this.onAggregateTransition,
      onAction: this.onAggregatePointsClick
    }
    const PANE_ENCODING_DENSITY: ActionPaneData = {
      isPaneUsing: this.isEncodingDensityUsing(),
      actionItem: ACTIONABLE_ENCODING_DENSITY,
      renderPreview: this.renderEncodingDensityPreview,
      onTransition: this.onEncodingDensityTransition,
      onAction: this.onEncodingDensityClick
    }
    const PANE_SEPARATE_GRAPH: ActionPaneData = {
      isPaneUsing: this.isSeparateGraphUsing(),
      actionItem: ACTIONABLE_SEPARATE_GRAPH,
      renderPreview: this.renderSeparateGraphPreview,
      onTransition: this.onSeparateGraphTransition,
      onAction: this.onSeparateGraphClick
    }
    const paneData: ActionPaneData[] = [
      PANE_FILTER_GENERAL,
      PANE_POINT_SIZE,
      PANE_POINT_OPACITY,
      PANE_REMOVE_FILL_COLOR,
      PANE_AGGREGATE,
      PANE_ENCODING_DENSITY,
      PANE_SEPARATE_GRAPH
    ];
    return paneData;
  }
  public AggregateStages: TransitionAttr[] = [
    {id: 'COLOR', title: 'Color by \'' + this.getDefaultSmallSizedNominalFieldName() + '\' field', duration: COMMON_DURATION},
    {id: 'REPOSITION', title: 'Aggregate to mean position', duration: COMMON_DURATION}
  ];
}

export const ActionableOverplotting = (CSSModules(ActionableOverplottingBase, styles));