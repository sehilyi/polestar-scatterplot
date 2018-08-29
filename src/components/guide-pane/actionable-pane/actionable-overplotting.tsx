import * as React from 'react';
import * as CSSModules from 'react-css-modules';
import * as styles from './actionable-overplotting.scss';

import {ActionableID, ACTIONABLE_FILTER_GENERAL, ACTIONABLE_POINT_SIZE, ACTIONABLE_POINT_OPACITY, ACTIONABLE_REMOVE_FILL_COLOR, ACTIONABLE_AGGREGATE, ACTIONABLE_ENCODING_DENSITY, ACTIONABLE_SEPARATE_GRAPH, GuidelineItemOverPlotting, GuideActionItem, isRowOrColumnUsed, isColorUsed, getRowAndColumnField, DEFAULT_CHANGE_POINT_SIZE, FilterStages, PointOpacityStages, PointResizeStages, AggregateStages, DensityPlotStages, SeperateGraphStages, RemoveFillColorStages, isDensityPlot, isRowUsed, isSkipColorOfAggregatePoints, getColorField} from '../../../models/guidelines';
import {GuidelineAction, ActionHandler, GUIDELINE_TOGGLE_IGNORE_ITEM, LogAction, SPEC_FIELD_ADD, SpecAction, SPEC_TO_DENSITY_PLOT, SPEC_AGGREGATE_POINTS_BY_COLOR, ACTIONABLE_ADJUST_POINT_SIZE, ACTIONABLE_ADJUST_POINT_OPACITY, SPEC_MARK_CHANGE_TYPE, ACTIONABLE_CHANGE_FILLED, FilterAction} from '../../../actions';
import {Logger} from '../../util/util.logger';
import {Themes} from '../../../models/theme/theme';
import {FacetedCompositeUnitSpec} from '../../../../node_modules/vega-lite/build/src/spec';
import {InlineData} from '../../../../node_modules/vega-lite/build/src/data';
import {CIRCLE, SQUARE, Mark, RECT} from '../../../../node_modules/vega-lite/build/src/mark';
import {VegaLite} from '../../vega-lite';
import {QUANTITATIVE, NOMINAL} from '../../../../node_modules/vega-lite/build/src/type';
import {Schema, toTransforms, ShelfFilter} from '../../../models';
import {COLOR, COLUMN} from '../../../../node_modules/vega-lite/build/src/channel';
import {FieldPicker} from './actionable-common-ui/field-picker';
import {startTimeline, renderPoints} from '../../../models/d3-chart';
import {OneOfFilter} from 'vega-lite/build/src/filter';
import {NumberAdjuster} from './actionable-common-ui/number-adjuster';
import {ToggleSwitcher} from './actionable-common-ui/toggle-switcher';
import {isNullOrUndefined} from '../../../util';
import {FilterAdjuster} from './actionable-common-ui/filter-adjuster';

export interface ActionableOverplottingProps extends ActionHandler<GuidelineAction | LogAction | SpecAction | FilterAction> {
  item: GuidelineItemOverPlotting;
  schema: Schema;
  filters: ShelfFilter[];
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
      <div styleName='ac-root' className='styled-scroll'>
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
        <div styleName={triggeredAction == 'FILTER' ? '' : 'hidden'}>
          <FilterAdjuster
            id={this.props.item.id + 'FILTER'}
            title={ACTIONABLE_FILTER_GENERAL.title}
            subtitle={ACTIONABLE_FILTER_GENERAL.subtitle}
            fields={this.getNominalFieldNames()}
            filters={this.props.filters}
            schema={this.props.schema}
            defaultField={this.getDefaultSmallSizedNominalFieldName()}
            defaultOneOf={this.getDefaultOneOf(this.getDefaultSmallSizedNominalFieldName())}
            handleAction={this.props.handleAction}
            filterAction={this.filterAction}
          />
        </div>
        <div styleName={triggeredAction == 'REMOVE_FILL_COLOR' ? '' : 'hidden'}>
          <ToggleSwitcher
            id={this.props.item.id + 'REMOVE_FILL_COLOR'}
            title={ACTIONABLE_REMOVE_FILL_COLOR.title}
            subtitle={ACTIONABLE_REMOVE_FILL_COLOR.subtitle}
            defaultIsOn={true}
            toggleAction={this.removeFillColorAction}
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
          <p styleName='preview-score'>{data.actionItem.subtitle}</p>
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
            {/* TRNASLATION: Apply */}
            <i className="fa fa-check" aria-hidden="true" />{' ' + '적용'}
          </div>
        </div>
      </div>
    );
  }

  private isFilterUsing() {
    if (typeof this.props.mainSpec == 'undefined') return false;
    if (this.getPossibleFilterField() == '') return false;
    return true;
  }
  private isChangePointSizeUsing() {
    if (typeof this.props.mainSpec == 'undefined') return false;
    if (isDensityPlot(this.props.mainSpec)) return false;
    return true;
  }
  private isChangeOpacityUsing() {
    if (typeof this.props.mainSpec == 'undefined') return false;
    if (isDensityPlot(this.props.mainSpec)) return false;
    return true;
  }
  private isRemoveFillColorUsing() {
    if (typeof this.props.mainSpec == 'undefined') return false;
    if (isDensityPlot(this.props.mainSpec)) return false;
    const {mainSpec} = this.props;
    const {mark} = mainSpec;
    try {
      if (mark == CIRCLE || mark == SQUARE || mark['type'] == CIRCLE || mark['type'] == SQUARE) {
        if (!isNullOrUndefined(mark['filled']) && !mark['filled']) return false;
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
    if (typeof this.props.mainSpec == 'undefined') return false;
    if (isDensityPlot(this.props.mainSpec)) return false;
    try {
      if (getColorField(this.props.mainSpec).colorField.type == 'QUANTITATIVE') return false;
    } catch (e) {}
    return this.isThereNominalField();
  }
  private isEncodingDensityUsing() {
    if (typeof this.props.mainSpec == 'undefined') return false;
    return !isColorUsed(this.props.mainSpec);
  }
  private isSeparateGraphUsing() {
    if (typeof this.props.mainSpec == 'undefined') return false;
    return !isRowUsed(this.props.mainSpec) && this.isThereSmallSizedNominalField();
  }

  private onFilterClick() {
    this.setState({triggeredAction: 'FILTER'});
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
    this.removeFillColorAction(false);
    this.setState({triggeredAction: 'REMOVE_FILL_COLOR'});
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
  removeFillColorAction = (filled: boolean) => {
    this.props.handleAction({
      type: ACTIONABLE_CHANGE_FILLED,
      payload: {
        item: this.props.item,
        filled
      }
    });
  }
  filterAction = (field: string, oneOf: any[]) => {
    // do nothing since filter automatically add/modify and change charts
  }

  private onEncodingDensityClick() {
    this.props.handleAction({
      type: SPEC_TO_DENSITY_PLOT
    })
  }

  private onFilterTransition() {
    let id: ActionableID = "FILTER";
    startTimeline(id, FilterStages);
    renderPoints(id, this.props.mainSpec, this.getFilterSpec().spec, this.props.data.values, this.props.schema, true, false);
  }
  private onChangeOpacityTransition() {
    let id: ActionableID = "CHANGE_POINT_OPACITY";
    startTimeline(id, PointOpacityStages);
    renderPoints(id, this.props.mainSpec, this.getChangeOpacitySpec().spec, this.props.data.values, this.props.schema, true, false);
  }
  private onChangePointSizeTransition() {
    let id: ActionableID = "CHANGE_POINT_SIZE";
    startTimeline(id, PointResizeStages);
    renderPoints(id, this.props.mainSpec, this.getResizePointSpec().spec, this.props.data.values, this.props.schema, true, false);
  }
  private onAggregateTransition() {
    let id: ActionableID = "AGGREGATE_POINTS";
    startTimeline(id, !isSkipColorOfAggregatePoints(id, this.props.mainSpec) ? AggregateStages : AggregateStages.slice().splice(0, 1));
    renderPoints(id, this.props.mainSpec, this.getAggregateSpec().spec, this.props.data.values, this.props.schema, true, false);
  }
  private onEncodingDensityTransition() {
    let id: ActionableID = "ENCODING_DENSITY";
    startTimeline(id, DensityPlotStages);
    renderPoints(id, this.props.mainSpec, this.getDensityPlotSpec().spec, this.props.data.values, this.props.schema, true, false);
  }
  private onSeparateGraphTransition() {
    let id: ActionableID = "SEPARATE_GRAPH";
    startTimeline(id, SeperateGraphStages);
    renderPoints(id, this.props.mainSpec, this.getSeparateGraphSpec().spec, this.props.data.values, this.props.schema, true, false);
  }
  private onRemoveFillColorTransition() {
    let id: ActionableID = "REMOVE_FILL_COLOR";
    startTimeline(id, RemoveFillColorStages);
    renderPoints(id, this.props.mainSpec, this.getRemoveFillColorSpec().spec, this.props.data.values, this.props.schema, true, false);
  }

  private getDefaultOneOf(field: string) {
    return [this.props.schema.domain({field})[0]];
  }
  //TODO: consider only column
  private getPossibleFilterField() {
    let spec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;
    const {transform} = spec;
    let exceptFields = getRowAndColumnField(spec);
    if (!isNullOrUndefined(transform)) {
      exceptFields = exceptFields.concat(transform.filter(t => !isNullOrUndefined(t['filter'])).map(t => t['filter'].field));
    }
    let field = this.getDefaultSmallSizedNominalFieldName(exceptFields);
    return field;
  }

  private getFilterSpec() {
    let spec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;
    const {transform} = spec;

    let field = this.getPossibleFilterField();
    let newFilter: OneOfFilter = {
      field,
      oneOf: this.getDefaultOneOf(field)
    }
    const newTransform = (transform || []).concat(toTransforms([newFilter]));
    spec.transform = newTransform;

    return {spec};
  }
  private renderFilterPreview() {
    return (
      <VegaLite spec={this.getFilterSpec().spec}
        logger={this.plotLogger}
        data={this.props.data}
        isPreview={true}
        fromSpec={this.props.mainSpec}
        actionId={"FILTER"}
        schema={this.props.schema}
        transitionAttrs={FilterStages} />
    );
  }
  private getResizePointSpec() {
    // TODO: handle a case where size is already used
    let spec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;

    spec.encoding = {
      ...spec.encoding,
      size: {value: DEFAULT_CHANGE_POINT_SIZE}
    }

    return {spec};
  }
  private renderChangePointSizePreview() {
    return (
      <VegaLite spec={this.getResizePointSpec().spec}
        logger={this.plotLogger}
        data={this.props.data}
        isPreview={true}
        fromSpec={this.props.mainSpec}
        actionId={"CHANGE_POINT_SIZE"}
        schema={this.props.schema}
        transitionAttrs={PointResizeStages} />
    );
  }
  private getChangeOpacitySpec() {
    let spec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;

    spec.encoding = {
      ...spec.encoding,
      opacity: {value: 0.3}
    }

    return {spec};
  }
  private renderChangeOpacityPreview() {
    return (
      <VegaLite spec={this.getChangeOpacitySpec().spec}
        logger={this.plotLogger}
        data={this.props.data}
        isPreview={true}
        fromSpec={this.props.mainSpec}
        actionId={"CHANGE_POINT_OPACITY"}
        schema={this.props.schema}
        transitionAttrs={PointOpacityStages} />
    );
  }
  private getRemoveFillColorSpec() {
    let spec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;

    spec.mark = {
      type: isNullOrUndefined(spec.mark['type']) ? spec.mark as Mark : spec.mark['type'],
      filled: false
    };
    // console.log(spec.mark);

    return {spec};
  }
  private renderRemoveFillColorPreview() {
    // console.log(this.getRemoveFillColorSpec().spec);
    return (
      <VegaLite spec={this.getRemoveFillColorSpec().spec}
        logger={this.plotLogger}
        data={this.props.data}
        isPreview={true}
        fromSpec={this.props.mainSpec}
        actionId={"REMOVE_FILL_COLOR"}
        schema={this.props.schema}
        transitionAttrs={RemoveFillColorStages} />
    );
  }
  private getAggregateSpec() {
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
  private getSeparateGraphSpec() {
    let spec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;

    // If a nominal field used, use it for separation
    // try {
    //   if (previewSpec.encoding.color['type'] == NOMINAL)
    //     field = previewSpec.encoding.color['field'];
    //   else if(previewSpec.encoding.shape['type'] == NOMINAL)
    //     field = previewSpec.encoding.shape['field'];
    // } catch (e) {}

    let field = this.getDefaultSmallSizedNominalFieldName();
    spec.encoding = {
      ...spec.encoding,
      column: {
        field,
        type: NOMINAL
      }
    }

    return {spec};
  }
  private renderSeparateGraphPreview() {
    return (
      <VegaLite spec={this.getSeparateGraphSpec().spec}
        logger={this.plotLogger}
        data={this.props.data}
        isPreview={true}
        fromSpec={this.props.mainSpec}
        actionId={"SEPARATE_GRAPH"}
        schema={this.props.schema}
        transitionAttrs={SeperateGraphStages} />
    );
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


  private onBackButton() {
    this.setState({triggeredAction: 'NONE'});
  }

  private vegaLiteWrapperRefHandler = () => {
  }

  private onExpand(expandedAction: ActionableID) {
    expandedAction = expandedAction == this.state.expandedAction ? "NONE" : expandedAction;
    this.setState({expandedAction});
  }

  private getPaneData() {
    const PANE_FILTER_GENERAL: ActionPaneData = {
      id: 'FILTER',
      isPaneUsing: this.isFilterUsing(),
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
}

export const ActionableOverplotting = (CSSModules(ActionableOverplottingBase, styles));