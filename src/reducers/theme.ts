import {THEME_CHANGE, Action} from "../actions";
import {Themes, DEFAULT_THEME} from "../models/theme";
import {VegaTheme} from "../components/header/theme";

//TODO: Refer RelatedViews
export function themeReducer(
  themeChanger: Themes = DEFAULT_THEME, action: Action): Themes {
  switch (action.type) {
    case THEME_CHANGE: {
      const newTheme: VegaTheme = action.payload;
      return {
        theme: newTheme
      };
    }
  }

  return themeChanger;
}