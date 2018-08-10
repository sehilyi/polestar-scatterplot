import * as d3 from 'd3';
import {FacetedCompositeUnitSpec, TopLevelExtendedSpec} from '../../node_modules/vega-lite/build/src/spec';
import {BaseType, select} from 'd3';

// Basic property for d3-chart
export const COMMON_DURATION: number = 1000;
export const CHART_SIZE = {width: 200, height: 200};
export const CHART_MARGIN = {top: 20, right: 20, bottom: 50, left: 50};
export const LEGEND_WIDTH = 100;


export function selectRootSVG(): d3.Selection<BaseType, {}, HTMLElement, any> {
  return d3.select('#d3-chart-specified').select('svg');
}

export function appendRootSVG(CHART_REF: any) {
  d3.select(CHART_REF)
    .append('div')
    .attr('class', 'd3-chart')
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
    .attr('class', 'grid')
    .attr("transform", "translate(" + CHART_MARGIN.left + ',' + (CHART_SIZE.height + CHART_MARGIN.top) + ")")
    .call(xGrid);

  svg.append('g')
    .attr('class', 'grid')
    .attr('transform', 'translate(' + CHART_MARGIN.left + ',' + CHART_MARGIN.top + ')')
    .call(yGrid);

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + CHART_MARGIN.left + ',' + (CHART_SIZE.height + CHART_MARGIN.top) + ")")
    .attr('stroke', '#888888')
    .attr('stroke-width', 0.5)
    .call(xAxis)
    .append("text")
    .attr("class", "label")
    .attr('x', CHART_SIZE.width / 2)
    .attr("y", CHART_MARGIN.bottom - 10)
    .style('fill', 'black')
    .style('font-weight', 'bold')
    .style('font-family', 'sans-serif')
    .style('font-size', 11)
    .style("text-anchor", "middle")
    .text(xField);

  svg.append("g")
    .attr("class", "axis")
    .attr('transform', 'translate(' + CHART_MARGIN.left + ',' + CHART_MARGIN.top + ')')
    .attr('stroke', '#888888')
    .attr('stroke-width', 0.5)
    .call(yAxis)
    .append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("x", -CHART_SIZE.width / 2)
    .attr("y", -50)
    .attr("dy", ".71em")
    .style('font-weight', 'bold')
    .style('font-family', 'sans-serif')
    .style('font-size', 11)
    .style('fill', 'black')
    .style("text-anchor", "middle")
    .text(yField);
}

export function appendPoints(data: any[]) {
  selectRootSVG().selectAll('.point')
    .data(data)
    .enter().append('rect')
    .attr('class', 'point');
}

export function setPointsAttrs(spec: FacetedCompositeUnitSpec, data: any[], duration?: number) {
  let xField = spec.encoding.x['field'];
  let yField = spec.encoding.y['field'];

  let fill = spec.mark == 'point' ? 'transparent' : '#4c78a8',
    opacity = 0.7,
    stroke = '#4c78a8', //TODO: consider when color is used
    shape = spec.mark == 'square' ? 'rect' : 'circle',
    stroke_width = spec.mark == 'point' ? 2 : 2;  //TODO: do we have to handle this?

  let x = d3.scaleLinear()
    .domain([0, d3.max(data, function (d) {return d[xField]})] as number[]).nice()
    .range([0, CHART_SIZE.width]);
  let y = d3.scaleLinear()
    .domain([0, d3.max(data, function (d) {return d[yField]})] as number[]).nice()
    .range([CHART_SIZE.height, 0]);

  selectRootSVG()
    .selectAll('.point')
    .transition().duration(duration)
    .attr('stroke-width', stroke_width)
    .attr('fill', fill)
    .attr('opacity', opacity)
    .attr('stroke', stroke)
    //circle vs rect
    .attr('width', shape == 'circle' ? 6 : 5)
    .attr('height', shape == 'circle' ? 6 : 5)
    .attr('x', function (d) {return (x(d[xField]) + ((shape == 'circle' ? -3 : -2.5) + CHART_MARGIN.left));})
    .attr('y', function (d) {return (y(d[yField]) + ((shape == 'circle' ? -3 : -2.5) + CHART_MARGIN.top));})
    .attr('rx', shape == 'circle' ? 6 : 0)
    .attr('ry', shape == 'circle' ? 6 : 0);
}
export function renderD3Chart(CHART_REF: any, spec: FacetedCompositeUnitSpec, data: any[]) {
  //
  console.log('spec for d3:');
  console.log(spec);
  //
  appendRootSVG(CHART_REF);
  appendAxes(spec, data);
  appendPoints(data);
  setPointsAttrs(spec, data);
}

export function onPreviewReset(spec: FacetedCompositeUnitSpec, values: any[], duration?: number) {
  selectRootSVG()
    .selectAll('.remove-when-reset')
    .transition().duration(duration)
    .attr('opacity', 0).remove();
  setPointsAttrs(spec, values, duration);
}