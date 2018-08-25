import {GuidelineItemTypes, GuidelineItemActionableCategories, ActionableID, GuidelineItemOverPlotting} from "../models/guidelines";
import {ReduxAction} from "./redux-action";
import {DateTime} from "vega-lite/build/src/datetime";

export type GuidelineAction = GuidelineRemoveItem | GuidelineAddItem | ActionableSelectCategories | GuidelineShowIndicator |
  GuidelineHideIndicator | GuidelineToggleIgnoreItem | GuidelineToggleIsExpanded | ActionableTriggerInterface |
  ActionableModifyOneOfCategories | GuidelineSetUserActionType | ActionableAdjustPointSize | ActionableAdjustPointOpacity;

export const GUIDELINE_ADD_ITEM = 'GUIDELINE_ADD_ITEM';
export type GuidelineAddItem = ReduxAction<typeof GUIDELINE_ADD_ITEM, {
  item: GuidelineItemTypes
}>;

export const GUIDELINE_REMOVE_ITEM = 'GUIDELINE_REMOVE_ITEM';
export type GuidelineRemoveItem = ReduxAction<typeof GUIDELINE_REMOVE_ITEM, {
  item: GuidelineItemTypes;
}>;

export const GUIDELINE_TOGGLE_IGNORE_ITEM = 'GUIDELINE_TOGGLE_IGNORE_ITEM';
export type GuidelineToggleIgnoreItem = ReduxAction<typeof GUIDELINE_TOGGLE_IGNORE_ITEM, {
  item: GuidelineItemTypes;
}>;

export const GUIDELINE_SET_USER_ACTION_TYPE = 'GUIDELINE_SET_USER_ACTION_TYPE';
export type GuidelineSetUserActionType = ReduxAction<typeof GUIDELINE_SET_USER_ACTION_TYPE, {
  item: GuidelineItemTypes;
  type: ActionableID;
}>;

export const GUIDELINE_SHOW_RECT_INDICATOR = 'GUIDELINE_SHOW_RECT_INDICATOR';
export type GuidelineShowIndicator = ReduxAction<typeof GUIDELINE_SHOW_RECT_INDICATOR, {
  size: {width: number, height: number},
  position: {x: number, y: number}
}>;

export const GUIDELINE_HIDE_INDICATOR = 'GUIDELINE_HIDE_INDICATOR';
export type GuidelineHideIndicator = ReduxAction<typeof GUIDELINE_HIDE_INDICATOR, {}>;

export const GUIDELINE_TOGGLE_ISEXPANDED = 'GUIDELINE_TOGGLE_ISEXPANDED';
export type GuidelineToggleIsExpanded = ReduxAction<typeof GUIDELINE_TOGGLE_ISEXPANDED, {
  item: GuidelineItemTypes;
}>;

///
export const ACTIONABLE_ADJUST_POINT_SIZE = 'ACTIONABLE_ADJUST_POINT_SIZE';
export type ActionableAdjustPointSize = ReduxAction<typeof ACTIONABLE_ADJUST_POINT_SIZE, {
  item: GuidelineItemOverPlotting,
  pointSize: number
}>;

export const ACTIONABLE_ADJUST_POINT_OPACITY = 'ACTIONABLE_ADJUST_POINT_OPACITY';
export type ActionableAdjustPointOpacity = ReduxAction<typeof ACTIONABLE_ADJUST_POINT_OPACITY, {
  item: GuidelineItemOverPlotting,
  pointOpacity: number
}>;

export const ACTIONABLE_SELECT_CATEGORIES = 'ACTIONABLE_SELECT_CATEGORIES';
export type ActionableSelectCategories = ReduxAction<typeof ACTIONABLE_SELECT_CATEGORIES, {
  item: GuidelineItemActionableCategories,
  selectedCategories: string[] | number[] | boolean[] | DateTime[]
}>;

export const ACTIONABLE_MODIFY_ONE_OF_CATEGORIES = 'ACTIONABLE_MODIFY_ONE_OF_CATEGORIES';
export type ActionableModifyOneOfCategories = ReduxAction<typeof ACTIONABLE_MODIFY_ONE_OF_CATEGORIES, {
  item: GuidelineItemActionableCategories,
  oneOfCategories: string[] | number[] | boolean[] | DateTime[]
}>;

export const ACTIONABLE_TRIGGER_INTERFACE = 'ACTIONABLE_TRIGGER_INTERFACE';
export type ActionableTriggerInterface = ReduxAction<typeof ACTIONABLE_TRIGGER_INTERFACE, {
  item: GuidelineItemActionableCategories,
  triggeredActionable: string
}>;