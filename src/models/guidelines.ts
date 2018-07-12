import {DateTime} from "vega-lite/build/src/datetime";
import {EncodingShelfProps} from "../components/encoding-pane/encoding-shelf";
import {ShelfFieldDef, filterHasField, filterIndexOf} from "./shelf";
import {OneOfFilter} from "vega-lite/build/src/filter";
import {SPEC_FIELD_REMOVE, SPEC_FIELD_ADD, SPEC_FIELD_MOVE, FILTER_MODIFY_ONE_OF} from "../actions";
import {COLOR} from "vega-lite/build/src/channel";
import {GUIDELINE_REMOVE_ITEM, GUIDELINE_ADD_ITEM} from "../actions/guidelines";
import {OneOfFilterShelfProps} from "../components/filter-pane/one-of-filter-shelf";

export type GuideState = "WARN" | "DONE" | "IGNORE";
export type guidelineIds = "GUIDELINE_TOO_MANY_CATEGORIES" | "GUIDELINE_NONE";

export interface Guidelines {
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

  isExpanded: boolean;
  guideState: GuideState;

  //TODO:
  selectedCategories: string[] | number[] | boolean[] | DateTime[];
  triggeredActionable: string;
}

export const DEFAULT_GUIDELINES: Guidelines = {
  list: [],

  showHighlight: false,
  size: {width: 0, height: 0},
  position: {x: 0, y: 0}
}

export const GUIDELINE_TOO_MANY_CATEGORIES: GuidelineItem = {
  id: "GUIDELINE_TOO_MANY_CATEGORIES",
  category: 'Too Many Categories',
  title: 'Select at most 10 categories to highlight.',
  content: '',

  isExpanded: false,
  guideState: "WARN",
  selectedCategories: [],
  triggeredActionable: "NONE"
}


//TODO: make this process more systematic
//This logic should move to model class

//1) every guideline must have their own id
/*
 * USED BY)
 * ActionableCategory,
 */
export function guideActionShelf(props: EncodingShelfProps, fieldDef: ShelfFieldDef, type: string) {
  const {filters} = props;
  let domain, field = (fieldDef != null ? fieldDef.field.toString() : '');
  if (fieldDef != null) domain = props.schema.domain({field});

  //Actionable Category Part
  const domainWithFilter = (filterHasField(filters, field) ?
    (filters[filterIndexOf(filters, field)] as OneOfFilter).oneOf : domain);

  switch (type) {
    case SPEC_FIELD_REMOVE:
      if (props.id.channel == COLOR) {
        props.handleAction({
          type: GUIDELINE_REMOVE_ITEM,
          payload: {
            item: GUIDELINE_TOO_MANY_CATEGORIES
          }
        });
      }
      break;
    case SPEC_FIELD_ADD:
    case SPEC_FIELD_MOVE:
      if (props.id.channel == COLOR && domainWithFilter.length > 10 && fieldDef.type == "nominal") {
        props.handleAction({
          type: GUIDELINE_ADD_ITEM,
          payload: {
            item: GUIDELINE_TOO_MANY_CATEGORIES
          }
        });
      } else if (props.id.channel == COLOR) {
        props.handleAction({
          type: GUIDELINE_REMOVE_ITEM,
          payload: {
            item: GUIDELINE_TOO_MANY_CATEGORIES
          }
        });
      }
      break;
  }
}

/*
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
        else{
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