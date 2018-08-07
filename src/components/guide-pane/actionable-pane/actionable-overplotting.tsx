import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './actionable-overplotting.scss';
import {Actionables, GuidelineItem, ACTIONABLE_FILTER_GENERAL, ACTIONABLE_POINT_SIZE, ACTIONABLE_POINT_OPACITY, ACTIONABLE_REMOVE_FILL_COLOR, ACTIONABLE_CHANGE_SHAPE, ACTIONABLE_AGGREGATE, ACTIONABLE_ENCODING_DENSITY, ACTIONABLE_SEPARATE_GRAPH, GuidelineItemOverPlotting} from '../../../models/guidelines';
import {GuidelineAction, ActionHandler, GUIDELINE_TOGGLE_IGNORE_ITEM, LogAction, SPEC_MARK_CHANGE_TYPE, SPEC_FIELD_ADD, SPEC_FUNCTION_CHANGE, SpecAction, SPEC_TO_DENSITY_PLOT, SPEC_AGGREGATE_POINTS_BY_COLOR} from '../../../actions';
import {Logger} from '../../util/util.logger';
import {Themes} from '../../../models/theme/theme';
import {FacetedCompositeUnitSpec} from '../../../../node_modules/vega-lite/build/src/spec';
import {InlineData} from '../../../../node_modules/vega-lite/build/src/data';
import {CIRCLE, SQUARE, POINT, Mark, RECT} from '../../../../node_modules/vega-lite/build/src/mark';
import {VegaLite} from '../../vega-lite';
import {QUANTITATIVE, NOMINAL} from '../../../../node_modules/vega-lite/build/src/type';
import {Schema, FieldSchema} from '../../../models';
import {forEach} from '../../../../node_modules/vega-lite/build/src/encoding';
import {COLOR, X, Y, COLUMN} from '../../../../node_modules/vega-lite/build/src/channel';
import {FieldPicker} from './actionable-common-ui/field-picker';
import * as d3 from 'd3';

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

export class ActionableOverplottingBase extends React.PureComponent<ActionableOverplottingProps, ActionableOverplottingState>{

  private plotLogger: Logger;
  private vegaLiteWrapper: HTMLElement;

  constructor(props: ActionableOverplottingProps) {
    super(props);
    this.state = ({
      triggeredAction: "NONE"
    });
    this.plotLogger = new Logger(props.handleAction);
  }

  public render() {
    const vegaReady = typeof this.props.mainSpec != 'undefined';
    const {triggeredAction} = this.state;
    const filter = ACTIONABLE_FILTER_GENERAL,
      pointSize = ACTIONABLE_POINT_SIZE,
      pointOpacity = ACTIONABLE_POINT_OPACITY,
      removeFill = ACTIONABLE_REMOVE_FILL_COLOR,
      changeShape = ACTIONABLE_CHANGE_SHAPE,
      aggregate = ACTIONABLE_AGGREGATE,
      encodingDensity = ACTIONABLE_ENCODING_DENSITY,
      separateGraph = ACTIONABLE_SEPARATE_GRAPH;

    return (
      // TODO: this should be more general
      <div styleName="ac-root">
        <div styleName={triggeredAction == "NONE" ? "guide-previews" : "guide-previews-hidden"}>
          {/* TODO: show action filter */}
          <div styleName='guide-preview'>
            <div styleName='transition-progress-bg'>
              <div styleName='transition-progress'></div>
            </div>
            <div styleName="guide-preview-inner" className="preview-large" onClick={this.onFilterClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
              {/* TODO: how to best decide the default of the filtering target? */}
              <p styleName="preview-title">
                <i className={filter.faIcon} aria-hidden="true" />
                {' ' + filter.title}
              </p>
              <p styleName='preview-score'>77% experts</p>
              {vegaReady ? this.renderFilterPreview() : null}
              <ul styleName='preview-desc' className='fa-ul'>
                <li><i className="fa-li fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />{filter.pros}</li>
                <li><i className="fa-li fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />{filter.cons}</li>
              </ul>
            </div>
          </div>
          {vegaReady && this.isChangePointSizeUsing() ?
            <div styleName='guide-preview'>
              <div styleName='transition-progress-bg'>
                <div styleName='transition-progress'></div>
              </div>
              <div styleName="guide-preview-inner" className="preview-large" onClick={this.onChangePointSizeClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
                <p styleName="preview-title">
                  <i className={pointSize.faIcon} aria-hidden="true" />
                  {' ' + pointSize.title}
                </p>
                <p styleName='preview-score'>75% experts</p>
                {vegaReady ? this.renderChangePointSizePreview() : null}
                <ul styleName='preview-desc' className='fa-ul'>
                  <li><i className="fa-li fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />{pointSize.pros}</li>
                  <li><i className="fa-li fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />{pointSize.cons}</li>
                </ul>
              </div>
            </div> :
            null
          }
          {vegaReady && this.isChangeOpacityUsing() ?
            <div styleName='guide-preview'>
              <div styleName='transition-progress-bg'>
                <div styleName='transition-progress'></div>
              </div>
              <div styleName="guide-preview-inner" className="preview-large" onClick={this.onChangeOpacityClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
                <p styleName="preview-title">
                  <i className={pointOpacity.faIcon} aria-hidden="true" />
                  {' ' + pointOpacity.title}
                </p>
                <p styleName='preview-score'>72% experts</p>
                {vegaReady ? this.renderChangeOpacityPreview() : null}
                <ul styleName='preview-desc' className='fa-ul'>
                  <li><i className="fa-li fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />{pointOpacity.pros}</li>
                  <li><i className="fa-li fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />{pointOpacity.cons}</li>
                </ul>
              </div>
            </div> :
            null
          }
          {vegaReady && this.isRemoveFillColorUsing() ?
            <div styleName='guide-preview'>
              <div styleName='transition-progress-bg'>
                <div styleName='transition-progress'></div>
              </div>
              <div styleName="guide-preview-inner" className="preview-large" onClick={this.onRemoveFillColorClick.bind(this)} ref={this.vegaLiteWrapperRefHandler}
              onMouseEnter={this.onRemoveFillColorMouseEnter.bind(this)}
              onMouseLeave={this.onRemoveFillColorMouseLeave.bind(this)}
              >
                <p styleName="preview-title">
                  <i className={removeFill.faIcon} aria-hidden="true" />
                  {' ' + removeFill.title}
                </p>
                <p styleName='preview-score'>45% experts</p>
                {vegaReady ? this.renderRemoveFillColorPreview() : null}
                <ul styleName='preview-desc' className='fa-ul'>
                  <li><i className="fa-li fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />{removeFill.pros}</li>
                  <li><i className="fa-li fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />{removeFill.cons}</li>
                </ul>
              </div>
            </div> :
            null
          }
          {vegaReady && this.isChangeShapeUsing() ?
            <div styleName='guide-preview'>
              <div styleName='transition-progress-bg'>
                <div styleName='transition-progress'></div>
              </div>
              <div styleName="guide-preview-inner" className="preview-large" onClick={this.onRemoveFillColorClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
                <p styleName="preview-title">
                  <i className={changeShape.faIcon} aria-hidden="true" />
                  {' ' + changeShape.title}
                </p>
                <p styleName='preview-score'>42% experts</p>
                {vegaReady ? this.renderChangeShapePreview() : null}
                <ul styleName='preview-desc' className='fa-ul'>
                  <li><i className="fa-li fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />{changeShape.pros}</li>
                  <li><i className="fa-li fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />{changeShape.cons}</li>
                </ul>
              </div>
            </div> :
            null
          }
          {vegaReady && this.isAggregateUsing() ?
            <div styleName='guide-preview'>
              <div styleName='transition-progress-bg'>
                <div styleName='transition-progress'></div>
              </div>
              <div styleName="guide-preview-inner" className="preview-large" onClick={this.onAggregatePointsClick.bind(this)} ref={this.vegaLiteWrapperRefHandler}
                onMouseEnter={this.onAggregateMouseEnter.bind(this)}
                onMouseLeave={this.onAggregateMouseLeave.bind(this)}>
                <p styleName="preview-title">
                  <i className={aggregate.faIcon} aria-hidden="true" />
                  {' ' + aggregate.title}
                </p>
                <p styleName='preview-score'>38% experts</p>
                {vegaReady ? this.renderAggregatePreview() : null}
                <ul styleName='preview-desc' className='fa-ul'>
                  <li><i className="fa-li fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />{aggregate.pros}</li>
                  <li><i className="fa-li fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />{aggregate.cons}</li>
                </ul>
              </div>
            </div> :
            null
          }
          {vegaReady && this.isEncodingDensityUsing() ?
            <div styleName='guide-preview'>
              <div styleName='transition-progress-bg'>
                <div styleName='transition-progress'></div>
              </div>
              <div styleName="guide-preview-inner" className="preview-large" onClick={this.onEncodingDensityClick.bind(this)} ref={this.vegaLiteWrapperRefHandler}
                onMouseEnter={this.onEncodingDensityMouseEnter.bind(this)}
                onMouseLeave={this.onEncodingDensityMouseLeave.bind(this)}>
                <p styleName="preview-title">
                  <i className={encodingDensity.faIcon} aria-hidden="true" />
                  {' ' + encodingDensity.title}
                </p>
                <p styleName='preview-score'>18% experts</p>
                {vegaReady ? this.renderEncodingDensityPreview() : null}
                <ul styleName='preview-desc' className='fa-ul'>
                  <li><i className="fa-li fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />{encodingDensity.pros}</li>
                  <li><i className="fa-li fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />{encodingDensity.cons}</li>
                </ul>
              </div>
            </div> :
            null
          }
          {vegaReady && this.isSeparateGraphUsing() ?
            <div styleName='guide-preview'>
              <div styleName='transition-progress-bg'>
                <div styleName='transition-progress'></div>
              </div>
              <div styleName="guide-preview-inner" className="preview-large" onClick={this.onSeparateGraphClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
                <p styleName="preview-title">
                  <i className={separateGraph.faIcon} aria-hidden="true" />
                  {' ' + separateGraph.title}
                </p>
                <p styleName='preview-score'>11% experts</p>
                {vegaReady ? this.renderSeparateGraphPreview() : null}
                <ul styleName='preview-desc' className='fa-ul'>
                  <li><i className="fa-li fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />{separateGraph.pros}</li>
                  <li><i className="fa-li fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />{separateGraph.cons}</li>
                </ul>
              </div>
            </div> :
            null
          }
        </div>
        <div className="fa-gray" styleName="ignore-button">
          <a onClick={this.onIgnore.bind(this)}>
            <i className="fa fa-eye-slash" aria-hidden="true" />
            {' '} Ignore This Guideline...
            </a>
        </div>
        <div styleName={triggeredAction == "NONE" ? 'back-button-hidden' : 'back-button'}
          onClick={this.onBackButton.bind(this)}>
          <i className="fa fa-chevron-circle-left" aria-hidden="true" />
          {' '} Back
        </div>
        <div styleName={triggeredAction == "AGGREGATE_POINTS" ? '' : 'hidden'}>
          <FieldPicker
            id={this.props.item.id + "AGGREGATE_POINTS"}
            title='Aggregate Points'
            subtitle='Select one of nominal fields to aggregate points'
            fields={this.getNominalFieldNames()}
            schema={this.props.schema}
            defaultField={this.getDefaultSmallSizedNominalFieldName()}
            pickedFieldAction={this.aggregateByFieldAction}
          />
        </div>
        <div styleName={triggeredAction == "SEPARATE_GRAPH" ? '' : 'hidden'}>
          <FieldPicker
            id={this.props.item.id + "SEPARATE_GRAPH"}
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
    return true;
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

  private onRemoveFillColorMouseEnter(){
      // TODO: this should be decided
    const margin = {top: 20, right: 20, bottom: 50, left: 50}, width = 200, height = 200;
    let svg = d3.select('#d3-chart-specified').select('svg').select('svg');
    let data = this.props.data.values,
      xField = this.props.mainSpec.encoding.x['field'],
      yField = this.props.mainSpec.encoding.y['field'];

    let x = d3.scaleLinear().domain([0, d3.max(data, function (d) {return d[xField]})]).nice().range([0, width]);
    let y = d3.scaleLinear().domain([0, d3.max(data, function (d) {return d[yField]})]).nice().range([height, 0]);

    //
    let transition = d3.transition()
      .duration(1000)
      .ease(d3.easeLinear);

    svg.selectAll('.point')
      .transition().duration(1000)
      .attr('stroke-width', 2)
      .attr('fill', 'transparent')
      .attr('opacity', 0.7)
      .attr('stroke', '#4c78a8')
      .attr('width', 6)
      .attr('height', 6)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('x', function (d) {return (x(d[xField]) + (-3 + margin.left));})
      .attr('y', function (d) {return (y(d[yField]) + (-3 + margin.top));});
  }
  private onRemoveFillColorMouseLeave(){
    this.onAggregateMouseLeave();
  }
  private onAggregateMouseEnter() {
    // TODO: this should be decided
    const margin = {top: 20, right: 20, bottom: 50, left: 50}, width = 200, height = 200;
    let svg = d3.select('#d3-chart-specified').select('svg').select('svg');
    let data = this.props.data.values,
      xField = this.props.mainSpec.encoding.x['field'],
      yField = this.props.mainSpec.encoding.y['field'];

    let x = d3.scaleLinear().domain([0, d3.max(data, function (d) {return d[xField]})]).nice().range([0, width]);
    let y = d3.scaleLinear().domain([0, d3.max(data, function (d) {return d[yField]})]).nice().range([height, 0]);

    let transition = d3.transition()
      .duration(1000)
      .ease(d3.easeLinear);
    let category = this.getDefaultSmallSizedNominalFieldName();
    let ordinalColor = d3.scaleOrdinal(["#4c78a8", "#f58518", "#e45756", "#72b7b2", "#54a24b", "#eeca3b", "#b279a2", "#ff9da6", "#9d755d", "#bab0ac"])
      .domain(data.map(function (d) {return d[category]}));

    svg.selectAll('.point')
    .transition().duration(500)
      .attr('stroke-width', 2)
      .attr('fill', 'transparent')
      .attr('opacity', 0.7)
      .attr('width', 6)
      .attr('height', 6)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('stroke', function (d) {
        return ordinalColor(d[category]);
      })
      .transition().duration(500)
      .attr('x', function (d) {return (x(d3.mean(data.map(function (d1) {return d1[category] == d[category] ? d1[xField] : null;})))) + (-3 + margin.left);})
      .attr('y', function (d) {return (y(d3.mean(data.map(function (d1) {return d1[category] == d[category] ? d1[yField] : null;})))) + (-3 + margin.top);})
  }
  private onAggregateMouseLeave() {
    this.onEncodingDensityMouseLeave();
  }
  private onEncodingDensityMouseEnter() {
    // TODO: this should be decided
    const margin = {top: 20, right: 20, bottom: 50, left: 50}, width = 200, height = 200;
    let svg = d3.select('#d3-chart-specified').select('svg').select('svg');
    let data = this.props.data.values,
      xField = this.props.mainSpec.encoding.x['field'],
      yField = this.props.mainSpec.encoding.y['field'];

    // density plot
    let transition = d3.transition()
      .duration(1000)
      .ease(d3.easeLinear);

    let xBinRange = [],
      yBinRange = [],
      numOfBin = 35,
      binWidth = width / numOfBin,
      binHeight = height / numOfBin;

    for (let i = 0; i < numOfBin; i++) {
      xBinRange.push(i * binWidth + binWidth / 2.0);
    }
    for (let i = 0; i < numOfBin; i++) {
      yBinRange.push(i * binHeight + binHeight / 2.0);
    }
    let qsx = d3.scaleQuantize()
      .domain([0, d3.max(data, function (d) {return d[xField]})]).nice()
      .range(xBinRange);
    // .range([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190]);
    let qsy = d3.scaleQuantize()
      .domain([0, d3.max(data, function (d) {return d[yField]})]).nice()
      .range(yBinRange.reverse());
    // .range([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190].reverse());

    svg.selectAll('.point')
      .transition().duration(500)
      .attr('fill', '#08519c')
      .attr('stroke-width', 0)
      .attr('opacity', 0.2)
      .transition().duration(500)
      .attr('rx', 0)
      .attr('ry', 0)
      .attr('x', function (d) {return (qsx(d[xField]) + (-binWidth / 2.0 + margin.left));})
      .attr('y', function (d) {return (qsy(d[yField]) + (-binHeight / 2.0 + margin.top));})
      .attr('width', binWidth)
      .attr('height', binHeight);
  }

  private onEncodingDensityMouseLeave() {
    // TODO: this should be decided
    const margin = {top: 20, right: 20, bottom: 50, left: 50}, width = 200, height = 200;
    let svg = d3.select('#d3-chart-specified').select('svg').select('svg');
    let data = this.props.data.values,
      xField = this.props.mainSpec.encoding.x['field'],
      yField = this.props.mainSpec.encoding.y['field'];

    let x = d3.scaleLinear().domain([0, d3.max(data, function (d) {return d[xField]})]).nice().range([0, width]);
    let y = d3.scaleLinear().domain([0, d3.max(data, function (d) {return d[yField]})]).nice().range([height, 0]);

    //
    let transition = d3.transition()
      .duration(1000)
      .ease(d3.easeLinear);

    svg.selectAll('.point')
      .transition().duration(1000)
      .attr('stroke-width', 2)
      .attr('fill', 'transparent')
      .attr('opacity', 0.7)
      .attr('stroke', '#4c78a8')
      .attr('width', 6)
      .attr('height', 6)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('x', function (d) {return (x(d[xField]) + (-3 + margin.left));})
      .attr('y', function (d) {return (y(d[yField]) + (-3 + margin.top));});

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
      aggregate: "mean"
    };

    previewSpec.encoding.y = {
      ...previewSpec.encoding.y,
      aggregate: "mean"
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
      aggregate: "count",
      field: "*",
      type: QUANTITATIVE,
      scale: {scheme: "greenblue"}
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
    // console.log(previewSpec);

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
    this.setState({triggeredAction: "NONE"});
  }

  private vegaLiteWrapperRefHandler = (ref: any) => {
    this.vegaLiteWrapper = ref;
  }
}

export const ActionableOverplotting = (CSSModules(ActionableOverplottingBase, styles));