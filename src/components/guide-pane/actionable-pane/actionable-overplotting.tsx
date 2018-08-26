import * as React from 'react';
import * as CSSModules from 'react-css-modules';
import * as styles from './actionable-overplotting.scss';

import * as d3 from 'd3';
import {ActionableID, ACTIONABLE_FILTER_GENERAL, ACTIONABLE_POINT_SIZE, ACTIONABLE_POINT_OPACITY, ACTIONABLE_REMOVE_FILL_COLOR, ACTIONABLE_AGGREGATE, ACTIONABLE_ENCODING_DENSITY, ACTIONABLE_SEPARATE_GRAPH, GuidelineItemOverPlotting, GuideActionItem, isRowOrColumnUsed, isColorUsed, getRowAndColumnField, DEFAULT_CHANGE_POINT_SIZE} from '../../../models/guidelines';
import {GuidelineAction, ActionHandler, GUIDELINE_TOGGLE_IGNORE_ITEM, LogAction, SPEC_FIELD_ADD, SpecAction, SPEC_TO_DENSITY_PLOT, SPEC_AGGREGATE_POINTS_BY_COLOR, SPEC_POINT_SIZE_SPECIFIED, ACTIONABLE_ADJUST_POINT_SIZE, ACTIONABLE_ADJUST_POINT_OPACITY} from '../../../actions';
import {Logger} from '../../util/util.logger';
import {Themes} from '../../../models/theme/theme';
import {FacetedCompositeUnitSpec} from '../../../../node_modules/vega-lite/build/src/spec';
import {InlineData} from '../../../../node_modules/vega-lite/build/src/data';
import {CIRCLE, SQUARE, Mark, RECT} from '../../../../node_modules/vega-lite/build/src/mark';
import {VegaLite} from '../../vega-lite';
import {QUANTITATIVE, NOMINAL} from '../../../../node_modules/vega-lite/build/src/type';
import {Schema, toTransforms} from '../../../models';
import {COLOR, COLUMN, SIZE} from '../../../../node_modules/vega-lite/build/src/channel';
import {FieldPicker} from './actionable-common-ui/field-picker';
import {selectRootSVG, onPreviewReset, COMMON_DURATION, CHART_SIZE, CHART_MARGIN, renderDensityPlot, pointsAsMeanScatterplot, reducePointSize, reducePointOpacity, removeFillColor, resizeRootSVG, COMMON_DELAY, appendTransitionTimeline, TransitionAttr, COMMON_SHORT_DELAY, filterPoint, separateGraph, startTimeline, DensityPlotStages, AggregateStages, renderPoints} from '../../../models/d3-chart';
import {OneOfFilter} from 'vega-lite/build/src/filter';
import {NumberAdjuster} from './actionable-common-ui/number-adjuster';

export interface ActionableOverplottingProps extends ActionHandler<GuidelineAction | LogAction | SpecAction> {
  item: GuidelineItemOverPlotting;
  schema: Schema;

  //preveiw
  data: InlineData;
  mainSpec: FacetedCompositeUnitSpec;
  theme: Themes;
}

export interface ActionableOverplottingState {
  triggeredAction: ActionableID;
  expandedAction: ActionableID;
}

export interface ActionPaneData {
  id: ActionableID;
  isPaneUsing: boolean;
  actionItem: GuideActionItem;
  renderPreview: () => void;
  onTransition: () => void;
  onAction: () => void;
}

export class ActionableOverplottingBase extends React.PureComponent<ActionableOverplottingProps, ActionableOverplottingState>{

  private plotLogger: Logger;

  constructor(props: ActionableOverplottingProps) {
    super(props);
    this.state = ({
      triggeredAction: 'NONE',
      expandedAction: 'NONE'
    });
    this.plotLogger = new Logger(props.handleAction);
  }

  public render() {
    const {triggeredAction} = this.state;
    const paneData = this.getPaneData();
    const actionPanes = paneData.map(this.previewPane, this);

    return (
      <div styleName='ac-root'>
        <div styleName={triggeredAction == 'NONE' ? 'guide-previews' : 'guide-previews-hidden'}>
          {actionPanes}
        </div>
        {/* <div className='fa-gray' styleName='ignore-button'>
          <a onClick={this.onIgnore.bind(this)}>
            <i className='fa fa-eye-slash' aria-hidden='true' />
            {' '} Ignore This Guideline...
            </a>
        </div> */}
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
        <div styleName={triggeredAction == 'CHANGE_POINT_SIZE' ? '' : 'hidden'}>
          <NumberAdjuster
            id={this.props.item.id + 'CHANGE_POINT_SIZE'}
            title='Change Point Size'
            subtitle='Adjust size of points'
            min={1}
            max={60}
            step={1}
            defaultNumber={DEFAULT_CHANGE_POINT_SIZE}
            adjustedNumberAction={this.changePointSizeAction}
          />
        </div>
        <div styleName={triggeredAction == 'CHANGE_POINT_OPACITY' ? '' : 'hidden'}>
          <NumberAdjuster
            id={this.props.item.id + 'CHANGE_POINT_OPACITY'}
            title='Change Point Opacity'
            subtitle='Adjust oapcity of points'
            min={0}
            max={1}
            step={0.01}
            defaultNumber={0.3}
            adjustedNumberAction={this.changePointOpacityAction}
          />
        </div>
      </div>
    );
  }
  private previewPane(data: ActionPaneData) {
    const vegaReady = typeof this.props.mainSpec != 'undefined';
    const {expandedAction} = this.state;
    if (!data.isPaneUsing) return null;
    if (!vegaReady) return null;
    return (
      <div styleName={expandedAction == data.id ? 'guide-preview-expand' : 'guide-preview'} key={data.actionItem.title}>
        <div styleName='transition-progress-bg'>
          <div styleName='transition-progress'></div>
          <div onClick={this.onExpand.bind(this, data.id)} styleName='expand-button'>
            <i className={expandedAction == data.id ? "fa fa-compress" : 'fa fa-expand'} aria-hidden="true" />
          </div>
          {/* TODO: Remove when design decided */}
          {/* <p styleName='left-buttons'>
            <i className='fa fa-play' styleName='top-button-right' aria-hidden='true'
              onClick={data.onTransition.bind(this)} />
            <i className="fa fa-expand" styleName='top-button' aria-hidden="true"
              onClick={this.onExpand.bind(this, data.id)}
            />
          </p>
          <p styleName='right-buttons'>
            <i className="fa fa-check" styleName='top-button-right' aria-hidden="true"
              onClick={data.onAction.bind(this)} />
          </p> */}
        </div>
        <div className={expandedAction == data.id ? 'preview-expand' : 'preview'}
          styleName={'guide-preview-inner'}
          ref={this.vegaLiteWrapperRefHandler}>
          <p styleName='preview-title'>
            {/* <i className={data.actionItem.faIcon} aria-hidden='true' /> */}
            {' '}
            {data.actionItem.title}
          </p>
          {/* <p styleName='preview-score'>72% experts</p> */}
          {data.renderPreview.bind(this)()}
          <ul styleName='preview-desc' className='fa-ul'>
            <li><i className='fa-li fa fa-thumbs-o-up' styleName='pros' aria-hidden='true' />{data.actionItem.pros}</li>
            <li><i className='fa-li fa fa-thumbs-o-down' styleName='cons' aria-hidden='true' />{data.actionItem.cons}</li>
          </ul>
        </div>
        <div styleName='bottom-button'>
          <div onClick={data.onTransition.bind(this)} styleName='transition-button' >
            <i className='fa fa-play' aria-hidden='true' />
          </div>
          <div onClick={data.onAction.bind(this)} styleName='apply-button'>
            <i className="fa fa-check" aria-hidden="true" />{' ' + 'Apply'}
          </div>
        </div>
      </div>
    );
  }

  private isChangePointSizeUsing() {
    return true;
  }
  private isChangeOpacityUsing() {
    return true;
  }
  private isRemoveFillColorUsing() {
    if (typeof this.props.mainSpec == 'undefined') return false;
    const {mainSpec} = this.props;
    const {mark} = mainSpec;
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
  private isAggregateUsing() {
    return this.isThereNominalField();
  }
  private isEncodingDensityUsing() {
    if (typeof this.props.mainSpec == 'undefined') return false;
    return !isColorUsed(this.props.mainSpec);
  }
  private isSeparateGraphUsing() {
    if (typeof this.props.mainSpec == 'undefined') return false;
    return !isRowOrColumnUsed(this.props.mainSpec) && this.isThereSmallSizedNominalField();
  }

  private onFilterClick() {

  }
  private onChangePointSizeClick() {
    this.changePointSizeAction(DEFAULT_CHANGE_POINT_SIZE);
    this.setState({triggeredAction: 'CHANGE_POINT_SIZE'});
  }
  private onChangeOpacityClick() {
    this.changePointOpacityAction(0.3);
    this.setState({triggeredAction: 'CHANGE_POINT_OPACITY'});
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

  changePointOpacityAction = (adjusted: number) => {
    this.props.handleAction({
      type: ACTIONABLE_ADJUST_POINT_OPACITY,
      payload: {
        item: this.props.item,
        pointOpacity: adjusted
      }
    });
  }
  changePointSizeAction = (adjusted: number) => {
    // this.props.handleAction({
    //   type: SPEC_POINT_SIZE_SPECIFIED,
    //   payload: adjusted
    // });
    this.props.handleAction({
      type: ACTIONABLE_ADJUST_POINT_SIZE,
      payload: {
        item: this.props.item,
        pointSize: adjusted
      }
    });
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
  private onFilterTransition() {
    let field = this.getDefaultSmallSizedNominalFieldName(getRowAndColumnField(this.props.mainSpec));
    let oneOf = this.getDefaultOneOf(field);
    let id: ActionableID = "FILTER";
    onPreviewReset(id, this.props.mainSpec, this.props.schema, this.props.data.values);
    startTimeline(id, this.FilterStages);
    filterPoint(id, field, oneOf, this.FilterStages);
  }
  private onChangeOpacityTransition() {
    let id: ActionableID = "CHANGE_POINT_OPACITY";
    onPreviewReset(id, this.props.mainSpec, this.props.schema, this.props.data.values);
    startTimeline(id, this.PointOpacityStages)
    reducePointOpacity(id, 0.1, this.PointOpacityStages);
  }
  private onChangePointSizeTransition() {
    let id: ActionableID = "CHANGE_POINT_SIZE";
    onPreviewReset(id, this.props.mainSpec, this.props.schema, this.props.data.values);
    startTimeline(id, this.PointResizeStages);
    reducePointSize(id, this.PointResizeStages);
  }
  private onRemoveFillColorTransition() {
    let id: ActionableID = "REMOVE_FILL_COLOR";
    onPreviewReset(id, this.props.mainSpec, this.props.schema, this.props.data.values);
    startTimeline(id, this.RemoveFillColorStages);
    removeFillColor(id, this.RemoveFillColorStages);
  }
  private onAggregateTransition() {
    let id: ActionableID = "AGGREGATE_POINTS";
    startTimeline(id, AggregateStages);
    renderPoints(id, this.props.mainSpec, this.getAggregateSpec().spec, this.props.data.values, this.props.schema, true);
  }
  private onEncodingDensityTransition() {
    let id: ActionableID = "ENCODING_DENSITY";
    startTimeline(id, DensityPlotStages);
    renderPoints(id, this.props.mainSpec, this.getDensityPlotSpec().spec, this.props.data.values, this.props.schema, true);
  }
  private onSeparateGraphTransition() {
    let id: ActionableID = "SEPARATE_GRAPH";
    onPreviewReset(id, this.props.mainSpec, this.props.schema, this.props.data.values);
    startTimeline(id, this.SeperateGraphStages);
    separateGraph(id, this.props.mainSpec, this.props.data.values, this.props.schema, this.getDefaultSmallSizedNominalFieldName(), this.SeperateGraphStages);
  }

  private getDefaultOneOf(field: string) {
    return [this.props.schema.domain({field})[0]];
  }
  //TODO: consider only column
  private renderFilterPreview() {
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;
    let field = this.getDefaultSmallSizedNominalFieldName(getRowAndColumnField(previewSpec));
    const {transform} = previewSpec;
    let newFilter: OneOfFilter = {
      field,
      oneOf: this.getDefaultOneOf(field)
    }
    const newTransform = (transform || []).concat(toTransforms([newFilter]));
    previewSpec.transform = newTransform;
    return (
      <VegaLite spec={previewSpec}
        logger={this.plotLogger}
        data={this.props.data}
        isPreview={true}
        fromSpec={this.props.mainSpec}
        actionId={"FILTER"}
        schema={this.props.schema}
        transitionAttrs={this.FilterStages} />
    );
  }
  private renderChangePointSizePreview() {
    // TODO: handle a case where size is already used
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;
    previewSpec.encoding = {
      ...previewSpec.encoding,
      size: {value: DEFAULT_CHANGE_POINT_SIZE}
    }
    return (
      <VegaLite spec={previewSpec}
        logger={this.plotLogger}
        data={this.props.data}
        isPreview={true}
        fromSpec={this.props.mainSpec}
        actionId={"CHANGE_POINT_SIZE"}
        schema={this.props.schema}
        transitionAttrs={this.PointResizeStages} />
    );
  }
  private renderChangeOpacityPreview() {
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;

    previewSpec.encoding = {
      ...previewSpec.encoding,
      opacity: {value: 0.3}
    }
    return (
      <VegaLite spec={previewSpec}
        logger={this.plotLogger}
        data={this.props.data}
        isPreview={true}
        fromSpec={this.props.mainSpec}
        actionId={"CHANGE_POINT_OPACITY"}
        schema={this.props.schema}
        transitionAttrs={this.PointOpacityStages} />
    );
  }
  private renderRemoveFillColorPreview() {
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;
    previewSpec.mark = {
      type: previewSpec.mark as Mark,
      filled: false
    };
    return (
      <VegaLite spec={previewSpec}
        logger={this.plotLogger}
        data={this.props.data}
        isPreview={true}
        fromSpec={this.props.mainSpec}
        actionId={"REMOVE_FILL_COLOR"}
        schema={this.props.schema}
        transitionAttrs={this.RemoveFillColorStages} />
    );
  }
  private getAggregateSpec(){
    let spec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;

    spec.encoding.x = {
      ...spec.encoding.x,
      aggregate: 'mean'
    };

    spec.encoding.y = {
      ...spec.encoding.y,
      aggregate: 'mean'
    };

    let field = this.getDefaultSmallSizedNominalFieldName();
    spec.encoding.color = {
      field,
      type: NOMINAL
    };

    return {spec};
  }
  private renderAggregatePreview() {
    return (
      <VegaLite spec={this.getAggregateSpec().spec}
        logger={this.plotLogger}
        data={this.props.data}
        isPreview={true}
        fromSpec={this.props.mainSpec}
        actionId={"AGGREGATE_POINTS"}
        schema={this.props.schema}
        transitionAttrs={AggregateStages} />
    );
  }
  private getDensityPlotSpec() {
    let spec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;

    spec.encoding.color = {
      aggregate: 'count',
      field: '*',
      type: QUANTITATIVE,
      scale: {scheme: 'blues'}
    };

    spec.encoding.x = {
      ...spec.encoding.x,
      bin: {maxbins: 50}
    };

    spec.encoding.y = {
      ...spec.encoding.y,
      bin: {maxbins: 50}
    };

    spec.mark = RECT;

    return {spec};
  }
  private renderEncodingDensityPreview() {
    return (
      <VegaLite spec={this.getDensityPlotSpec().spec}
        logger={this.plotLogger}
        data={this.props.data}
        isPreview={true}
        fromSpec={this.props.mainSpec}
        actionId={"ENCODING_DENSITY"}
        schema={this.props.schema}
        transitionAttrs={DensityPlotStages} />
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
      <VegaLite spec={previewSpec}
        logger={this.plotLogger}
        data={this.props.data}
        isPreview={true}
        fromSpec={this.props.mainSpec}
        actionId={"SEPARATE_GRAPH"}
        schema={this.props.schema}
        transitionAttrs={this.SeperateGraphStages} />
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
  private getDefaultSmallSizedNominalFieldName(exceptField?: string[]) {
    // console.log(exceptField);
    if (typeof exceptField == 'undefined') exceptField = [];
    let minSize = 100, field = '';
    const {schema} = this.props;
    for (let f of schema.fieldSchemas) {
      if (f.vlType == NOMINAL && schema.domain({field: f.name}).length < minSize && exceptField.indexOf(f.name) == -1) {
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

  private isThereSmallSizedNominalField(exceptField?: string[]) {
    if (typeof exceptField == 'undefined') exceptField = [];
    const {schema} = this.props;
    for (let f of schema.fieldSchemas) {
      if (f.vlType == NOMINAL && schema.domain({field: f.name}).length < 10 && exceptField.indexOf(f.name) == -1)
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
  }

  private onExpand(expandedAction: ActionableID) {
    expandedAction = expandedAction == this.state.expandedAction ? "NONE" : expandedAction;
    this.setState({expandedAction});
  }

  private getPaneData() {
    const PANE_FILTER_GENERAL: ActionPaneData = {
      id: 'FILTER',
      isPaneUsing: true,
      actionItem: ACTIONABLE_FILTER_GENERAL,
      renderPreview: this.renderFilterPreview,
      onTransition: this.onFilterTransition,
      onAction: this.onFilterClick
    }
    const PANE_POINT_SIZE: ActionPaneData = {
      id: 'CHANGE_POINT_SIZE',
      isPaneUsing: this.isChangePointSizeUsing(),
      actionItem: ACTIONABLE_POINT_SIZE,
      renderPreview: this.renderChangePointSizePreview,
      onTransition: this.onChangePointSizeTransition,
      onAction: this.onChangePointSizeClick
    }
    const PANE_POINT_OPACITY: ActionPaneData = {
      id: 'CHANGE_POINT_OPACITY',
      isPaneUsing: this.isChangeOpacityUsing(),
      actionItem: ACTIONABLE_POINT_OPACITY,
      renderPreview: this.renderChangeOpacityPreview,
      onTransition: this.onChangeOpacityTransition,
      onAction: this.onChangeOpacityClick
    };
    const PANE_REMOVE_FILL_COLOR: ActionPaneData = {
      id: 'REMOVE_FILL_COLOR',
      isPaneUsing: this.isRemoveFillColorUsing(),
      actionItem: ACTIONABLE_REMOVE_FILL_COLOR,
      renderPreview: this.renderRemoveFillColorPreview,
      onTransition: this.onRemoveFillColorTransition,
      onAction: this.onRemoveFillColorClick
    }
    const PANE_AGGREGATE: ActionPaneData = {
      id: 'AGGREGATE_POINTS',
      isPaneUsing: this.isAggregateUsing(),
      actionItem: ACTIONABLE_AGGREGATE,
      renderPreview: this.renderAggregatePreview,
      onTransition: this.onAggregateTransition,
      onAction: this.onAggregatePointsClick
    }
    const PANE_ENCODING_DENSITY: ActionPaneData = {
      id: 'ENCODING_DENSITY',
      isPaneUsing: this.isEncodingDensityUsing(),
      actionItem: ACTIONABLE_ENCODING_DENSITY,
      renderPreview: this.renderEncodingDensityPreview,
      onTransition: this.onEncodingDensityTransition,
      onAction: this.onEncodingDensityClick
    }
    const PANE_SEPARATE_GRAPH: ActionPaneData = {
      id: 'SEPARATE_GRAPH',
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

  public FilterStages: TransitionAttr[] = [
    {id: 'COLOR', title: 'Filter By Another Field', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
  ];
  public PointOpacityStages: TransitionAttr[] = [
    {id: 'COLOR', title: 'Reduce Point Opacity', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
  ]
  public PointResizeStages: TransitionAttr[] = [
    {id: 'MORPH', title: 'Reduce Point Size', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
  ]
  public RemoveFillColorStages: TransitionAttr[] = [
    {id: 'COLOR', title: 'Remove Fill Color', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
  ];
  public SeperateGraphStages: TransitionAttr[] = [
    {id: 'REPOSITION', title: 'Separate Graph by \'' + this.getDefaultLargeSizedNominalFieldName() + '\' field', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
  ];
}

export const ActionableOverplotting = (CSSModules(ActionableOverplottingBase, styles));