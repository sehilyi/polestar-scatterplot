import * as d3 from 'd3';
import {FacetedCompositeUnitSpec} from '../../node_modules/vega-lite/build/src/spec';
import {BaseType, select} from 'd3';
import {Schema} from '.';

// Basic property for d3-chart
export const COMMON_DURATION: number = 1000;
export const COMMON_DELAY: number = 2000;
export const CHART_SIZE = {width: 200, height: 200};
export const CHART_MARGIN = {top: 20, right: 20, bottom: 50, left: 50};
export const LEGEND_WIDTH = 100;
export const LEGEND_LT_MARGIN = 20;
export const NOMINAL_COLOR_SCHEME = ['#4c78a8', '#f58518', '#e45756', '#72b7b2', '#54a24b', '#eeca3b', '#b279a2', '#ff9da6', '#9d755d', '#bab0ac'];

export const TIMELINE_SIZE = {width: 400, height: 8};
export const TIMELINE_MARGIN = {top: 20, right: 10, bottom: 20, left: 10};
export const TIMELINE_COLOR_SCHEME = ['#6dccda', '#cdcc5d', '#ed97ca', '#a2a2a2', '#a8786e', '#ad8bc9', '#ed665d', '#67bf5c', '#ff9e4a', '#729ece'];
export const TIMELINE_CATEGORIES = ['MORPH', 'REPOSITION', 'COLOR', 'DELAY'];
export type TIMELINE_CATEGORY = 'MORPH' | 'REPOSITION' | 'COLOR' | 'DELAY';
export interface TransitionAttr {
  id: TIMELINE_CATEGORY;
  title: string;
  duration: number;
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

export function renderD3Chart(CHART_REF: any, spec: FacetedCompositeUnitSpec, data: any[]) {
  //
  console.log('spec for d3:');
  console.log(spec);
  //
  removePrevChart(CHART_REF);
  appendRootSVG(CHART_REF);
  appendAxes(spec, data);
  appendPoints(data);
  pointsAsScatterplot(spec, data);
}

export function removeTransitionTimeline() {
  d3.select('#d3-timeline').select('svg').selectAll('*')
    .transition().duration(COMMON_DURATION)
    .attr('opacity', 0).remove();
}
export function renderTransitionTimeline(title: string, stages: TransitionAttr[]) {
  let svg = d3.select('#d3-timeline').select('svg');

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
  let accumDuration = stages.map(x => x.duration).reduce(function (r, a) {
    if (r.length > 0) {
      a += r[r.length - 1];
    }
    r.push(a);
    return r;
  }, []);
  let totalDuration = d3.sum(stages.map(x => x.duration));
  let timelineColor = d3.scaleOrdinal(TIMELINE_COLOR_SCHEME).domain(TIMELINE_CATEGORIES);

  svg.selectAll('.timeline-stage')
    .data(stages)
    .enter().append('rect')
    .classed('timeline-stage', true)
    .attr('x', function (d, i) {return TIMELINE_MARGIN.left + (accumDuration[i] - d.duration) / totalDuration * TIMELINE_SIZE.width;})
    .attr('y', TIMELINE_MARGIN.top)
    .attr('width', function (d, i) {return d.duration / totalDuration * TIMELINE_SIZE.width;})
    .attr('height', TIMELINE_SIZE.height)
    .attr('stroke-width', 1)
    .attr('stroke', 'white')
    .attr('fill', function (d) {return timelineColor(d.id);});

  // append stage title
  svg.selectAll('.stage-label')
    .data(stages)
    .enter().append('text')
    .classed('stage-label', true)
    .text(function (d) {return d.title;})
    .attr('x', function (d, i) {return TIMELINE_MARGIN.left + (accumDuration[i] - d.duration) / totalDuration * TIMELINE_SIZE.width + d.duration / totalDuration * TIMELINE_SIZE.width / 2;})
    .attr('y', TIMELINE_MARGIN.top + TIMELINE_SIZE.height + 15)
    .style('font-style', 'italic')
    .style('font-family', 'Roboto')
    .style('font-size', 10)
    .style('text-anchor', 'middle')
    .style('fill', '#2e2e2e');

  // append tick
  // svg.selectAll('.stage-label')
  //   .data(stages)
  //   .enter().append('text')
  //   .classed('stage-label', true)
  //   .text(function (d) {return d.toLowerCase();})
  //   .attr('x', function (d, i) {return TIMELINE_MARGIN.left + commonStageWidth * i + commonStageWidth / 2.0;})
  //   .attr('y', TIMELINE_MARGIN.top + TIMELINE_SIZE.height + 15)
  //   .style('font-style', 'italic')
  //   .style('font-family', 'Roboto')
  //   .style('font-size', 10)
  //   .style('text-anchor', 'middle')
  //   .style('fill', '#2e2e2e');

  svg.selectAll('*')
    .attr('opacity', 0)
    .transition().duration(COMMON_DURATION)
    .attr('opacity', 1);
}

export function isThereD3Chart() {
  return selectRootSVG() != null;
}
export function selectRootSVG(): d3.Selection<BaseType, {}, HTMLElement, any> {
  return d3.select('#d3-chart-specified').select('svg');
}

export function removePrevChart(CHART_REF: any) {
  d3.select(CHART_REF)
    .selectAll('div')
    .remove();
}

export function appendRootSVG(CHART_REF: any) {

  // timeline
  d3.select(CHART_REF)
    .append('div')
    .attr('id', 'd3-timeline')
    .style('margin', 'auto')
    .append('svg')
    .attr('width', TIMELINE_SIZE.width + TIMELINE_MARGIN.left + TIMELINE_MARGIN.right)
    .attr('height', TIMELINE_SIZE.height + TIMELINE_MARGIN.top + TIMELINE_MARGIN.bottom);

  // main chart
  d3.select(CHART_REF)
    .append('div')
    .classed('d3-chart', true)
    .attr('id', 'd3-chart-specified')
    .style('margin', 'auto')
    .append('svg')
    .attr('width', CHART_SIZE.width + CHART_MARGIN.left + CHART_MARGIN.right)
    .attr('height', CHART_SIZE.height + CHART_MARGIN.top + CHART_MARGIN.bottom);
}

export function appendAxes(spec: FacetedCompositeUnitSpec, data: any[]) {
  let svg = selectRootSVG();
  let xField = spec.encoding.x['field'];
  let yField = spec.encoding.y['field'];
  let x = d3.scaleLinear()
    .domain([0, d3.max(data, function (d) {return d[xField]})] as number[]).nice()
    .range([0, CHART_SIZE.width]);
  let y = d3.scaleLinear()
    .domain([0, d3.max(data, function (d) {return d[yField]})] as number[]).nice()
    .range([CHART_SIZE.height, 0]);
  let xAxis = d3.axisBottom(x).ticks(Math.ceil(CHART_SIZE.width / 40));
  let yAxis = d3.axisLeft(y).ticks(Math.ceil(CHART_SIZE.height / 40));
  let xGrid = d3.axisBottom(x).ticks(Math.ceil(CHART_SIZE.width / 40)).tickFormat(null).tickSize(-CHART_SIZE.width);
  let yGrid = d3.axisLeft(y).ticks(Math.ceil(CHART_SIZE.height / 40)).tickFormat(null).tickSize(-CHART_SIZE.height);

  svg.append('g')
    .classed('grid', true)
    .attr('transform', 'translate(' + CHART_MARGIN.left + ',' + (CHART_SIZE.height + CHART_MARGIN.top) + ')')
    .call(xGrid);

  svg.append('g')
    .classed('grid', true)
    .attr('transform', 'translate(' + CHART_MARGIN.left + ',' + CHART_MARGIN.top + ')')
    .call(yGrid);

  svg.append('g')
    .classed('axis', true)
    .attr('transform', 'translate(' + CHART_MARGIN.left + ',' + (CHART_SIZE.height + CHART_MARGIN.top) + ')')
    .attr('stroke', '#888888')
    .attr('stroke-width', 0.5)
    .call(xAxis)
    .append('text')
    .classed('label', true)
    .attr('x', CHART_SIZE.width / 2)
    .attr('y', CHART_MARGIN.bottom - 10)
    .style('fill', 'black')
    .style('font-weight', 'bold')
    .style('font-family', 'sans-serif')
    .style('font-size', 11)
    .style('text-anchor', 'middle')
    .text(xField);

  svg.append('g')
    .classed('axis', true)
    .attr('transform', 'translate(' + CHART_MARGIN.left + ',' + CHART_MARGIN.top + ')')
    .attr('stroke', '#888888')
    .attr('stroke-width', 0.5)
    .call(yAxis)
    .append('text')
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

export function appendPoints(data: any[]) {
  selectRootSVG().selectAll('.point')
    .data(data)
    .enter().append('rect')
    .classed('point', true);
}

export function updatePoints(data: any[]) {
  selectRootSVG().selectAll('.point')
    .data(data)
    .exit().remove();
}
export function removeFillColor(duration?: number) {
  selectRootSVG().selectAll('.point')
    .transition().duration(duration)
    .attr('stroke', function () {return d3.select(this).attr('fill');})
    .attr('fill', 'transparent');
}
export function reducePointOpacity(opacity: number, duration?: number) {
  selectRootSVG().selectAll('.point')
    .transition().duration(duration)
    .attr('opacity', opacity);
}

export function reducePointSize(duration?: number) {
  selectRootSVG().selectAll('.point')
    .transition().duration(duration)
    .attr('width', function (d) {return parseFloat(d3.select(this).attr('width')) / 2.0;})
    .attr('height', function (d) {return parseFloat(d3.select(this).attr('height')) / 2.0;})
    .attr('x', function (d) {
      return parseFloat(d3.select(this).attr('x')) + parseFloat(d3.select(this).attr('width')) / 4.0;
    })
    .attr('y', function (d) {
      return parseFloat(d3.select(this).attr('y')) + parseFloat(d3.select(this).attr('height')) / 4.0;
    });
}
export function pointsAsScatterplot(spec: FacetedCompositeUnitSpec, data: any[], duration?: number, delay?: number) {
  let xField = spec.encoding.x['field'];
  let yField = spec.encoding.y['field'];

  let attr = getPointAttrs(spec);

  let x = d3.scaleLinear()
    .domain([0, d3.max(data, function (d) {return d[xField]})] as number[]).nice()
    .range([0, CHART_SIZE.width]);
  let y = d3.scaleLinear()
    .domain([0, d3.max(data, function (d) {return d[yField]})] as number[]).nice()
    .range([CHART_SIZE.height, 0]);

  selectRootSVG()
    .selectAll('.point')
    // TODO: any better idea for type check?
    .transition().delay(typeof delay == 'undefined' ? 0 : delay).duration(duration)
    .attr('stroke-width', attr.stroke_width)
    .attr('fill', attr.fill)
    .attr('opacity', attr.opacity)
    .attr('stroke', attr.stroke)
    //circle vs rect
    .attr('width', attr.width)
    .attr('height', attr.height)
    .attr('x', function (d) {return (x(d[xField]) + (-attr.width / 2.0 + CHART_MARGIN.left));})
    .attr('y', function (d) {return (y(d[yField]) + (-attr.height / 2.0 + CHART_MARGIN.top));})
    .attr('rx', attr.rx)
    .attr('ry', attr.ry);
}

export function getPointAttrs(spec: FacetedCompositeUnitSpec): PointAttr {
  return {
    fill: spec.mark == 'point' ? 'transparent' : '#4c78a8',
    opacity: 0.7,
    stroke: spec.mark != 'point' ? 'transparent' : '#4c78a8',
    stroke_width: spec.mark == 'point' ? 2 : 2,  //TODO: do we have to handle this?
    width: spec.mark == 'square' ? 5 : 6,
    height: spec.mark == 'square' ? 5 : 6,
    rx: spec.mark == 'square' ? 0 : 6,
    ry: spec.mark == 'square' ? 0 : 6
  };
}
export function resizeRootSVG(count: number, isLegend: boolean, duration?: number, delay?: number) {
  let width = (CHART_MARGIN.left + CHART_SIZE.width + CHART_MARGIN.right) * count + (isLegend ? LEGEND_WIDTH : 0);
  let height = CHART_MARGIN.top + CHART_SIZE.height + CHART_MARGIN.bottom;
  selectRootSVG()
    .transition().delay(typeof delay == 'undefined' ? 0 : delay).duration(duration)
    .attr('width', width)
    .attr('height', height);
}
export function pointsAsMeanScatterplot(spec: FacetedCompositeUnitSpec, data: any[], schema: Schema, field: string, duration?: number) {
  resizeRootSVG(1, true, COMMON_DURATION);
  let svg = selectRootSVG();
  let xField = spec.encoding.x['field'];
  let yField = spec.encoding.y['field'];

  let x = d3.scaleLinear()
    .domain([0, d3.max(data, function (d) {return d[xField]})]).nice()
    .range([0, CHART_SIZE.width]);
  let y = d3.scaleLinear()
    .domain([0, d3.max(data, function (d) {return d[yField]})]).nice()
    .range([CHART_SIZE.height, 0]);

  let categoryDomain = schema.domain({field});
  let ordinalColor = d3.scaleOrdinal(NOMINAL_COLOR_SCHEME)
    .domain(categoryDomain);
  let attr = getPointAttrs(spec);

  svg.selectAll('.point')
    .transition().duration(duration)
    .attr('fill', function (d) {return attr.fill == 'transparent' ? 'transparent' : ordinalColor(d[field]);})
    .attr('stroke', function (d) {return attr.stroke == 'transparent' ? 'transparent' : ordinalColor(d[field]);})
    .transition().duration(duration)
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
    .transition().duration(duration)
    .attr('opacity', 1);
}
export function pointsAsDensityPlot(spec: FacetedCompositeUnitSpec, data: any[], duration?: number) {
  let svg = selectRootSVG();
  let xField = spec.encoding.x['field'];
  let yField = spec.encoding.y['field'];

  let xBinRange = [],
    yBinRange = [],
    numOfBin = 30,
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

  svg.selectAll('.point')
    .transition().duration(duration)
    .attr('fill', '#08519c')
    .attr('stroke-width', 0)
    .attr('opacity', 0.2)
    .transition().duration(duration)
    .attr('rx', 0)
    .attr('ry', 0)
    .attr('x', function (d) {return (qsx(d[xField]) + (-binWidth / 2.0 + CHART_MARGIN.left));})
    .attr('y', function (d) {return (qsy(d[yField]) + (-binHeight / 2.0 + CHART_MARGIN.top));})
    .attr('width', binWidth)
    .attr('height', binHeight);
}
export function onPreviewReset(spec: FacetedCompositeUnitSpec, values: any[], duration?: number, delay?: number) {
  resizeRootSVG(1, false, duration, delay);
  selectRootSVG()
    .selectAll('.remove-when-reset')
    .transition().delay(typeof delay == 'undefined' ? 0 : delay).duration(duration)
    .attr('opacity', 0).remove();
  pointsAsScatterplot(spec, values, duration, delay);
}