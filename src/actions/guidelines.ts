import {GuidelineItem} from "../models/guidelines";
import {ReduxAction} from "./redux-action";
import {DateTime} from "vega-lite/build/src/datetime";

export type GuidelineAction = GuidelineRemoveItem | GuidelineAddItem | ActionableSelectCategories | GuidelineShowIndicator | GuidelineHideIndicator | GuidelineToggleIgnoreItem;

export const GUIDELINE_ADD_ITEM = 'GUIDELINE_ADD_ITEM';
export type GuidelineAddItem = ReduxAction<typeof GUIDELINE_ADD_ITEM, {
  item: GuidelineItem
}>;

export const GUIDELINE_REMOVE_ITEM = 'GUIDELINE_REMOVE_ITEM';
export type GuidelineRemoveItem = ReduxAction<typeof GUIDELINE_REMOVE_ITEM, {
  item: GuidelineItem;
}>;

export const GUIDELINE_TOGGLE_IGNORE_ITEM = 'GUIDELINE_TOGGLE_IGNORE_ITEM';
export type GuidelineToggleIgnoreItem = ReduxAction<typeof GUIDELINE_TOGGLE_IGNORE_ITEM, {
  item: GuidelineItem;
}>;

export const GUIDELINE_SHOW_INDICATOR = 'ACTIONABLE_SHOW_INDICATOR';
export type GuidelineShowIndicator = ReduxAction<typeof GUIDELINE_SHOW_INDICATOR, {
  size: {width: number, height: number},
  position: {x: number, y: number}
}>;

export const GUIDELINE_HIDE_INDICATOR = 'ACTIONABLE_HIDE_INDICATOR';
export type GuidelineHideIndicator = ReduxAction<typeof GUIDELINE_HIDE_INDICATOR, {}>;

///

export const ACTIONABLE_SELECT_CATEGORIES = 'ACTIONABLE_SELECT_CATEGORIES';
export type ActionableSelectCategories = ReduxAction<typeof ACTIONABLE_SELECT_CATEGORIES, {
  item: GuidelineItem,
  selectedCategories: string[] | number[] | boolean[] | DateTime[]
}>;