import {Action} from "../actions";
import {DEFAULT_GUIDELINES, Guidelines, GuidelineItem, GuideState} from "../models/guidelines";
import {GUIDELINE_REMOVE_ITEM, GUIDELINE_ADD_ITEM, ACTIONABLE_SELECT_CATEGORIES, GUIDELINE_SHOW_INDICATOR, GUIDELINE_HIDE_INDICATOR, GUIDELINE_TOGGLE_IGNORE_ITEM, GUIDELINE_TOGGLE_ISEXPANDED} from "../actions/guidelines";
import {modifyItemInArray} from "./util";

export function guidelineReducer(guidelines: Guidelines = DEFAULT_GUIDELINES, action: Action): Guidelines {
  const {list, showHighlight, size, position} = guidelines;

  switch (action.type) {
    case GUIDELINE_ADD_ITEM: {
      const {item} = action.payload;
      const index = list.map(function (e) {return e.id;}).indexOf(item.id);
      if (index != -1) list.splice(index, 1);  //This guideline can be only one
      list.push(item);

      return {
        list: list,
        showHighlight: showHighlight,
        size: size,
        position: position
      };
    }
    case GUIDELINE_REMOVE_ITEM: {
      const {item} = action.payload;
      const index = list.map(function (e) {return e.id;}).indexOf(item.id);
      list.splice(index, 1);

      return {
        list: list,
        showHighlight: false,
        size: size,
        position: position
      };
    }
    case GUIDELINE_TOGGLE_IGNORE_ITEM: {
      const {item} = action.payload;
      const modifyOneOf = (item: GuidelineItem) => {
        return {
          ...item,
          guideState: item.guideState == "IGNORE" ? "WARN" as GuideState : "IGNORE" as GuideState,
          isExpanded: item.guideState == "WARN" ? false : item.isExpanded
        };
      };

      return {
        list: [
          ...list.slice(0, list.indexOf(item)),
          modifyOneOf(list[list.indexOf(item)]),
          ...list.slice(list.indexOf(item) + 1)
        ],
        showHighlight: showHighlight,
        size: size,
        position: position
      };
    }
    case GUIDELINE_TOGGLE_ISEXPANDED: {
      const {item} = action.payload;
      const modifyOneOf = (item: GuidelineItem) => {
        return {
          ...item,
          isExpanded: !item.isExpanded
        };
      };

      return {
        list: [
          ...list.slice(0, list.indexOf(item)),
          modifyOneOf(list[list.indexOf(item)]),
          ...list.slice(list.indexOf(item) + 1)
        ],
        showHighlight: showHighlight,
        size: size,
        position: position
      };
    }
    case GUIDELINE_SHOW_INDICATOR: {
      const {size, position} = action.payload;
      return {
        list: list,
        showHighlight: true,
        size: size,
        position: position
      };
    }
    case GUIDELINE_HIDE_INDICATOR: {
      return {
        list: list,
        showHighlight: false,
        size: size,
        position: position
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
        ],
        showHighlight: showHighlight,
        size: size,
        position: position
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