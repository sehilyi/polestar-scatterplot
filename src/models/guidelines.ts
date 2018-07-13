import {DateTime} from "vega-lite/build/src/datetime";
import {EncodingShelfProps} from "../components/encoding-pane/encoding-shelf";
import {ShelfFieldDef, filterHasField, filterIndexOf} from "./shelf";
import {OneOfFilter, RangeFilter} from "vega-lite/build/src/filter";
import {SPEC_FIELD_REMOVE, SPEC_FIELD_ADD, SPEC_FIELD_MOVE, FILTER_MODIFY_ONE_OF, FilterAction, SpecAction} from "../actions";
import {COLOR, Channel} from "vega-lite/build/src/channel";
import {GUIDELINE_REMOVE_ITEM, GUIDELINE_ADD_ITEM, GuidelineAction} from "../actions/guidelines";
import {OneOfFilterShelfProps} from "../components/filter-pane/one-of-filter-shelf";

export type GuideState = "WARN" | "DONE" | "IGNORE";
export type guidelineIds = "GUIDELINE_TOO_MANY_CATEGORIES" | "GUIDELINE_NONE";
export type GuidelineItemTypes = GuidelineItemActionableCategories | GuidelineItem;

//Thresholds
export const CATEGORY_THRESHOLD = 10;

export interface Guidelines {
  list: GuidelineItemTypes[];

  showHighlight: boolean;
  size: {width: number, height: number},
  position: {x: number, y: number}
}

export interface GuidelineItem {
  id: guidelineIds;
  category?: string;
  title: string;
  content?: string;
  guideState: GuideState; //TODO: move to state
}

//TODO: Later, this could be more systematic, including all kinds of actionables in all guidelines
export type Actionables = "FILTER_CATEGORIES" | "SELECT_CATEGORIES" | "REMOVE_FIELD" | "NONE";
export interface GuidelineItemActionableCategories extends GuidelineItem {
  selectedCategories: string[] | number[] | boolean[] | DateTime[];
  oneOfCategories: string[] | number[] | boolean[] | DateTime[];
  userActionType: Actionables;
}

export const DEFAULT_GUIDELINES: Guidelines = {
  list: [],

  showHighlight: false,
  size: {width: 0, height: 0},
  position: {x: 0, y: 0}
}

export const GUIDELINE_TOO_MANY_CATEGORIES: GuidelineItemActionableCategories = {
  id: "GUIDELINE_TOO_MANY_CATEGORIES",
  category: 'Too Many Categories',
  title: 'Select at most 10 categories to highlight.',
  content: '',
  guideState: "WARN",

  selectedCategories: [],
  oneOfCategories: [],
  userActionType: "NONE"
}

//TODO: Be more smart for picking defaults by perhaps considering metadata
export function getDefaultCategoryPicks(domain: string[] | number[] | boolean[] | DateTime[]): any[] {
  return domain.length > CATEGORY_THRESHOLD ? domain.slice(0, 7) : domain.slice();
}

  //TODO: Any better algorithm for this?
export function getRange(selected: string[] | number[] | boolean[] | DateTime[], domain: string[] | number[] | boolean[] | DateTime[]): string[] {
  const p = ["#4c78a8", "#f58518", "#e45756", "#72b7b2", "#54a24b", "#eeca3b", "#b279a2", "#ff9da6", "#9d755d", "#bab0ac55"]; //TODO: auto get colors from library
  const r = [];
  let round = 0;
  for (let i of domain) {
    r.push((((selected as any[]).indexOf(i) !== -1) ? p[round++] : p[p.length - 1]));
    if (round >= p.length - 1) round = 0;
  }
  return r;
}

/**
 * USED BY)
 * ActionableCategory,
 */
export function guideActionShelf(
  field: string,
  fieldType: string,
  channel: Channel,
  domain: any[],
  filters: Array<RangeFilter | OneOfFilter>,
  actionType: string,
  handleAction: (action: GuidelineAction | FilterAction | SpecAction) => void) {

  //Actionable Category Part
  const domainWithFilter = (filterHasField(filters, field) ?
    (filters[filterIndexOf(filters, field)] as OneOfFilter).oneOf : domain);

  switch (actionType) {
    case SPEC_FIELD_REMOVE:
      if (channel == COLOR) {
        handleAction({
          type: GUIDELINE_REMOVE_ITEM,
          payload: {
            item: GUIDELINE_TOO_MANY_CATEGORIES
          }
        });
      }
      break;
    case SPEC_FIELD_ADD:
    case SPEC_FIELD_MOVE:
      if (channel == COLOR && domainWithFilter.length > 10 && fieldType == "nominal") {
        handleAction({
          type: GUIDELINE_ADD_ITEM,
          payload: {
            item: GUIDELINE_TOO_MANY_CATEGORIES
          }
        });
      } else if (channel == COLOR) {
        handleAction({
          type: GUIDELINE_REMOVE_ITEM,
          payload: {
            item: GUIDELINE_TOO_MANY_CATEGORIES
          }
        });
      }
      break;
  }
}

/**
 * USED BY)
 * ActionableCategory,
 */
export function guideActionFilter(props: OneOfFilterShelfProps, oneOf: string[] | number[] | boolean[] | DateTime[], type: string) {
  const {spec, filter} = props;
  switch (type) {
    case FILTER_MODIFY_ONE_OF: {
      if (typeof spec.encoding != 'undefined' && typeof spec.encoding.color != 'undefined' &&
        spec.encoding.color.field == filter.field) {
        if (oneOf.length > 10) {
          props.handleAction({
            type: GUIDELINE_ADD_ITEM,
            payload: {
              item: GUIDELINE_TOO_MANY_CATEGORIES
            }
          });
        }
        else {
          props.handleAction({
            type: GUIDELINE_REMOVE_ITEM,
            payload: {
              item: GUIDELINE_TOO_MANY_CATEGORIES
            }
          })
        }
      }
      else {} // do nothing
      break;
    }
  }
}