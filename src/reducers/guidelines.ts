import {Action} from "../actions";
import {DEFAULT_GUIDELINES, Guidelines} from "../models/guidelines";
import {GUIDELINE_REMOVE_ITEM} from "../actions/guidelines";

export function guidelineReducer(guidelines: Guidelines = DEFAULT_GUIDELINES, action: Action): Guidelines {
  const {list} = guidelines;

  switch (action.type) {
    case GUIDELINE_REMOVE_ITEM:
      const {item} = action.payload;

      const specKey = JSON.stringify(item);
      const {[specKey]: _, ...newDict} = list;
      console.log('here?');
      return {
        list: newDict,
      };
  }

  return guidelines;
}