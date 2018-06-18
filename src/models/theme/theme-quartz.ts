import { Config as VgConfig } from 'vega-typings';
import {defaultFont} from './theme-common';

export type Config = VgConfig;

const markColor = '#ab5787';
const axisColor = '#979797';

const quartzTheme: Config = {
  background: '#f9f9f9',

  arc: { fill: markColor },
  area: { fill: markColor },
  line: { stroke: markColor },
  path: { stroke: markColor },
  rect: { fill: markColor },
  shape: { stroke: markColor },
  symbol: { fill: markColor, size: 30 },

  axis: {
    domainColor: axisColor,
    domainWidth: 0.5,
    gridWidth: 0.2,
    labelColor: axisColor,
    tickColor: axisColor,
    tickWidth: 0.2,
    titleColor: axisColor,
    titleFont: defaultFont,
    labelFont: defaultFont,
  },

  axisBand: {
    grid: false,
  },

  axisX: {
    grid: true,
    tickSize: 10,
  },

  axisY: {
    domain: false,
    grid: true,
    tickSize: 0,
  },

  legend: {
    labelFontSize: 11,
    padding: 1,
    symbolSize: 30,
    symbolType: 'square',
    labelFont: defaultFont,
    titleFont: defaultFont,
  },

  range: {
    category: [
      '#ab5787',
      '#51b2e5',
      '#703c5c',
      '#168dd9',
      '#d190b6',
      '#00609f',
      '#d365ba',
      '#154866',
      '#666666',
      '#c4c4c4',
    ],
  },
};

export default quartzTheme;