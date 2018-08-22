import {Action} from "../actions";
import {DEFAULT_GUIDELINES, Guidelines, GuidelineItem, GuideState} from "../models/guidelines";
import {GUIDELINE_REMOVE_ITEM, GUIDELINE_ADD_ITEM, ACTIONABLE_SELECT_CATEGORIES, GUIDELINE_SHOW_RECT_INDICATOR, GUIDELINE_HIDE_INDICATOR, GUIDELINE_TOGGLE_IGNORE_ITEM, GUIDELINE_TOGGLE_ISEXPANDED, ACTIONABLE_TRIGGER_INTERFACE, ACTIONABLE_MODIFY_ONE_OF_CATEGORIES, GUIDELINE_SET_USER_ACTION_TYPE, ACTIONABLE_ADJUST_POINT_SIZE, ACTIONABLE_ADJUST_POINT_OPACITY} from "../actions/guidelines";
import {modifyItemInArray} from "./util";

export function guidelineReducer(guidelines: Guidelines = DEFAULT_GUIDELINES, action: Action): Guidelines {
  const {list, showHighlight, size, position} = guidelines;

  switch (action.type) {
    case GUIDELINE_ADD_ITEM: {
      const {item} = action.payload;
      const index = list.map(function (e) {return e.id;}).indexOf(item.id);

      if (index == -1) //list.splice(index, 1);  //This guideline can be only one
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
      if(index != -1)
        list.splice(index, 1);

      return {
        list,
        showHighlight: false,
        size: size,
        position: position
      };
    }
    case GUIDELINE_TOGGLE_IGNORE_ITEM: {
      const {item} = action.payload;
      const index = list.map(function (e) {return e.id;}).indexOf(item.id);
      const modifyOneOf = (item: GuidelineItem) => {
        return {
          ...item,
          guideState: item.guideState == "IGNORE" ? "WARN" as GuideState : "IGNORE" as GuideState,
          isApplied: item.guideState == "IGNORE" ? true : false
        };
      };

      return {
        list: modifyItemInArray(list, index, modifyOneOf),
        showHighlight: showHighlight,
        size: size,
        position: position
      };
    }
    case GUIDELINE_SET_USER_ACTION_TYPE: {
      const {item, type} = action.payload;
      const index = list.map(function (e) {return e.id;}).indexOf(item.id);
      const modifyOneOf = (item: GuidelineItem) => {
        return {
          ...item,
          userActionType: type
        };
      };

      return {
        list: modifyItemInArray(list, index, modifyOneOf),
        showHighlight: showHighlight,
        size: size,
        position: position
      };
    }
    //TODO: remove when not needed anymore
    case GUIDELINE_TOGGLE_ISEXPANDED: {
      const {item} = action.payload;
      const index = list.map(function (e) {return e.id;}).indexOf(item.id);
      const modifyOneOf = (item: GuidelineItem) => {
        return {
          ...item
        };
      };

      return {
        list: modifyItemInArray(list, index, modifyOneOf),
        showHighlight: showHighlight,
        size: size,
        position: position
      };
    }
    case GUIDELINE_SHOW_RECT_INDICATOR: {
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
    case ACTIONABLE_ADJUST_POINT_SIZE: {
      const {item, pointSize} = action.payload;
      const index = list.map(function (e) {return e.id;}).indexOf(item.id);
      const modifyOneOf = (item: GuidelineItem) => {
        return {
          ...item,
          pointSize
        };
      };
      return {
        list: modifyItemInArray(list, index, modifyOneOf),
        showHighlight: showHighlight,
        size: size,
        position: position
      };
    }
    case ACTIONABLE_ADJUST_POINT_OPACITY: {
      const {item, pointOpacity} = action.payload;
      const index = list.map(function (e) {return e.id;}).indexOf(item.id);
      const modifyOneOf = (item: GuidelineItem) => {
        return {
          ...item,
          pointOpacity
        };
      };
      return {
        list: modifyItemInArray(list, index, modifyOneOf),
        showHighlight: showHighlight,
        size: size,
        position: position
      };
    }
    case ACTIONABLE_SELECT_CATEGORIES: {
      const {item, selectedCategories} = action.payload;
      const index = list.map(function (e) {return e.id;}).indexOf(item.id);
      const modifyOneOf = (item: GuidelineItem) => {
        return {
          ...item,
          selectedCategories: selectedCategories,
          guideState: (selectedCategories.length > 0 && selectedCategories.length <= 10) ? "DONE" : "WARN" as GuideState
        };
      };
      return {
        list: modifyItemInArray(list, index, modifyOneOf),
        showHighlight: showHighlight,
        size: size,
        position: position
      };
    }
    case ACTIONABLE_MODIFY_ONE_OF_CATEGORIES: {
      const {item, oneOfCategories} = action.payload;
      const index = list.map(function (e) {return e.id;}).indexOf(item.id);
      const modifyOneOf = (item: GuidelineItem) => {
        return {
          ...item,
          oneOfCategories: oneOfCategories,
          guideState: (oneOfCategories.length > 0 && oneOfCategories.length <= 10) ? "DONE" : "WARN" as GuideState
        };
      };
      return {
        list: modifyItemInArray(list, index, modifyOneOf),
        showHighlight: showHighlight,
        size: size,
        position: position
      };
    }
    //TODO: remove when not needed anymore
    case ACTIONABLE_TRIGGER_INTERFACE: {
      const {item, triggeredActionable} = action.payload;
      const index = list.map(function (e) {return e.id;}).indexOf(item.id);
      const modifyOneOf = (item: GuidelineItem) => {
        return {
          ...item,
          triggeredActionable: triggeredActionable
        };
      };
      return {
        list: modifyItemInArray(list, index, modifyOneOf),
        showHighlight: showHighlight,
        size: size,
        position: position
      };
    }
  }

  return guidelines;
}