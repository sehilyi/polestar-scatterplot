import {GuidelineItem} from "../models/guidelines";
import {ReduxAction} from "./redux-action";

export type GuidelineAction = GuidelineRemoveItem;

export const GUIDELINE_REMOVE_ITEM = 'GUIDELINE_REMOVE_ITEM';
export type GuidelineRemoveItem = ReduxAction<typeof GUIDELINE_REMOVE_ITEM, {
  item: GuidelineItem;
}>;