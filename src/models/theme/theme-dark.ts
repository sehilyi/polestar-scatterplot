import { Config as VgConfig } from 'vega-typings';

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
  },
};

export default darkTheme;