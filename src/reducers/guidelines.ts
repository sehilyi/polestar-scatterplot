import {Action} from "../actions";
import {DEFAULT_GUIDELINES, Guidelines, GuidelineItem, GuideState} from "../models/guidelines";
import {GUIDELINE_REMOVE_ITEM, GUIDELINE_ADD_ITEM, ACTIONABLE_SELECT_CATEGORIES} from "../actions/guidelines";
import {modifyItemInArray} from "./util";

export function guidelineReducer(guidelines: Guidelines = DEFAULT_GUIDELINES, action: Action): Guidelines {
  const {list} = guidelines;

  switch (action.type) {
    case GUIDELINE_ADD_ITEM: {
      const {item} = action.payload;
      //TODO: Check if there is same guideline already.
      list.push(item);

      return {
        list: list
      };
    }
    case GUIDELINE_REMOVE_ITEM: {
      const {item} = action.payload;
      list.splice(list.indexOf(item), 1);

      return {
        list: list
      };
    }
    ///
    case ACTIONABLE_SELECT_CATEGORIES: {
      const {item, selectedCategories} = action.payload;
      const modifyOneOf = (item: GuidelineItem) => {
        return {
          ...item,
          selectedCategories: selectedCategories,
          guideState: (selectedCategories.length > 0 && selectedCategories.length <= 10) ? "DONE" : "WARN" as GuideState
        };
      };
      return {
        list: [
          ...list.slice(0, list.indexOf(item)),
          modifyOneOf(list[list.indexOf(item)]),
          ...list.slice(list.indexOf(item) + 1)
        ]
      };
    }
  }

  return guidelines;
}

export function modifyItemInArray1<GuidelineItem>(array: GuidelineItem[], index: number, modifier: (t: GuidelineItem) => GuidelineItem) {
  return [
    ...array.slice(0, index),
    modifier(array[index]),
    ...array.slice(index + 1)
  ];
}