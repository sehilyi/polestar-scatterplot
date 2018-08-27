import * as d3 from 'd3';
import {FacetedCompositeUnitSpec} from '../../node_modules/vega-lite/build/src/spec';
import {BaseType, select} from 'd3';
import {isDensityPlot, isMeanAggregated, getColorField, ActionableID, getColumnField, isLegendUsing, isColumnFieldUsing, getNumberOfGraphs} from './guidelines';
import {Schema} from '../models';
import {OneOfFilter} from '../../node_modules/vega-lite/build/src/filter';

// Basic property for d3-chart
export const COMMON_DURATION: number = 1000;
export const COMMON_FAST_DURATION: number = 100;
export const COMMON_DELAY: number = 2000;
export const COMMON_SHORT_DELAY: number = 300;
export const CHART_SIZE = {width: 200, height: 200};
export const CHART_MARGIN = {top: 20, right: 20, bottom: 50, left: 50};
export const CHART_PADDING = {left: 20};
export const LEGEND_WIDTH = 50;
export const LEGEND_LT_MARGIN = 20;
export const NOMINAL_COLOR_SCHEME = ['#4c78a8', '#f58518', '#e45756', '#72b7b2', '#54a24b', '#eeca3b', '#b279a2', '#ff9da6', '#9d755d', '#bab0ac'];

export const TIMELINE_SIZE = {width: 250, height: 8};
export const TIMELINE_MARGIN = {top: 15, right: 10, bottom: 25, left: 10};
export const TIMELINE_COLOR_SCHEME = ['#3CA9C4', '#FAAB49', '#E56548', '#7A8C8F'];
export const TIMELINE_CATEGORIES = ['MORPH', 'REPOSITION', 'COLOR', 'DELAY'];
export type TIMELINE_CATEGORY = 'MORPH' | 'REPOSITION' | 'COLOR' | 'DELAY';
export interface TransitionAttr {
  id: TIMELINE_CATEGORY;
  title: string;
  duration: number;
  delay: number;  // wait after transition
}

export interface PointAttr {
  fill: string;
  opacity: number;
  stroke: string;
  stroke_width: number;
  width: number;
  height: number;
  rx: number;
  ry: number;
}

export const AggregateStages: TransitionAttr[] = [
  {id: 'COLOR', title: 'Color By Another Field', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY},
  {id: 'REPOSITION', title: 'Aggregate To Average', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
];
export const DensityPlotStages: TransitionAttr[] = [
  {id: 'MORPH', title: 'Rect Shape', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY},
  {id: 'COLOR', title: 'Reduce Opacity', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY},
  {id: 'REPOSITION', title: 'Grid Position', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
];
export const PointOpacityStages: TransitionAttr[] = [
  {id: 'COLOR', title: 'Reduce Point Opacity', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
]
export const FilterStages: TransitionAttr[] = [
  {id: 'COLOR', title: 'Filter By Another Field', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
];
export const PointResizeStages: TransitionAttr[] = [
  {id: 'MORPH', title: 'Reduce Point Size', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
]
export const RemoveFillColorStages: TransitionAttr[] = [
  {id: 'COLOR', title: 'Remove Fill Color', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
];
export const SeperateGraphStages: TransitionAttr[] = [
  {id: 'REPOSITION', title: 'Separate Graph By Another Field', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
];

export function renderD3Preview(id: ActionableID, CHART_REF: any, fromSpec: FacetedCompositeUnitSpec, toSpec: FacetedCompositeUnitSpec, schema: Schema, data: any[], transitionAttrs: TransitionAttr[], isTransition: boolean) {
  // console.log('spec for D3:');
  // console.log(toSpec);
  removePrevChart(CHART_REF);
  appendRootSVG(id, CHART_REF);
  appendTransitionTimeline(id, '', transitionAttrs, false);
  // appendAxes(id, toSpec, schema, data, isTransition);
  appendPoints(id, data);
  renderPoints(id, fromSpec, toSpec, data, schema, isTransition);
}

export function renderPoints(id: ActionableID, fromSpec: FacetedCompositeUnitSpec, spec: FacetedCompositeUnitSpec, data: any[], schema: Schema, isTransition: boolean) {

  let diffOneof = getFilterForTransition(fromSpec.transform, spec.transform);

  // from
  if (isTransition) {
    renderScatterplot(id, fromSpec, data, schema, false);
  }

  // to
  renderScatterplot(id, spec, data, schema, isTransition, diffOneof);
}

export function getFilterForTransition(a1: any[], a2: any[]) {
  // console.log(a1);
  // console.log(a2);
  if (typeof a2 == 'undefined') {
    return null;
  }
  if (typeof a1 == 'undefined') {
    for (let i = 0; i < a2.length; i++) {
      try {
        if (typeof a2[i].filter.oneOf != 'undefined') {
          return a2[i].filter;
        }
      } catch (e) {}
    }
  }
  else {
    for (let i = 0; i < a2.length; i++) {
      try {
        if (a1.indexOf(a2[i]) == -1 && typeof a2[i].filter.oneOf != 'undefined') {
          return a2[i].filter;
        }
      } catch (e) {}
    }
  }
  return null;
}

export function resizeRootSVG(id: string, count: number, isLegend: boolean, isTransition?: boolean, duration?: number, delay?: number) {
  let width = (CHART_MARGIN.left + CHART_SIZE.width + CHART_MARGIN.right) * count + (isLegend ? LEGEND_WIDTH : 0);
  let height = CHART_MARGIN.top + CHART_SIZE.height + CHART_MARGIN.bottom;
  selectRootSVG(id)
    .transition().delay(isTransition ? delay : 0).duration(isTransition ? duration : 0)
    .attr('viewBox', '0 0 ' + width + ' ' + height);
}

export function renderScatterplot(id: ActionableID, spec: FacetedCompositeUnitSpec, data: any[], schema: Schema, isTransition: boolean, filter?: OneOfFilter) {
  const {isXMeanFn, isYMeanFn} = isMeanAggregated(spec);
  const {colorField} = getColorField(spec); //TODO: consider when quantitative
  const {columnField} = getColumnField(spec);
  const isColumnUsing = isColumnFieldUsing(spec);
  const isDensity = isDensityPlot(spec);
  // console.log(columnField);
  // console.log(schema);
  const numOfColumnCategory = getNumberOfGraphs(spec, schema);
  const categories = isColumnUsing ? schema.domain({field: columnField}) : null;
  const isLegend = isLegendUsing(spec);
  const xField = spec.encoding.x['field'], yField = spec.encoding.y['field'];
  const attr = getPointAttrs(spec);

  // for density plot
  let xBinRange = [], yBinRange = [];
  const numOfBin = 35, binWidth = CHART_SIZE.width / numOfBin, binHeight = CHART_SIZE.height / numOfBin;
  for (let i = 0; i < numOfBin; i++) {
    xBinRange.push(i * binWidth + binWidth / 2.0);
  }
  for (let i = 0; i < numOfBin; i++) {
    yBinRange.push(i * binHeight + binHeight / 2.0);
  }

  const x = !isDensity ?
    d3.scaleLinear()
      .domain([0, d3.max(data.map(d => d[xField]))]).nice()
      .rangeRound([0, CHART_SIZE.width]) :
    d3.scaleQuantize()
      .domain([0, d3.max(data, function (d) {return d[xField]})]).nice()
      .range(xBinRange);
  const y = !isDensity ?
    d3.scaleLinear()
      .domain([0, d3.max(data.map(d => d[yField]))]).nice()
      .rangeRound([CHART_SIZE.height, 0]) :
    d3.scaleQuantize()
      .domain([0, d3.max(data, function (d) {return d[yField]})]).nice()
      .range(yBinRange.reverse());;

  resizeRootSVG(id, numOfColumnCategory, isLegend, false);
  appendAxes(id, spec, schema, data, isTransition);
  selectRootSVG(id).selectAll('.point').raise();

  // render legend
  let colorScale: d3.ScaleOrdinal<string, string>;
  if (isLegend && !isDensity) { //TODO: implement legend for density plot
    colorScale = renderLegend(id, attr, colorField, schema, isTransition);
  }

  let points; // either seleciton or transition

  points = selectRootSVG(id).selectAll('.point');

  // also include all of the one stage transitions
  if (isTransition && id === 'AGGREGATE_POINTS') {
    points = points.transition().duration(AggregateStages[0].duration);
  }
  else if (isTransition && id === 'REMOVE_FILL_COLOR') {
    points = points.transition().duration(RemoveFillColorStages[0].duration);
  }
  else if (isTransition && id === 'ENCODING_DENSITY') {
    points = points.transition().duration(DensityPlotStages[0].duration);
  }
  else if (isTransition && id === 'CHANGE_POINT_SIZE') {
    points = points.transition().duration(PointResizeStages[0].duration);
  }
  else if (isTransition && id === 'CHANGE_POINT_OPACITY') {
    points = points.transition().duration(PointOpacityStages[0].duration);
  }
  else if (isTransition && id === 'SEPARATE_GRAPH') {
    points = points.transition().duration(SeperateGraphStages[0].duration);
  }

  points
    .attr('fill', function (d) {return attr.fill == 'transparent' ? 'transparent' : (typeof colorScale != 'undefined' ? colorScale(d[colorField]) : attr.fill);})
    .attr('stroke', function (d) {return attr.stroke == 'transparent' ? 'transparent' : (typeof colorScale != 'undefined' ? colorScale(d[colorField]) : attr.stroke);})
    .attr('rx', attr.rx)  // to draw either circle or rect
    .attr('ry', attr.ry)
    .attr('width', attr.width)
    .attr('height', attr.height)
    .attr('stroke-width', attr.stroke_width);

  if (isTransition && id === 'AGGREGATE_POINTS') {
    points = points.transition().duration(AggregateStages[1].duration).delay(AggregateStages[0].delay);
  }
  else if (isTransition && id === 'ENCODING_DENSITY') {
    points = points.transition().duration(DensityPlotStages[1].duration).delay(DensityPlotStages[0].delay);
  }

  points.attr('opacity', attr.opacity);

  if (isTransition && id === 'ENCODING_DENSITY') {
    points = points.transition().duration(DensityPlotStages[2].duration).delay(DensityPlotStages[1].delay);
  }

  points
    .attr('transform', function (d) {
      return 'translate(' + (isColumnUsing ? (CHART_MARGIN.left + CHART_SIZE.width + CHART_MARGIN.right + CHART_PADDING.left) * categories.indexOf(d[columnField]) : 0) + ', 0)';
    })
    .attr('x', function (d) {
      return isXMeanFn ?
        CHART_MARGIN.left + x(d3.mean(data.map(function (_d) {return _d[colorField] == d[colorField] ? _d[xField] : null;}))) + (-attr.width / 2.0) :
        CHART_MARGIN.left + x(d[xField]) + (-attr.width / 2.0);
    })
    .attr('y', function (d) {
      return isYMeanFn ?
        y(d3.mean(data.map(function (_d) {return _d[colorField] == d[colorField] ? _d[yField] : null;}))) + (-attr.height / 2.0 + CHART_MARGIN.top) :
        y(d[yField]) + (-attr.height / 2.0 + CHART_MARGIN.top);
    });

  if (typeof filter != 'undefined' && filter != null) {
    selectRootSVG(id).selectAll('.point')
      .filter(function (d) {return (filter.oneOf as string[]).indexOf(d[filter.field]) == -1;})
      .transition().duration(isTransition && id == 'FILTER' ? FilterStages[0].duration : 0)
      .attr('opacity', 0);
  }
}
export function separateGraph(id: string, spec: FacetedCompositeUnitSpec, values: any[], schema: Schema, field: string, stages: TransitionAttr[]) {
  let svg = selectRootSVG(id);
  const xField = spec.encoding.x['field'],
    yField = spec.encoding.y['field'];

  let categoryField = field;
  let numOfCategory = schema.domain({field: categoryField}).length;
  const width = 200;
  //TODO: use resizeRootSVG function
  let widthPlusMargin = width + CHART_MARGIN.left + CHART_MARGIN.right;
  svg.transition().duration(stages[0].duration).attr('width', function () {
    return widthPlusMargin * numOfCategory;
  });

  for (let i = 0; i < numOfCategory; i++) {
    if (i == 0) continue;

    let x = d3.scaleLinear()
      .domain([0, d3.max(values, function (d) {return d[xField]})]).nice()
      .rangeRound([0, width]);
    let y = d3.scaleLinear()
      .domain([0, d3.max(values, function (d) {return d[yField]})]).nice()
      .rangeRound([CHART_SIZE.height, 0]);

    let xAxis = d3.axisBottom(x).ticks(Math.ceil(width / 40));
    let yAxis = d3.axisLeft(y).ticks(Math.ceil(CHART_SIZE.height / 40));
    let xGrid = d3.axisBottom(x).ticks(Math.ceil(width / 40)).tickFormat(null).tickSize(-width);
    let yGrid = d3.axisLeft(y).ticks(Math.ceil(CHART_SIZE.height / 40)).tickFormat(null).tickSize(-CHART_SIZE.height);

    svg.append('g')
      .classed('grid remove-when-reset', true)
      .attr('transform', 'translate(' + (CHART_MARGIN.left) + ',' + (CHART_SIZE.height + CHART_MARGIN.top) + ')')
      .call(xGrid)
      .transition().duration(stages[0].duration)
      .attr('transform', 'translate(' + (CHART_MARGIN.left + widthPlusMargin * i) + ',' + (CHART_SIZE.height + CHART_MARGIN.top) + ')');

    svg.append('g')
      .classed('grid remove-when-reset', true)
      .attr('transform', 'translate(' + (CHART_MARGIN.left) + ',' + CHART_MARGIN.top + ')')
      .call(yGrid)
      .transition().duration(stages[0].duration)
      .attr('transform', 'translate(' + (CHART_MARGIN.left + widthPlusMargin * i) + ',' + CHART_MARGIN.top + ')');

    let xaxis = svg.append('g')
      .classed('axis remove-when-reset', true)
      .attr('transform', 'translate(' + (CHART_MARGIN.left) + ',' + (CHART_SIZE.height + CHART_MARGIN.top) + ')')
      .attr('stroke', '#888888')
      .attr('stroke-width', 0.5)
      .call(xAxis);

    xaxis
      .transition().duration(stages[0].duration)
      .attr('transform', 'translate(' + (CHART_MARGIN.left + widthPlusMargin * i) + ',' + (CHART_SIZE.height + CHART_MARGIN.top) + ')');

    xaxis
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

    let yaxis = svg.append('g')
      .classed('axis remove-when-reset', true)
      .attr('transform', 'translate(' + (CHART_MARGIN.left) + ',' + CHART_MARGIN.top + ')')
      .attr('stroke', '#888888')
      .attr('stroke-width', 0.5)
      .call(yAxis);

    yaxis
      .transition().duration(stages[0].duration)
      .attr('transform', 'translate(' + (CHART_MARGIN.left + widthPlusMargin * i) + ',' + CHART_MARGIN.top + ')');

    yaxis.append('text')
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

    let category = schema.domain({field: categoryField})[i];
    svg.selectAll('.point')
      .filter(function (d) {return d[categoryField] == category;})
      .transition().duration(stages[0].duration)
      .attr('x', function () {
        return parseFloat(d3.select(this).attr('x')) + widthPlusMargin * i;
      });
  }
  svg.selectAll('.point').raise();
}
export function isThereD3Chart(id: string) {
  return selectRootSVG(id) != null;
}
export function selectRootSVG(id: string): d3.Selection<BaseType, {}, HTMLElement, any> {
  return d3.select('#d3-chart-specified-' + id).select('svg');
}
export function appendRootSVG(id: string, CHART_REF: any) {
  // timeline
  d3.select(CHART_REF)
    .append('div')
    .attr('id', 'd3-timeline-' + id)
    .classed('timeline', true)
    .style('margin', 'auto')
    .append('svg')
    .attr('width', TIMELINE_SIZE.width + TIMELINE_MARGIN.left + TIMELINE_MARGIN.right)
    .attr('height', TIMELINE_SIZE.height + TIMELINE_MARGIN.top + TIMELINE_MARGIN.bottom);

  // main chart
  d3.select(CHART_REF)
    .append('div')
    .classed('d3-chart', true)
    .attr('id', 'd3-chart-specified-' + id)
    .style('margin', 'auto')
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%');
}

export function startTimeline(id: string, stages: TransitionAttr[]) {
  let totalDuration = d3.sum(stages.map(x => x.duration + x.delay));
  d3.select('#d3-timeline-' + id).selectAll('.timeline-pb')
    .attr('x', TIMELINE_MARGIN.left)
    .attr('y', TIMELINE_MARGIN.top)
    .attr('height', TIMELINE_SIZE.height)
    .attr('width', TIMELINE_SIZE.width)
    .attr('fill', 'white')
    .attr('opacity', 0.6)
    .transition().duration(totalDuration).ease(d3.easeLinear)
    .attr('x', TIMELINE_MARGIN.left + TIMELINE_SIZE.width)
    .attr('y', TIMELINE_MARGIN.top)
    .attr('height', TIMELINE_SIZE.height)
    .attr('width', 0);
  // .attr('opacity', 1);
}
export function appendTransitionTimeline(id: string, title: string, stages: TransitionAttr[], isTransition: boolean) {
  // removeTransitionTimeline(id, 0);
  let svg = d3.select('#d3-timeline-' + id).select('svg');

  // append title
  svg.append('text')
    .text(title)
    .attr('x', TIMELINE_MARGIN.left + TIMELINE_SIZE.width / 2.0)
    .attr('y', TIMELINE_MARGIN.top - 10)
    .style('font-weight', 'bold')
    .style('font-family', 'Roboto')
    .style('font-size', 12)
    .style('text-anchor', 'middle')
    .style('fill', '#2e2e2e');

  // append each category of timeline
  // accumulated duration starts with zero: [0, d[0], d[0]+d[1], ...]
  let accumDurationPlusDelay = stages.map(x => x.duration + x.delay).reduce(function (r, a) {
    if (r.length > 0) {
      a += r[r.length - 1];
    }
    r.push(a);
    return r;
  }, []);
  accumDurationPlusDelay.unshift(0);

  let totalDuration = d3.sum(stages.map(x => x.duration + x.delay));
  let timelineColor = d3.scaleOrdinal(TIMELINE_COLOR_SCHEME).domain(TIMELINE_CATEGORIES);

  svg.selectAll('.timeline-stage')
    .data(stages)
    .enter().append('rect')
    .classed('timeline-stage', true)
    .attr('x', function (d, i) {return TIMELINE_MARGIN.left + accumDurationPlusDelay[i] / totalDuration * TIMELINE_SIZE.width;})
    .attr('width', function (d) {return (d.duration + d.delay) / totalDuration * TIMELINE_SIZE.width;})
    .attr('fill', function (d) {return timelineColor(d.id);})
    .attr('y', TIMELINE_MARGIN.top)
    .attr('height', TIMELINE_SIZE.height)
    .attr('opacity', 1);

  // append stage title
  svg.selectAll('.stage-label')
    .data(stages)
    .enter().append('text')
    .classed('stage-label', true)
    .text(function (d) {return d.title;})
    .attr('x', function (d, i) {return TIMELINE_MARGIN.left + accumDurationPlusDelay[i] / totalDuration * TIMELINE_SIZE.width + (d.duration + d.delay) / totalDuration * TIMELINE_SIZE.width / 2.0;}) // + 4
    .attr('y', TIMELINE_MARGIN.top + 25)
    .style('font-family', 'Roboto Condensed')
    .style('text-anchor', 'middle')
    .style('fill', '#2e2e2e')
    .attr('font-size', 12)
    .attr('opacity', 1);

  // append progress bar
  svg.selectAll('.timeline-pb')
    .data(['pb'])
    .enter().append('rect')
    .classed('timeline-pb', true)
    .attr('x', TIMELINE_MARGIN.left)
    .attr('y', TIMELINE_MARGIN.top)
    .attr('height', TIMELINE_SIZE.height)
    .attr('width', TIMELINE_SIZE.width)
    .attr('fill', 'white')
    .attr('opacity', 0.6)
    .transition().duration(isTransition ? totalDuration : 0).ease(d3.easeLinear)
    .attr('x', TIMELINE_MARGIN.left + TIMELINE_SIZE.width)
    .attr('y', TIMELINE_MARGIN.top)
    .attr('height', TIMELINE_SIZE.height)
    .attr('width', 0)
    .attr('opacity', 1);

  // append stage betweens
  svg.selectAll('.stage-between')
    .data(accumDurationPlusDelay)
    .enter().append('line')
    .classed('stage-between', true)
    .attr('x1', function (d, i) {return TIMELINE_MARGIN.left + accumDurationPlusDelay[i] / totalDuration * TIMELINE_SIZE.width;})
    .attr('x2', function (d, i) {return TIMELINE_MARGIN.left + accumDurationPlusDelay[i] / totalDuration * TIMELINE_SIZE.width;})
    .attr('y1', TIMELINE_MARGIN.top - 3)
    .attr('y2', TIMELINE_MARGIN.top + TIMELINE_SIZE.height + 3)
    .attr('stroke', '#2e2e2e')
    .attr('stroke-width', 1)
    .attr('opacity', function (d, i) {return (stages.length <= i || stages[i].id != 'DELAY') ? 1 : 0})

  // removeTransitionTimeline(id, totalDuration);
}

export function removePrevChart(CHART_REF: any) {
  d3.select(CHART_REF)
    .selectAll('div')
    .remove();
}

export function onPreviewReset(id: ActionableID, spec: FacetedCompositeUnitSpec, schema: Schema, values: any[], isTransition?: boolean, duration?: number, delay?: number) {
  delay += COMMON_DELAY;
  resizeRootSVG(id, 1, false, isTransition, duration, delay);
  selectRootSVG(id)
    .selectAll('.remove-when-reset')
    .transition().delay(typeof delay == 'undefined' ? 0 : delay).duration(duration)
    .attr('opacity', 0).remove();
  renderScatterplot(id, spec, values, schema, false);//, duration, delay);
}

export function removeAxes(id: ActionableID) {
  selectRootSVG(id).selectAll('.axis').remove();
  selectRootSVG(id).selectAll('.grid').remove();
}
export function appendAxes(id: ActionableID, spec: FacetedCompositeUnitSpec, schema: Schema, data: any[], isTransition: boolean) {
  removeAxes(id);

  let svg = selectRootSVG(id);
  const xField = spec.encoding.x['field'], yField = spec.encoding.y['field'];

  let x = d3.scaleLinear()
    .domain([0, d3.max(data.map(d => d[xField]))]).nice()
    .rangeRound([0, CHART_SIZE.width]);
  let y = d3.scaleLinear()
    .domain([0, d3.max(data.map(x => x[yField]))]).nice()
    .rangeRound([CHART_SIZE.height, 0]);

  let xAxis = d3.axisBottom(x).ticks(Math.ceil(CHART_SIZE.width / 40));
  let yAxis = d3.axisLeft(y).ticks(Math.ceil(CHART_SIZE.height / 40));
  let xGrid = d3.axisBottom(x).ticks(Math.ceil(CHART_SIZE.width / 40)).tickFormat(null).tickSize(-CHART_SIZE.width);
  let yGrid = d3.axisLeft(y).ticks(Math.ceil(CHART_SIZE.height / 40)).tickFormat(null).tickSize(-CHART_SIZE.height);

  const numOfCategory = getNumberOfGraphs(spec, schema);

  for (let i = 0; i < numOfCategory; i++) {

    svg.append('g')
      .classed('grid', true)
      .attr('transform', 'translate(' + (CHART_MARGIN.left) + ',' + (CHART_SIZE.height + CHART_MARGIN.top) + ')')
      .call(xGrid)
      .transition().duration(isTransition && id == 'SEPARATE_GRAPH' ? SeperateGraphStages[0].duration : 0)
      .attr('transform', 'translate(' + ((CHART_MARGIN.left + CHART_SIZE.width + CHART_MARGIN.right + CHART_PADDING.left) * i + CHART_MARGIN.left) + ',' + (CHART_SIZE.height + CHART_MARGIN.top) + ')');

    svg.append('g')
      .classed('grid', true)
      .attr('transform', 'translate(' + (CHART_MARGIN.left) + ',' + (CHART_MARGIN.top) + ')')
      .call(yGrid)
      .transition().duration(isTransition && id == 'SEPARATE_GRAPH' ? SeperateGraphStages[0].duration : 0)
      .attr('transform', 'translate(' + ((CHART_MARGIN.left + CHART_SIZE.width + CHART_MARGIN.right + CHART_PADDING.left) * i + CHART_MARGIN.left) + ',' + CHART_MARGIN.top + ')')

    let xaxis = svg.append('g')
      .classed('axis', true)
      .attr('stroke', '#888888')
      .attr('stroke-width', 0.5)
      .attr('transform', 'translate(' + (CHART_MARGIN.left) + ',' + (CHART_SIZE.height + CHART_MARGIN.top) + ')')
      .call(xAxis);

    xaxis
      .transition().duration(isTransition && id == 'SEPARATE_GRAPH' ? SeperateGraphStages[0].duration : 0)
      .attr('transform', 'translate(' + ((CHART_MARGIN.left + CHART_SIZE.width + CHART_MARGIN.right + CHART_PADDING.left) * i + CHART_MARGIN.left) + ',' + (CHART_SIZE.height + CHART_MARGIN.top) + ')');

    xaxis.append('text')
      .classed('label', true)
      .attr('x', CHART_SIZE.width / 2)
      .attr('y', CHART_MARGIN.bottom - 10)
      .style('fill', 'black')
      .style('font-weight', 'bold')
      .style('font-family', 'sans-serif')
      .style('font-size', 11)
      .style('text-anchor', 'middle')
      .text(xField);

    let yaxis = svg.append('g')
      .classed('axis', true)
      .attr('stroke', '#888888')
      .attr('stroke-width', 0.5)
      .attr('transform', 'translate(' + (CHART_MARGIN.left) + ',' + (CHART_MARGIN.top) + ')')
      .call(yAxis);

    yaxis
      .transition().duration(isTransition && id == 'SEPARATE_GRAPH' ? SeperateGraphStages[0].duration : 0)
      .attr('transform', 'translate(' + ((CHART_MARGIN.left + CHART_SIZE.width + CHART_MARGIN.right + CHART_PADDING.left) * i + CHART_MARGIN.left) + ',' + CHART_MARGIN.top + ')');

    yaxis.append('text')
      .classed('label', true)
      .attr('transform', 'rotate(-90)')
      .attr('x', -CHART_SIZE.width / 2)
      .attr('y', -50)
      .attr('dy', '.71em')
      .style('font-weight', 'bold')
      .style('font-family', 'sans-serif')
      .style('font-size', 11)
      .style('fill', 'black')
      .style('text-anchor', 'middle')
      .text(yField);
  }
}

export function appendPoints(id: string, data: any[]) {
  selectRootSVG(id).selectAll('.point')
    .data(data)
    .enter().append('rect')
    .classed('point', true);
}
export function updatePoints(id: string, data: any[]) {
  selectRootSVG(id).selectAll('.point')
    .data(data)
    .exit().remove();
}
export function removeFillColor(id: string, stages: TransitionAttr[]) {
  selectRootSVG(id).selectAll('.point')
    .transition().duration(stages[0].duration)
    .attr('stroke', function () {return d3.select(this).attr('fill');})
    .attr('fill', 'transparent');
}
export function filterPoint(id: string, field: string, oneOf: any[], stages?: TransitionAttr[]) {
  selectRootSVG(id).selectAll('.point')
    .filter(function (d) {return oneOf.indexOf(d[field]) == -1;})
    .transition().duration(typeof stages != 'undefined' ? stages[0].duration : 0)
    .attr('opacity', 0);
}
export function reducePointOpacity(id: string, opacity: number, stages: TransitionAttr[]) {
  selectRootSVG(id).selectAll('.point')
    .transition().duration(stages[0].duration)
    .attr('opacity', opacity);
}

export function reducePointSize(id: string, stages: TransitionAttr[]) {
  selectRootSVG(id).selectAll('.point')
    .transition().duration(stages[0].duration)
    //TODO: DEFAULT_CHANGE_POINT_SIZE is not used
    .attr('width', function () {return parseFloat(d3.select(this).attr('width')) / 2.0;})
    .attr('height', function () {return parseFloat(d3.select(this).attr('height')) / 2.0;})
    .attr('x', function () {
      return parseFloat(d3.select(this).attr('x')) + parseFloat(d3.select(this).attr('width')) / 4.0;
    })
    .attr('y', function () {
      return parseFloat(d3.select(this).attr('y')) + parseFloat(d3.select(this).attr('height')) / 4.0;
    });
}
export function renderLegend(id: string, attr: PointAttr, field: string, schema: Schema, isTransition: boolean): d3.ScaleOrdinal<string, string> {
  const categoryDomain = schema.domain({field});
  const colorScale = d3.scaleOrdinal(NOMINAL_COLOR_SCHEME)
    .domain(categoryDomain);
  let legend = selectRootSVG(id).selectAll('.legend')
    .data(categoryDomain)
    .enter().append('g')
    .classed('legend remove-when-reset', true)
    .attr('transform', function (d, i) {
      return 'translate(' +
        (CHART_MARGIN.left + CHART_SIZE.width + LEGEND_LT_MARGIN) + ',' +
        (CHART_MARGIN.top + LEGEND_LT_MARGIN + i * 20) + ')';
    });
  legend.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('rx', attr.rx)
    .attr('ry', attr.ry)
    .attr('width', attr.width)
    .attr('height', attr.height)
    .attr('stroke', function (d) {return attr.stroke == 'transparent' ? 'transparent' : colorScale(d);})
    .attr('stroke-width', attr.stroke_width)
    .attr('fill', function (d) {return attr.fill == 'transparent' ? 'transparent' : colorScale(d);})
    .attr('opacity', attr.opacity);

  legend.append('text')
    .attr('x', 10)
    .attr('y', 10)
    .text(function (d) {return d as string;})
    .classed('textselected', true)
    .style('text-anchor', 'start')
    .style('font-size', 15);

  legend
    .attr('opacity', 0)
    .transition().duration(isTransition ? AggregateStages[0].duration : 0)
    .attr('opacity', 1);

  return colorScale;
}

export function getPointAttrs(spec: FacetedCompositeUnitSpec): PointAttr {
  const isDensity = isDensityPlot(spec);
  let isRemoveFill = false;
  if (typeof spec.mark['filled'] != 'undefined') {
    isRemoveFill = !spec.mark['filled'];
  }

  // Notice: If filled === false? then, spec.mark is Object {type, filled} rather than string
  const mark = !isRemoveFill ? spec.mark : spec.mark['type'];
  let size = mark == 'square' ? 5 : 6;
  if (isDensity) size = CHART_SIZE.width / 35;
  let opacity = 0.7;
  try {size = spec.encoding.size['value'] / 10.0;} catch (e) {}
  try {opacity = spec.encoding.opacity['value'];} catch (e) {}
  if (isDensity) opacity = 0.1;
  return {
    fill: isDensity ? '#08519c' : (mark == 'point' || isRemoveFill) ? 'transparent' : '#4c78a8',
    opacity,
    stroke: '#4c78a8',
    stroke_width: isDensity ? 0 : 2,
    width: size,
    height: size,
    rx: mark == 'square' || isDensity ? 0 : size,
    ry: mark == 'square' || isDensity ? 0 : size,
  };
}
// https://bl.ocks.org/mbostock/7f5f22524bd1d824dd53c535eda0187f
export function showContourInD3Chart(id: string, spec: FacetedCompositeUnitSpec, data: any[]) {
  let svg = selectRootSVG(id);

  let xField = spec.encoding.x['field'];
  let yField = spec.encoding.y['field'];

  let x = d3.scaleLinear()
    .domain([0, d3.max(data, function (d) {return d[xField]})] as number[]).nice()
    .range([0, CHART_SIZE.width]);
  let y = d3.scaleLinear()
    .domain([0, d3.max(data, function (d) {return d[yField]})] as number[]).nice()
    .range([CHART_SIZE.height, 0]);

  svg.selectAll('.contour')
    .data(d3.contourDensity()
      .x(function (d) {return CHART_MARGIN.left + x(d[xField]);})
      .y(function (d) {return CHART_MARGIN.top + y(d[yField]);})
      .size([CHART_SIZE.width, CHART_SIZE.height])
      .bandwidth(10)
      (data))
    .enter().append('path')
    .classed('contour', true)
    .attr('d', d3.geoPath())
    .attr('fill', 'none')
    .attr('opacity', 0)
    .transition().duration(COMMON_DURATION)
    .attr('fill', 'red')
    .attr('opacity', 0.05);
}
export function hideContourInD3Chart(id: string) {
  selectRootSVG(id).selectAll('.contour').remove();
}
export function pointsAsMeanScatterplot(id: string, spec: FacetedCompositeUnitSpec, data: any[], schema: Schema, field: string, stages: TransitionAttr[], isTransition: boolean) {
  resizeRootSVG(id, 1, true, isTransition, stages[0].duration);
  let svg = selectRootSVG(id);
  let xField = spec.encoding.x['field'];
  let yField = spec.encoding.y['field'];

  let x = d3.scaleLinear()
    .domain([0, d3.max(data, function (d) {return d[xField]})]).nice()
    .rangeRound([0, CHART_SIZE.width]);
  let y = d3.scaleLinear()
    .domain([0, d3.max(data, function (d) {return d[yField]})]).nice()
    .rangeRound([CHART_SIZE.height, 0]);

  let categoryDomain = schema.domain({field});
  let ordinalColor = d3.scaleOrdinal(NOMINAL_COLOR_SCHEME)
    .domain(categoryDomain);
  let attr = getPointAttrs(spec);

  svg.selectAll('.point')
    .transition().duration(stages[0].duration)
    .attr('fill', function (d) {return attr.fill == 'transparent' ? 'transparent' : ordinalColor(d[field]);})
    .attr('stroke', function (d) {return attr.stroke == 'transparent' ? 'transparent' : ordinalColor(d[field]);})
    .transition().duration(stages[1].duration).delay(stages[0].delay)
    .attr('x', function (d) {return (x(d3.mean(data.map(function (d1) {return d1[field] == d[field] ? d1[xField] : null;})))) + (-attr.width / 2.0 + CHART_MARGIN.left);})
    .attr('y', function (d) {return (y(d3.mean(data.map(function (d1) {return d1[field] == d[field] ? d1[yField] : null;})))) + (-attr.height / 2.0 + CHART_MARGIN.top);})

  // legend
  let legend = svg.selectAll('.legend')
    .data(categoryDomain)
    .enter().append('g')
    .classed('legend remove-when-reset', true)
    .attr('transform', function (d, i) {
      return 'translate(' +
        (CHART_MARGIN.left + CHART_SIZE.width + LEGEND_LT_MARGIN) + ',' +
        (CHART_MARGIN.top + LEGEND_LT_MARGIN + i * 20) + ')';
    });

  legend.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('stroke-width', attr.stroke_width)
    .attr('opacity', attr.opacity)
    .attr('stroke', function (d) {return attr.stroke == 'transparent' ? 'transparent' : ordinalColor(d);})
    //circle vs rect
    .attr('width', attr.width)
    .attr('height', attr.height)
    .attr('rx', attr.rx)
    .attr('ry', attr.ry)
    .attr('fill', function (d) {return attr.fill == 'transparent' ? 'transparent' : ordinalColor(d);});

  legend.append('text')
    .attr('x', 10)
    .attr('y', 10)
    .text(function (d) {return d as string;})
    .classed('textselected', true)
    .style('text-anchor', 'start')
    .style('font-size', 15);

  legend
    .attr('opacity', 0)
    .transition().duration(stages[0].duration)
    .attr('opacity', 1);
}
export function renderDensityPlot(id: string, spec: FacetedCompositeUnitSpec, data: any[], stages: TransitionAttr[], isTransition: boolean) {
  let svg = selectRootSVG(id);
  let xField = spec.encoding.x['field'];
  let yField = spec.encoding.y['field'];

  let xBinRange = [],
    yBinRange = [],
    numOfBin = 35,
    binWidth = CHART_SIZE.width / numOfBin,
    binHeight = CHART_SIZE.height / numOfBin;

  for (let i = 0; i < numOfBin; i++) {
    xBinRange.push(i * binWidth + binWidth / 2.0);
  }
  for (let i = 0; i < numOfBin; i++) {
    yBinRange.push(i * binHeight + binHeight / 2.0);
  }
  let qsx = d3.scaleQuantize()
    .domain([0, d3.max(data, function (d) {return d[xField]})]).nice()
    .range(xBinRange);
  let qsy = d3.scaleQuantize()
    .domain([0, d3.max(data, function (d) {return d[yField]})]).nice()
    .range(yBinRange.reverse());

  resizeRootSVG(id, 1, isLegendUsing(spec));

  svg.selectAll('.point')
    .transition().duration(isTransition ? stages[0].duration : 0)
    .attr('rx', 0)
    .attr('ry', 0)
    .attr('fill', '#08519c')
    .attr('stroke-width', 0)
    .attr('width', binWidth)
    .attr('height', binHeight)
    .transition().duration(isTransition ? stages[1].duration : 0).delay(isTransition ? stages[0].delay : 0)
    .attr('opacity', 0.2)
    .transition().duration(isTransition ? stages[2].duration : 0).delay(isTransition ? stages[1].delay : 0)
    .attr('x', function (d) {return (qsx(d[xField]) + (-binWidth / 2.0 + CHART_MARGIN.left));})
    .attr('y', function (d) {return (qsy(d[yField]) + (-binHeight / 2.0 + CHART_MARGIN.top));});
}
export function removeTransitionTimeline(id: string, duration?: number) {
  duration += COMMON_DELAY;
  d3.select('#d3-timeline-' + id).select('svg').selectAll('*')
    .transition().delay(duration).duration(COMMON_DURATION)
    .attr('opacity', 0)
    .remove();
}