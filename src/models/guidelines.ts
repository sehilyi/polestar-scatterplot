import {GuideCategories, GuidelineCategoriesUI} from "../components/guide-pane/guidelines/guide-categories";
import {PureComponent} from "react";
import {GuideUI} from "../components/guide-pane/guidelines/guide-ui";

export interface Guidelines{
  list: GuidelineItem[];
}

export interface GuidelineItem {
  title: string;
  content?: string;

  category?: string;
  isIgnored?: boolean;

  interactive?: GuideUI; //a react element containing interactive customizer
}

export const DEFAULT_GUIDELINES: Guidelines = {
  list: []
}

export const GUIDELINE_TOO_MANY_CATEGORIES: GuidelineItem = {
  title: 'Too many categories',
  category: 'Visual Encoding',
  content: 'Too many categories are used in the chart. To make a better visualization in terms of recognition speed and accuracy, you should reduce the number of categories.',
  interactive: GuidelineCategoriesUI
}