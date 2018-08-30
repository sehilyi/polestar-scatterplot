import {ReduxAction} from './redux-action';
import {StudySetting} from '../models/study';

export type StudySettingAction = StudySettingChange;

export const STUDY_SETTING_CHANGE = 'STUDY_SETTING_CHANGE';
export type StudySettingChange = ReduxAction<typeof STUDY_SETTING_CHANGE, StudySetting>;