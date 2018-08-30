// [P]review, [T]ext, [A]nimated transition
export type STUDY_CONDITION = 'P' | 'T' | 'A' | 'PT' | 'PA' | 'TA' | 'PTA';
export const STUDY_CONDITIONS = ['P', 'T', 'A', 'PT', 'PA', 'TA', 'PTA'];

export interface StudySetting {
  condition: STUDY_CONDITION;
  actionOrderSeed: number;
  isConditionSelected: boolean;
  isSeedSelected: boolean;
  log: string;
};

export const DEFAULT_STUDY_SETTING: StudySetting = {
  condition: 'PTA',
  actionOrderSeed: 1,
  isConditionSelected: false,
  isSeedSelected: false,
  log: ''
}

export function GET_RAMDOM_ORDERED_ACTIONS(array: any[], seed: number) {
  if (array.length != 7) throw 'Number of actions for over-plotting problems are not equal to the expected.';

  const _1 = array[0];
  const _2 = array[1];
  const _3 = array[2];
  const _4 = array[3];
  const _5 = array[4];
  const _6 = array[5];
  const _7 = array[6];

  if (seed == 1) return [_1, _5, _7, _3, _6, _4, _2];
  else if (seed == 2) return [_6, _2, _7, _5, _1, _3, _4];
  else if (seed == 3) return [_5, _2, _4, _7, _6, _1, _3];
  else if (seed == 4) return [_1, _7, _6, _4, _3, _5, _2];
  else if (seed == 5) return [_2, _7, _6, _1, _4, _3, _5];
  else if (seed == 6) return [_1, _4, _3, _6, _5, _7, _2];
  else if (seed == 7) return [_1, _7, _2, _4, _5, _3, _6];
  else if (seed == 8) return [_4, _7, _2, _6, _5, _1, _3];
  else if (seed == 9) return [_3, _5, _2, _4, _7, _1, _6];
  else if (seed == 10) return [_7, _6, _3, _4, _5, _1, _2];
  else if (seed == 11) return [_2, _7, _3, _4, _5, _6, _1];
  else if (seed == 12) return [_7, _4, _1, _3, _2, _6, _5];
  else if (seed == 13) return [_3, _7, _5, _1, _6, _4, _2];
  else if (seed == 14) return [_1, _7, _6, _2, _5, _4, _3];
  else if (seed == 15) return [_3, _4, _7, _2, _5, _1, _6];
  else if (seed == 16) return [_1, _3, _5, _4, _7, _2, _6];
  else if (seed == 17) return [_6, _7, _3, _1, _2, _4, _5];
  else if (seed == 18) return [_2, _7, _6, _4, _1, _3, _5];
  else if (seed == 19) return [_7, _5, _3, _1, _6, _2, _4];
  else if (seed == 20) return [_1, _4, _7, _5, _6, _3, _2];
  else if (seed == 21) return [_2, _3, _5, _7, _4, _1, _6];
  else if (seed == 22) return [_7, _2, _5, _3, _6, _4, _1];
  else if (seed == 23) return [_5, _4, _2, _6, _3, _7, _1];
  else if (seed == 24) return [_5, _4, _2, _3, _7, _1, _6];
  else if (seed == 25) return [_4, _1, _5, _7, _3, _6, _2];
  else if (seed == 26) return [_2, _4, _7, _6, _3, _1, _5];
  else if (seed == 27) return [_6, _4, _7, _3, _1, _5, _2];
  else if (seed == 28) return [_2, _5, _4, _6, _7, _3, _1];
  else if (seed == 29) return [_2, _5, _7, _1, _6, _4, _3];
  else if (seed == 30) return [_1, _5, _4, _7, _6, _2, _3];
  else if (seed == 31) return [_7, _3, _2, _1, _4, _6, _5];
  else if (seed == 32) return [_3, _7, _6, _5, _1, _2, _4];
  else if (seed == 33) return [_6, _3, _4, _7, _5, _1, _2];
  else if (seed == 34) return [_2, _6, _7, _5, _3, _1, _4];
  else if (seed == 35) return [_2, _1, _5, _7, _6, _4, _3];
  else if (seed == 36) return [_6, _3, _5, _4, _7, _2, _1];
  else if (seed == 37) return [_2, _1, _3, _4, _7, _6, _5];
  else if (seed == 38) return [_5, _4, _7, _1, _6, _2, _3];
  else if (seed == 39) return [_4, _7, _5, _1, _6, _3, _2];
  else if (seed == 30) return [_4, _3, _5, _1, _7, _6, _2];
  else return array.slice();
}