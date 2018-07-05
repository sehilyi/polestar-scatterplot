import {GuidelineItem} from "../models/guidelines";
import {ReduxAction} from "./redux-action";
import {DateTime} from "vega-lite/build/src/datetime";

export type GuidelineAction = GuidelineRemoveItem | GuidelineAddItem | ActionableSelectCategories;

export const GUIDELINE_ADD_ITEM = 'GUIDELINE_ADD_ITEM';
export type GuidelineAddItem = ReduxAction<typeof GUIDELINE_ADD_ITEM, {
  item: GuidelineItem
}>;

export const GUIDELINE_REMOVE_ITEM = 'GUIDELINE_REMOVE_ITEM';
export type GuidelineRemoveItem = ReduxAction<typeof GUIDELINE_REMOVE_ITEM, {
  item: GuidelineItem;
}>;

///

// export type ActionableAction = ActionableSelectCategories;

export const ACTIONABLE_SELECT_CATEGORIES = 'ACTIONABLE_SELECT_CATEGORIES';
export type ActionableSelectCategories = ReduxAction<typeof ACTIONABLE_SELECT_CATEGORIES, {
  item: GuidelineItem,
  selectedCategories: string[] | number[] | boolean[] | DateTime[]
}>;