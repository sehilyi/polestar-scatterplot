import {GuidelineItem} from "../models/guidelines";
import {ReduxAction} from "./redux-action";

export type GuidelineAction = GuidelineRemoveItem | GuidelineAddItem;

export const GUIDELINE_ADD_ITEM = 'GUIDELINE_ADD_ITEM';
export type GuidelineAddItem = ReduxAction<typeof GUIDELINE_ADD_ITEM, {
  item: GuidelineItem
}>;

export const GUIDELINE_REMOVE_ITEM = 'GUIDELINE_REMOVE_ITEM';
export type GuidelineRemoveItem = ReduxAction<typeof GUIDELINE_REMOVE_ITEM, {
  item: GuidelineItem;
}>;

///

export type ActionableAction = ActionableRemoveCategories;

export const ACTIONABLE_REMOVE_CATEGORIES = 'ACTIONABLE_REMOVE_CATEGORIES';
export type ActionableRemoveCategories = ReduxAction<typeof ACTIONABLE_REMOVE_CATEGORIES, {
  categoreis: string[]
}>;