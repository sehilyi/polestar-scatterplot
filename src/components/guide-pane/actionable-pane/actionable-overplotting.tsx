import * as React from 'react';
import * as CSSModules from 'react-css-modules';
import * as styles from './actionable-overplotting.scss';

import * as d3 from 'd3';
import {Actionables, ACTIONABLE_FILTER_GENERAL, ACTIONABLE_POINT_SIZE, ACTIONABLE_POINT_OPACITY, ACTIONABLE_REMOVE_FILL_COLOR, ACTIONABLE_AGGREGATE, ACTIONABLE_ENCODING_DENSITY, ACTIONABLE_SEPARATE_GRAPH, GuidelineItemOverPlotting, GuideActionItem, isRowOrColumnUsed, isColorUsed} from '../../../models/guidelines';
import {GuidelineAction, ActionHandler, GUIDELINE_TOGGLE_IGNORE_ITEM, LogAction, SPEC_FIELD_ADD, SpecAction, SPEC_TO_DENSITY_PLOT, SPEC_AGGREGATE_POINTS_BY_COLOR} from '../../../actions';
import {Logger} from '../../util/util.logger';
import {Themes} from '../../../models/theme/theme';
import {FacetedCompositeUnitSpec} from '../../../../node_modules/vega-lite/build/src/spec';
import {InlineData} from '../../../../node_modules/vega-lite/build/src/data';
import {CIRCLE, SQUARE, Mark, RECT} from '../../../../node_modules/vega-lite/build/src/mark';
import {VegaLite} from '../../vega-lite';
import {QUANTITATIVE, NOMINAL} from '../../../../node_modules/vega-lite/build/src/type';
import {Schema, toTransforms} from '../../../models';
import {COLOR, COLUMN} from '../../../../node_modules/vega-lite/build/src/channel';
import {FieldPicker} from './actionable-common-ui/field-picker';
import {selectRootSVG, onPreviewReset, COMMON_DURATION, CHART_SIZE, CHART_MARGIN, pointsAsDensityPlot, pointsAsMeanScatterplot, reducePointSize, reducePointOpacity, removeFillColor, resizeRootSVG, COMMON_DELAY, renderTransitionTimeline, TransitionAttr, COMMON_SHORT_DELAY, filterPoint, separateGraph} from '../../../models/d3-chart';
import {OneOfFilter} from 'vega-lite/build/src/filter';

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

  constructor(props: ActionableOverplottingProps) {
    super(props);
    this.state = ({
      triggeredAction: 'NONE'
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
    const vegaReady = typeof this.props.mainSpec != 'undefined';
    if (!data.isPaneUsing) return null;
    if (!vegaReady) return null;
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
  private onFilterTransition() {
    let field = this.getDefaultSmallSizedNominalFieldName();
    let oneOf = this.getDefaultOneOf(field);
    onPreviewReset(this.props.mainSpec, this.props.data.values);
    renderTransitionTimeline('', this.FilterStages, true);
    filterPoint(field, oneOf, this.FilterStages);
    onPreviewReset(this.props.mainSpec, this.props.data.values, COMMON_DURATION, d3.sum(this.FilterStages.map(x => x.duration + x.delay)));
  }
  private onChangeOpacityTransition() {
    onPreviewReset(this.props.mainSpec, this.props.data.values);
    renderTransitionTimeline('', this.PointOpacityStages, true);
    reducePointOpacity(0.3, this.PointOpacityStages);
    onPreviewReset(this.props.mainSpec, this.props.data.values, COMMON_DURATION, d3.sum(this.PointOpacityStages.map(x => x.duration + x.delay)));
  }
  private onChangePointSizeTransition() {
    onPreviewReset(this.props.mainSpec, this.props.data.values);
    renderTransitionTimeline('', this.PointResizeStages, true);
    reducePointSize(this.PointResizeStages);
    onPreviewReset(this.props.mainSpec, this.props.data.values, COMMON_DURATION, d3.sum(this.PointResizeStages.map(x => x.duration + x.delay)));
  }
  private onRemoveFillColorTransition() {
    onPreviewReset(this.props.mainSpec, this.props.data.values);
    renderTransitionTimeline('', this.RemoveFillColorStages, true);
    removeFillColor(this.RemoveFillColorStages);
    onPreviewReset(this.props.mainSpec, this.props.data.values, COMMON_DURATION, d3.sum(this.RemoveFillColorStages.map(x => x.duration + x.delay)));
  }
  private onAggregateTransition() {
    onPreviewReset(this.props.mainSpec, this.props.data.values);
    renderTransitionTimeline('', this.AggregateStages, true);
    pointsAsMeanScatterplot(this.props.mainSpec, this.props.data.values, this.props.schema, this.getDefaultSmallSizedNominalFieldName(), this.AggregateStages);
    onPreviewReset(this.props.mainSpec, this.props.data.values, COMMON_DURATION, d3.sum(this.AggregateStages.map(x => x.duration + x.delay)));
  }
  private onEncodingDensityTransition() {
    onPreviewReset(this.props.mainSpec, this.props.data.values);
    renderTransitionTimeline('', this.DensityPlotStages, true);
    pointsAsDensityPlot(this.props.mainSpec, this.props.data.values, this.DensityPlotStages);
    onPreviewReset(this.props.mainSpec, this.props.data.values, COMMON_DURATION, d3.sum(this.DensityPlotStages.map(x => x.duration + x.delay)));
  }
  private onSeparateGraphTransition() {
    onPreviewReset(this.props.mainSpec, this.props.data.values);
    renderTransitionTimeline('', this.SeperateGraphStages, true);
    separateGraph(this.props.mainSpec, this.props.data.values, this.props.schema, this.getDefaultSmallSizedNominalFieldName(), this.SeperateGraphStages);
    onPreviewReset(this.props.mainSpec, this.props.data.values, COMMON_DURATION, d3.sum(this.SeperateGraphStages.map(x => x.duration + x.delay)));
  }

  private getDefaultOneOf(field: string) {
    return [this.props.schema.domain({field})[0]];
  }
  //TODO: consider only column
  private renderFilterPreview() {
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;
    let field = this.getDefaultSmallSizedNominalFieldName();
    const {transform} = previewSpec;
    let newFilter: OneOfFilter = {
      field,
      oneOf: this.getDefaultOneOf(field)
    }
    const newTransform = (transform || []).concat(toTransforms([newFilter]));
    previewSpec.transform = newTransform;
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
      scale: {scheme: 'blues'}  //greenblue
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

  private isThereSmallSizedNominalField(exceptField?: string) {
    if (typeof exceptField == 'undefined') exceptField = '';
    const {schema} = this.props;
    for (let f of schema.fieldSchemas) {
      if (f.vlType == NOMINAL && schema.domain({field: f.name}).length < 10 && f.name != exceptField)
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

  public FilterStages: TransitionAttr[] = [
    {id: 'COLOR', title: 'Hide points by \'' + this.getDefaultLargeSizedNominalFieldName() + '\' field', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
  ];
  public PointOpacityStages: TransitionAttr[] = [
    {id: 'COLOR', title: 'Reduce point opacity', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
  ]
  public PointResizeStages: TransitionAttr[] = [
    {id: 'MORPH', title: 'Reduce point size', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
  ]
  public RemoveFillColorStages: TransitionAttr[] = [
    {id: 'COLOR', title: 'Remove fill color', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
  ];
  public AggregateStages: TransitionAttr[] = [
    {id: 'COLOR', title: 'Color by \'' + this.getDefaultSmallSizedNominalFieldName() + '\' field', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY},
    {id: 'REPOSITION', title: 'Aggregate to mean position', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
  ];
  public DensityPlotStages: TransitionAttr[] = [
    {id: 'MORPH', title: 'Rectangular Shape', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY},
    {id: 'COLOR', title: 'Reduce Opacity', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY},
    {id: 'REPOSITION', title: 'Move to binned position', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
  ];
  public SeperateGraphStages: TransitionAttr[] = [
    {id: 'REPOSITION', title: 'Separate Graph by \'' + this.getDefaultLargeSizedNominalFieldName() + '\' field', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
  ];
}

export const ActionableOverplotting = (CSSModules(ActionableOverplottingBase, styles));