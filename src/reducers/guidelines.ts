import {Action} from "../actions";
import {DEFAULT_GUIDELINES, Guidelines} from "../models/guidelines";
import {GUIDELINE_REMOVE_ITEM, GUIDELINE_ADD_ITEM} from "../actions/guidelines";

export function guidelineReducer(guidelines: Guidelines = DEFAULT_GUIDELINES, action: Action): Guidelines {
  const {list} = guidelines;

  switch (action.type) {
    case GUIDELINE_ADD_ITEM: {
      const {item} = action.payload;
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
  }

  return guidelines;
}