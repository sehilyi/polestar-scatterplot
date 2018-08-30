import * as d3 from 'd3';
import {FacetedCompositeUnitSpec} from '../../node_modules/vega-lite/build/src/spec';
import {BaseType, select} from 'd3';
import {isDensityPlot, isMeanAggregated, getColorField, ActionableID, getColumnField, isLegendUsing, isColumnFieldUsing, getNumberOfGraphs, AggregateStages, RemoveFillColorStages, DensityPlotStages, PointResizeStages, PointOpacityStages, SeperateGraphStages, FilterStages, isSkipColorOfAggregatePoints} from './guidelines';
import {Schema} from '../models';
import {OneOfFilter} from '../../node_modules/vega-lite/build/src/filter';
import {FieldDef} from 'vega-lite/build/src/fielddef';
import {QUANTITATIVE, NOMINAL} from 'vega-lite/build/src/type';
import {translate} from '../d3-util';
import {isNullOrUndefined} from '../util';
import {filterHasField} from './shelf';

// Basic property for d3-chart
export const COMMON_DURATION: number = 1000;
export const COMMON_FAST_DURATION: number = 100;
export const COMMON_DELAY: number = 2000;
export const COMMON_SHORT_DELAY: number = 300;
export const CHART_SIZE = {width: 200, height: 200};
export const CHART_MARGIN = {top: 30, right: 20, bottom: 40, left: 50};
export const CHART_PADDING = {right: 20};
export const LEGEND_MARK_SIZE = {height: 13};
export const LEGEND_WIDTH = 70;
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

export function renderD3Preview(
  id: ActionableID, CHART_REF: any, fromSpec: FacetedCompositeUnitSpec, toSpec: FacetedCompositeUnitSpec, schema: Schema, data: any[],
  transitionAttrs: TransitionAttr[], isTransition: boolean, isNoTimeline: boolean) {
  // console.log('spec for D3:');
  // console.log(toSpec);
  // console.log(isNoTimeline);
  removePrevChart(CHART_REF);
  appendRootSVG(id, CHART_REF, isNoTimeline);
  if (!isNoTimeline) {
    let newAttrs = transitionAttrs.slice();
    // For the only exception, remove first stage of Aggregate Points transition when color is already used.
    if (isSkipColorOfAggregatePoints(id, fromSpec)) {
      newAttrs.splice(0, 1);
    }
    appendTransitionTimeline(id, '', newAttrs, false);
  }
  appendPoints(id, data);
  renderPoints(id, fromSpec, toSpec, data, schema, isTransition, isNoTimeline);
}

export function renderPoints(id: ActionableID, fromSpec: FacetedCompositeUnitSpec, spec: FacetedCompositeUnitSpec, data: any[], schema: Schema, isTransition: boolean, isSpecifiedView: boolean) {

  // from
  if (isTransition) {
    renderScatterplot(id, fromSpec, data, schema, false);
  }

  // to
  let diffOneof = id != 'NONE' && id != 'NONE2' ? getFilterForTransition(fromSpec.transform, spec.transform) : null;
  renderScatterplot(id, spec, data, schema, isTransition, diffOneof, isSkipColorOfAggregatePoints(id, fromSpec));
  // console.log(diffOneof);
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
        if (!filterHasField(a1.filter(t => !isNullOrUndefined(t['filter'])).map(t => t.filter), a2[i].filter.field) && typeof a2[i].filter.oneOf != 'undefined') {
          return a2[i].filter;
        }
      } catch (e) {}
    }
  }
  return null;
}

export function resizeRootSVG(id: string, count: number, isLegend: boolean, isTransition?: boolean, duration?: number, delay?: number) {
  let width = (CHART_MARGIN.left + CHART_SIZE.width + CHART_MARGIN.right + CHART_PADDING.right) * count - CHART_PADDING.right + (isLegend ? LEGEND_WIDTH : 0);
  let height = CHART_MARGIN.top + CHART_SIZE.height + CHART_MARGIN.bottom;
  selectRootSVG(id)
    .transition().delay(isTransition ? delay : 0).duration(isTransition ? duration : 0)
    .attr('viewBox', '0 0 ' + width + ' ' + height);
}

export function renderScatterplot(id: ActionableID, spec: FacetedCompositeUnitSpec, data: any[], schema: Schema, isTransition: boolean, filter?: OneOfFilter, isSkip1APStage?: boolean) {
  const {isXMeanFn, isYMeanFn} = isMeanAggregated(spec);
  const {colorField} = getColorField(spec);
  const {columnField} = getColumnField(spec);
  const isColumnUsing = isColumnFieldUsing(spec);
  const isDensity = isDensityPlot(spec);
  isSkip1APStage = isNullOrUndefined(isSkip1APStage) ? false : isSkip1APStage;
  const numOfColumnCategory = getNumberOfGraphs(spec, schema, data);
  const categories = isColumnUsing ? getDomainWithFilteredData(data, columnField) : null; //schema.domain({field: columnField})
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
  let maxCount = 0;
  if (isDensity) {
    //TODO: consider with only the filtered data
    let xValues: number[] = data.map(x => x[xField]), yValues: number[] = data.map(x => x[yField]);
    let xMin = d3.min(xValues as number[]), xMax = d3.max(xValues as number[]), xStep = (xMax - xMin) / numOfBin;
    let yMin = d3.min(yValues as number[]), yMax = d3.max(yValues as number[]), yStep = (yMax - yMin) / numOfBin;
    for (let i = xMin; i < xMax; i += xStep) {
      for (let j = yMin; j < yMax; j += yStep) {
        let count = data.filter(x => i <= x[xField] && x[xField] < i + xStep && j <= x[yField] && x[yField] < j + yStep).length;
        if (maxCount < count)
          maxCount = count;
      }
    }
    attr.opacity = Math.max(1 / (maxCount + 1), .04);  // 1 for zero count
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
      .range(yBinRange.reverse());

  resizeRootSVG(id, numOfColumnCategory, isLegend, false);
  renderAxes(id, spec, schema, data, isTransition);
  selectRootSVG(id).selectAll('.point').raise();

  // render legend
  let colorScale: any;
  if (isLegend) {
    colorScale = renderLegend(id, attr, isDensity ? 'count' : colorField.field, colorField.type, schema, getNumberOfGraphs(spec, schema, data), isTransition && !isSkip1APStage, isDensity, maxCount, data);
    // console.log(id + ':');
    // console.log(colorScale);
  }

  let points; // either seleciton or transition

  points = selectRootSVG(id).selectAll('.point');

  // also include all of the one stage transitions
  if (isTransition && id === 'AGGREGATE_POINTS') {
    points.attr('opacity', attr.opacity); // TODO: why not working?
    if (!isSkip1APStage) {
      points = points.transition().duration(AggregateStages[0].duration);
    }
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
    .attr('fill', function (d) {return attr.fill == 'transparent' ? 'transparent' : (!isNullOrUndefined(colorScale) && !isDensity ? colorScale(d[colorField.field]) : attr.fill);})
    .attr('stroke', function (d) {return attr.stroke == 'transparent' ? 'transparent' : (!isNullOrUndefined(colorScale) && !isDensity ? colorScale(d[colorField.field]) : attr.stroke);})
    .attr('rx', attr.rx)  // to draw either circle or rect
    .attr('ry', attr.ry)
    .attr('width', attr.width)
    .attr('height', attr.height)
    .attr('stroke-width', attr.stroke_width);

  if (isTransition && id === 'ENCODING_DENSITY') {
    points = points.transition().duration(DensityPlotStages[1].duration).delay(DensityPlotStages[0].delay);
  }

  points
    .attr('opacity', attr.opacity);

  if (isTransition && id === 'ENCODING_DENSITY') {
    points = points.transition().duration(DensityPlotStages[2].duration).delay(DensityPlotStages[1].delay);
  }
  else if (isTransition && id === 'AGGREGATE_POINTS') {
    points = points.transition().duration(AggregateStages[1].duration).delay(!isSkipColorOfAggregatePoints(id, spec) ? AggregateStages[0].delay : 0);
  }

  points
    .attr('transform', function (d) {
      return translate(isColumnUsing ? (CHART_MARGIN.left + CHART_SIZE.width + CHART_MARGIN.right + CHART_PADDING.right) * categories.indexOf(d[columnField]) : 0, 0);
    })
    .attr('x', function (d) {
      return isXMeanFn ?
        CHART_MARGIN.left + x(d3.mean(data.map(function (_d) {return _d[colorField.field] == d[colorField.field] ? _d[xField] : null;}))) + (-attr.width / 2.0) :
        CHART_MARGIN.left + x(d[xField]) + (-attr.width / 2.0);
    })
    .attr('y', function (d) {
      return isYMeanFn ?
        y(d3.mean(data.map(function (_d) {return _d[colorField.field] == d[colorField.field] ? _d[yField] : null;}))) + (-attr.height / 2.0 + CHART_MARGIN.top) :
        y(d[yField]) + (-attr.height / 2.0 + CHART_MARGIN.top);
    });

  // console.log(filter);
  // console.log(id);
  if (!isNullOrUndefined(filter) && id === 'FILTER') {
    // console.log('FILTER:');
    // console.log(filter.oneOf);
    points
      .filter(function (d) {return (filter.oneOf as string[]).indexOf(d[filter.field]) == -1;})
      .transition().duration(isTransition ? FilterStages[0].duration : 0)
      .attr('opacity', 0);
  }
  else if (id === 'AGGREGATE_POINTS' && isLegendUsing(spec)) {
    const categoryDomain = getDomainWithFilteredData(data, colorField.field);//schema.domain({field: colorField.field});
    let categoryPointUsed = categoryDomain.slice();
    // console.log(categoryPointUsed);
    //Leave only one point for each category
    //rather than update data
    points
      .filter(function (d) {
        if (categoryPointUsed.indexOf(d[colorField.field].toString()) != -1) {
          categoryPointUsed.splice(categoryPointUsed.indexOf(d[colorField.field].toString()), 1);
          return false;
        }
        return true;
      })
      .attr('opacity', 0);
  }
}
export function renderLegend(id: ActionableID, attr: PointAttr, field: string, type: string, schema: Schema, numOfChart: number, isTransition: boolean,
  isDensity: boolean, maxCount: number, data: any[]) {

  removeLegend(id);

  const fieldDomain = isDensity ? [0, maxCount] :
    type === NOMINAL ? getDomainWithFilteredData(data, field) :
      schema.domain({field});
  const colorScale: any = type == NOMINAL ?
    d3.scaleOrdinal(NOMINAL_COLOR_SCHEME).domain(fieldDomain) :
    isDensity ?
      d3.scaleSequential(d3.interpolate('white', '#08519c')).domain(d3.extent(fieldDomain)) :
      d3.scaleSequential(d3.interpolateBlues).domain(d3.extent(fieldDomain));

  // root
  let legendRoot = selectRootSVG(id)
    .append('g')
    .classed('legend', true)
    .attr('transform', translate(CHART_MARGIN.left + CHART_SIZE.width + CHART_MARGIN.right, CHART_MARGIN.top))

  // title
  legendRoot.selectAll('.legend-title')
    .data([field])
    .enter().append('text')
    .classed('legend-title', true)
    .attr('x', 0)
    .attr('y', 5)
    .style('text-anchor', 'start')
    .style('font-size', d => ((d as string).length > 7 ? 8 : 10) + 'px')
    // .style('font-family', 'Roboto Condensed')
    .style('font-weight', 'bold')
    .text(d => d)

  if (type == NOMINAL) {

    let nominalLegend = legendRoot.selectAll('.nlegend')
      .data(fieldDomain)
      .enter().append('g')
      .classed('nlegend', true)
      .attr('transform', (d, i) => translate(0, (i + 1) * LEGEND_MARK_SIZE.height))

    //marks
    nominalLegend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('rx', attr.rx == 0 ? 0 : 5)
      .attr('ry', attr.ry == 0 ? 0 : 5)
      .attr('stroke', d => attr.stroke == 'transparent' ? 'transparent' : colorScale(d))
      .attr('stroke-width', attr.stroke_width)
      .attr('fill', d => attr.fill == 'transparent' ? 'transparent' : colorScale(d))
      // use constant attr
      .attr('width', 5)
      .attr('height', 5)
      .attr('opacity', 1);

    nominalLegend.append('text')
      .attr('x', 10)
      .attr('y', 5)
      .text(d => d)
      .style('text-anchor', 'start')
      // .style('font-family', 'Roboto Condensed')
      .style('font-size', 8 + 'px');
  }
  else if (type == QUANTITATIVE) {

    const defs = legendRoot.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", "linear-gradient")
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%')

    linearGradient.selectAll("stop")
      .data(colorScale.ticks().map((t: any, i: any, n: any) => ({offset: `${100 * i / n.length}%`, color: colorScale(t)})))
      .enter().append("stop")
      .attr("offset", d => d['offset'])
      .attr("stop-color", d => d['color'])

    legendRoot.append('g')
      .append("rect")
      .attr("width", 15)
      .attr("height", CHART_SIZE.height - LEGEND_MARK_SIZE.height)
      .attr('transform', translate(0, LEGEND_MARK_SIZE.height))
      .style("fill", "url(#linear-gradient)")

    // min
    legendRoot.append('g').selectAll('.qlegend-minmax')
      .data([d3.extent(fieldDomain)[0]])
      .enter().append('text')
      .attr('x', 17)
      .attr('y', LEGEND_MARK_SIZE.height + 10)
      .text(function (d) {return d as string;})
      .style('text-anchor', 'start')
      // .style('font-family', 'Roboto Condensed')
      .style('font-size', 12 + 'px')

    // max
    legendRoot.append('g').selectAll('.qlegend-minmax')
      .data([d3.extent(fieldDomain)[1]])
      .enter().append('text')
      .attr('x', 17)
      .attr('y', CHART_MARGIN.top + CHART_SIZE.height - 25)
      .text(function (d) {return d as string;})
      .style('text-anchor', 'start')
      .style('font-size', 12 + 'px')
    // .style('font-family', 'Roboto Condensed')
  }

  if (id === 'SEPARATE_GRAPH') {
    legendRoot
      .transition().duration(isTransition ? SeperateGraphStages[0].duration : 0)
      .attr('transform', translate((CHART_MARGIN.left + CHART_SIZE.width + CHART_MARGIN.right + CHART_PADDING.right) * numOfChart - CHART_PADDING.right, CHART_MARGIN.top))
  }
  else {
    legendRoot
      .attr('transform', translate((CHART_MARGIN.left + CHART_SIZE.width + CHART_MARGIN.right + CHART_PADDING.right) * numOfChart - CHART_PADDING.right, CHART_MARGIN.top))
      .attr('opacity', 0)
      .transition().duration(isTransition && id === 'AGGREGATE_POINTS' ? AggregateStages[0].duration : 0)
      .attr('opacity', 1)
  }

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
  let opacity = 0.7;
  try {size = spec.encoding.size['value'] / 10.0;} catch (e) {}
  try {opacity = spec.encoding.opacity['value'];} catch (e) {}
  if (isDensity) size = CHART_SIZE.width / 35;
  if (isDensity) {
    opacity = 0.1;
  }
  return {
    fill: isDensity ? '#08519c' : (mark == 'point' || isRemoveFill) ? 'transparent' : '#4c78a8',
    opacity,
    stroke: '#4c78a8',
    stroke_width: isDensity ? 0 : 2,
    width: size,
    height: size,
    rx: mark == 'square' ? 0 : size,
    ry: mark == 'square' ? 0 : size,
  };
}

export function isThereD3Chart(id: string) {
  return selectRootSVG(id) != null;
}
export function selectRootSVG(id: string): d3.Selection<BaseType, {}, HTMLElement, any> {
  return d3.select('#d3-chart-specified-' + id).select('svg');
}
export function appendRootSVG(id: ActionableID, CHART_REF: any, isNoTimeline: boolean) {

  if (!isNoTimeline) {
    // timeline
    d3.select(CHART_REF)
      .append('div')
      .attr('id', 'd3-timeline-' + id)
      .classed('timeline', true)
      .style('margin', 'auto')
      .append('svg')
      .attr('width', TIMELINE_SIZE.width + TIMELINE_MARGIN.left + TIMELINE_MARGIN.right)
      .attr('height', TIMELINE_SIZE.height + TIMELINE_MARGIN.top + TIMELINE_MARGIN.bottom);
  }

  // main chart
  d3.select(CHART_REF)
    .append('div')
    .classed('d3-chart', true)
    .attr('id', 'd3-chart-specified-' + id)
    .style('margin', 'auto')
    .style('height', `calc(100% - ${isNoTimeline ? 0 : 50}px)`)
    .append('svg')
    .attr('width', '100%')
    .attr('height', id == 'NONE' || id == 'NONE2' ? '350px' : '100%');
}

export function startTimelineWithId(id: ActionableID) {
  let stages: TransitionAttr[];
  switch (id) {
    case 'FILTER': stages = FilterStages; break;
    case 'CHANGE_POINT_OPACITY': stages = PointOpacityStages; break;
    case 'CHANGE_POINT_SIZE': stages = PointResizeStages; break;
    case 'AGGREGATE_POINTS': stages = AggregateStages; break;
    case 'ENCODING_DENSITY': stages = DensityPlotStages; break;
    case 'SEPARATE_GRAPH': stages = SeperateGraphStages; break;
    case 'REMOVE_FILL_COLOR': stages = RemoveFillColorStages; break;
    default: stages = FilterStages; break;
  }
  startTimeline(id, stages);
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
}
export function appendTransitionTimeline(id: string, title: string, stages: TransitionAttr[], isTransition: boolean) {

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
}

export function removePrevChart(CHART_REF: any) {
  d3.select(CHART_REF)
    .selectAll('div')
    .remove();
}

export function removeAxes(id: ActionableID) {
  selectRootSVG(id).selectAll('.axis').remove();
  selectRootSVG(id).selectAll('.grid').remove();
  selectRootSVG(id).selectAll('.axis-label').remove();
}
export function renderAxes(id: ActionableID, spec: FacetedCompositeUnitSpec, schema: Schema, data: any[], isTransition: boolean) {
  removeAxes(id);

  let svg = selectRootSVG(id);
  const xField = spec.encoding.x['field'], yField = spec.encoding.y['field'];
  const isColumnUsing = isColumnFieldUsing(spec), {columnField} = getColumnField(spec);
  const categories = isColumnUsing ? getDomainWithFilteredData(data, columnField) : [];

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

  const numOfCategory = getNumberOfGraphs(spec, schema, data);

  // title
  if (isColumnFieldUsing) {
    svg.append('text')
      .classed('axis-label', true)
      .attr('transform', translate(((CHART_MARGIN.left + CHART_SIZE.width + CHART_MARGIN.right + CHART_PADDING.right) * numOfCategory - CHART_MARGIN.right) / 2, 7))
      .attr('opacity', 0)
      .text(columnField)
      .style('font-weight', 'bold')
      .transition().duration(isTransition && id == 'SEPARATE_GRAPH' ? SeperateGraphStages[0].duration : 0)
      .attr('opacity', 1)
  }

  for (let i = 0; i < numOfCategory; i++) {

    if (isColumnFieldUsing) {
      svg.append('text')
        .classed('axis-label', true)
        .attr('transform', translate((CHART_MARGIN.left + CHART_SIZE.width + CHART_MARGIN.right + CHART_PADDING.right) * i + (CHART_MARGIN.left + CHART_SIZE.width + CHART_MARGIN.right) / 2, 20))
        .attr('opacity', 0)
        .text(categories[i])
        .style('font-size', 12 + 'px')
        .transition().duration(isTransition && id == 'SEPARATE_GRAPH' ? SeperateGraphStages[0].duration : 0)
        .attr('opacity', 1)
    }

    svg.append('g')
      .classed('grid', true)
      .attr('transform', translate(CHART_MARGIN.left, CHART_SIZE.height + CHART_MARGIN.top))
      .call(xGrid)
      .transition().duration(isTransition && id == 'SEPARATE_GRAPH' ? SeperateGraphStages[0].duration : 0)
      .attr('transform', translate((CHART_MARGIN.left + CHART_SIZE.width + CHART_MARGIN.right + CHART_PADDING.right) * i + CHART_MARGIN.left,
        CHART_SIZE.height + CHART_MARGIN.top))

    svg.append('g')
      .classed('grid', true)
      .attr('transform', 'translate(' + (CHART_MARGIN.left) + ',' + (CHART_MARGIN.top) + ')')
      .call(yGrid)
      .transition().duration(isTransition && id == 'SEPARATE_GRAPH' ? SeperateGraphStages[0].duration : 0)
      .attr('transform', translate((CHART_MARGIN.left + CHART_SIZE.width + CHART_MARGIN.right + CHART_PADDING.right) * i + CHART_MARGIN.left, CHART_MARGIN.top))


    let xaxis = svg.append('g')
      .classed('axis', true)
      .attr('stroke', '#888888')
      .attr('stroke-width', 0.5)
      .attr('transform', translate(CHART_MARGIN.left, CHART_SIZE.height + CHART_MARGIN.top))
      .call(xAxis)

    xaxis
      .transition().duration(isTransition && id == 'SEPARATE_GRAPH' ? SeperateGraphStages[0].duration : 0)
      .attr('transform', translate((CHART_MARGIN.left + CHART_SIZE.width + CHART_MARGIN.right + CHART_PADDING.right) * i + CHART_MARGIN.left, CHART_SIZE.height + CHART_MARGIN.top));

    xaxis.append('text')
      .classed('label', true)
      .attr('x', CHART_SIZE.width / 2)
      .attr('y', CHART_MARGIN.bottom - 10)
      .style('fill', 'black')
      .style('font-weight', 'bold')
      .style('font-family', 'sans-serif')
      .style('font-size', 12 + 'px')
      .style('text-anchor', 'middle')
      .text(xField)

    let yaxis = svg.append('g')
      .classed('axis', true)
      .attr('stroke', '#888888')
      .attr('stroke-width', 0.5)
      .attr('transform', translate(CHART_MARGIN.left, CHART_MARGIN.top))
      .call(yAxis)

    yaxis
      .transition().duration(isTransition && id == 'SEPARATE_GRAPH' ? SeperateGraphStages[0].duration : 0)
      .attr('transform', translate((CHART_MARGIN.left + CHART_SIZE.width + CHART_MARGIN.right + CHART_PADDING.right) * i + CHART_MARGIN.left, CHART_MARGIN.top))

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
      .text(yField)
  }
}

export function appendPoints(id: string, data: any[]) {
  selectRootSVG(id).selectAll('.point')
    .data(data)
    .enter().append('rect')
    .classed('point', true)
}

export function removeLegend(id: ActionableID) {
  selectRootSVG(id).selectAll('.legend').remove();
}
// export type LegendType = 'NOMINAL' | 'QUANTITATIVE' | 'DENSITYPLOT';
export function getDomainWithFilteredData(data: any[], field: string) {
  return d3.map(data, d => d[field]).keys();
}

// https://bl.ocks.org/mbostock/7f5f22524bd1d824dd53c535eda0187f
export function showContourInD3Chart(id: string, spec: FacetedCompositeUnitSpec, data: any[]) {
  let svg = selectRootSVG(id);

  let xField = spec.encoding.x['field'];
  let yField = spec.encoding.y['field'];

  let x = d3.scaleLinear()
    .domain([0, d3.max(data, function (d) {return d[xField]})] as number[]).nice()
    .range([0, CHART_SIZE.width])
  let y = d3.scaleLinear()
    .domain([0, d3.max(data, function (d) {return d[yField]})] as number[]).nice()
    .range([CHART_SIZE.height, 0])

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
    .attr('opacity', 0.05)
}
export function hideContourInD3Chart(id: string) {
  selectRootSVG(id).selectAll('.contour').remove()
}