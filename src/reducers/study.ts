import {StudySetting, DEFAULT_STUDY_SETTING} from "../models/study";
import {Action} from "../actions";
import {STUDY_SETTING_CHANGE} from "../actions/study";

export function studyReducer(
  studySettingChanger: StudySetting = DEFAULT_STUDY_SETTING, action: Action): StudySetting {
  switch (action.type) {
    case STUDY_SETTING_CHANGE: {
      const prop = action.payload;
      return {
        condition: prop.condition,
        actionOrderSeed: prop.actionOrderSeed,
        isConditionSelected: prop.isConditionSelected,
        isSeedSelected: prop.isSeedSelected,
        log: prop.log
      };
    }
  }
  return studySettingChanger;
}