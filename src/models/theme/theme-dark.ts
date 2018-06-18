import { Config as VgConfig } from 'vega-typings';
import {defaultFont} from './theme-common';

export type Config = VgConfig;

const lightColor = '#fff';
const medColor = '#aaa';

const darkTheme: Config = {
  background: '#333',

  title: { color: lightColor },

  style: {
    'guide-label': {
      fill: lightColor,
    },
    'guide-title': {
      fill: lightColor,
    },
  },

  axis: {
    domainColor: lightColor,
    gridColor: medColor,
    tickColor: lightColor,
    titleFont: defaultFont,
    labelFont: defaultFont,
  },

  legend: {
    labelFont: defaultFont,
    titleFont: defaultFont,
  },
};

export default darkTheme;