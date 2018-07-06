import {DateTime} from "vega-lite/build/src/datetime";

export type GuideState = "WARN" | "DONE" | "IGNORE";

export interface Guidelines{
  list: GuidelineItem[];

  showHighlight: boolean;
  size: {width: number, height: number},
  position: {x: number, y: number}
}

export interface GuidelineItem {
  id: guidelineIds;
  category?: string;
  title: string;
  content?: string;

  guideState: GuideState;
  selectedCategories: string[] | number[] | boolean[] | DateTime[];
}

export const DEFAULT_GUIDELINES: Guidelines = {
  list: [],

  showHighlight: false,
  size: {width: 0, height: 0},
  position: {x: 0, y: 0}
}

export type guidelineIds = "GUIDELINE_TOO_MANY_CATEGORIES" | "GUIDELINE_NONE";

export const GUIDELINE_TOO_MANY_CATEGORIES: GuidelineItem = {
  id: "GUIDELINE_TOO_MANY_CATEGORIES",
  category: 'Too Many Categories',
  title: 'Select at most 10 categories to highlight.',
  content: '',

  guideState: "WARN",
  selectedCategories: []
}