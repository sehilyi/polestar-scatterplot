
import {FacetedCompositeUnitSpec} from 'vega-lite/build/src/spec';
import {ShelfFieldDef, ShelfFunction, ShelfId, ShelfMark} from '../../models';
import {Action} from '../index';
import {PlainReduxAction, ReduxAction} from '../redux-action';
import {Scale} from 'vega-lite/build/src/scale';
import {Transform} from 'vega-lite/build/src/transform';

export type SpecAction =
  SpecClear |
  SpecMarkChangeType |
  SpecEncodingAction;

export type SpecEncodingAction = SpecFieldAdd | SpecFieldAutoAdd |
  SpecFieldRemove | SpecFieldMove |
  SpecFieldPropChange<any> | SpecFieldNestedPropChange<any, any> |
  SpecFunctionChange |
  SpecFunctionAddWildcard | SpecFunctionRemoveWildcard |
  SpecFunctionDisableWildcard | SpecFunctionEnableWildcard |
  SpecLoad |
  SpecColorScaleSpecified | SpecColorTransformSpecified |
  // Guideline for over-plotting
  SpecToDensityPlot | SpecAggregatePointsByColor | SpecPointSizeSpecified |
  SpecUnaggregatePointsByColor | SpecToRemoveDensityPlot;

export const SPEC_CLEAR = 'SPEC_CLEAR';
export type SpecClear = PlainReduxAction<typeof SPEC_CLEAR>;

export const SPEC_MARK_CHANGE_TYPE = 'SPEC_MARK_CHANGE_TYPE';
export type SpecMarkChangeType = ReduxAction<typeof SPEC_MARK_CHANGE_TYPE, ShelfMark>;

// Field

export const SPEC_FIELD_ADD = 'SPEC_FIELD_ADD';
export type SpecFieldAdd = ReduxAction<typeof SPEC_FIELD_ADD, {
  shelfId: ShelfId;
  fieldDef: ShelfFieldDef;
  replace: boolean;
}>;

export const SPEC_TO_DENSITY_PLOT = 'SPEC_TO_DENSITY_PLOT';
export type SpecToDensityPlot = PlainReduxAction<typeof SPEC_TO_DENSITY_PLOT>;

export const SPEC_TO_REMOVE_DENSITY_PLOT = 'SPEC_TO_REMOVE_DENSITY_PLOT';
export type SpecToRemoveDensityPlot = PlainReduxAction<typeof SPEC_TO_REMOVE_DENSITY_PLOT>;

export const SPEC_AGGREGATE_POINTS_BY_COLOR = 'SPEC_AGGREGATE_POINTS_BY_COLOR';
export type SpecAggregatePointsByColor = ReduxAction<typeof SPEC_AGGREGATE_POINTS_BY_COLOR, {
  shelfId: ShelfId;
  fieldDef: ShelfFieldDef;
  replace: boolean;
}>;

export const SPEC_UNAGGREGATE_POINTS_BY_COLOR = 'SPEC_UNAGGREGATE_POINTS_BY_COLOR';
export type SpecUnaggregatePointsByColor = PlainReduxAction<typeof SPEC_UNAGGREGATE_POINTS_BY_COLOR>;

export const SPEC_COLOR_SCALE_SPECIFIED = 'SPEC_COLOR_SCALE_SPECIFIED';
export type SpecColorScaleSpecified = ReduxAction<typeof SPEC_COLOR_SCALE_SPECIFIED, {
  fieldDef: ShelfFieldDef;
}>;

export const SPEC_POINT_SIZE_SPECIFIED = 'SPEC_POINT_SIZE_SPECIFIED';
export type SpecPointSizeSpecified = ReduxAction<typeof SPEC_POINT_SIZE_SPECIFIED, number>;

export const SPEC_COLOR_TRANSFORM_SPECIFIED = 'SPEC_COLOR_TRANSFORM_SPECIFIED';
export type SpecColorTransformSpecified = ReduxAction<typeof SPEC_COLOR_TRANSFORM_SPECIFIED, {
  transform: Transform;
  fieldDef: ShelfFieldDef;
}>;

export const SPEC_FIELD_AUTO_ADD = 'SPEC_FIELD_AUTO_ADD';
export type SpecFieldAutoAdd = ReduxAction<typeof SPEC_FIELD_AUTO_ADD, {
  fieldDef: ShelfFieldDef;
}>;

export const SPEC_FIELD_REMOVE = 'SPEC_FIELD_REMOVE';
export type SpecFieldRemove = ReduxAction<typeof SPEC_FIELD_REMOVE, ShelfId>;


export const SPEC_FIELD_MOVE = 'SPEC_FIELD_MOVE';
export type SpecFieldMove = ReduxAction<typeof SPEC_FIELD_MOVE, {
  from: ShelfId,
  to: ShelfId
}>;

/**
 * Change a property of a FieldDef to a specific value.
 */
export const SPEC_FIELD_PROP_CHANGE = 'SPEC_FIELD_PROP_CHANGE';
export type SpecFieldPropChange<
  P extends 'sort' // TODO: 'stack' | 'format'
  > = ReduxAction<typeof SPEC_FIELD_PROP_CHANGE, {
    shelfId: ShelfId;
    prop: P;
    value: ShelfFieldDef[P];
  }>;

/**
 * Change nested property of a FieldDef to a specific value.
 */
export const SPEC_FIELD_NESTED_PROP_CHANGE = 'SPEC_FIELD_NESTED_PROP_CHANGE';
export type SpecFieldNestedPropChange<
  P extends 'scale' | 'axis' | 'legend',
  N extends (keyof ShelfFieldDef[P])
  > = ReduxAction<typeof SPEC_FIELD_NESTED_PROP_CHANGE, {
    shelfId: ShelfId,
    prop: P,
    nestedProp: N,
    value: ShelfFieldDef[P][N]
  }>;

/**
 * Change Function of a FieldDef to a specific value.
 */
export const SPEC_FUNCTION_CHANGE = 'SPEC_FUNCTION_CHANGE';
export type SpecFunctionChange = ReduxAction<typeof SPEC_FUNCTION_CHANGE, {
  shelfId: ShelfId,
  fn: ShelfFunction;
}>;

export const SPEC_FUNCTION_ADD_WILDCARD = 'SPEC_FUNCTION_ADD_WILDCARD';
export type SpecFunctionAddWildcard = ReduxAction<typeof SPEC_FUNCTION_ADD_WILDCARD, {
  shelfId: ShelfId,
  fn: ShelfFunction
}>;

export const SPEC_FUNCTION_DISABLE_WILDCARD = 'SPEC_FUNCTION_DISABLE_WILDCARD';
export type SpecFunctionDisableWildcard = ReduxAction<typeof SPEC_FUNCTION_DISABLE_WILDCARD, {
  shelfId: ShelfId
}>;

export const SPEC_FUNCTION_ENABLE_WILDCARD = 'SPEC_FUNCTION_ENABLE_WILDCARD';
export type SpecFunctionEnableWildcard = ReduxAction<typeof SPEC_FUNCTION_ENABLE_WILDCARD, {
  shelfId: ShelfId
}>;

export const SPEC_FUNCTION_REMOVE_WILDCARD = 'SPEC_FUNCTION_REMOVE_WILDCARD';
export type SpecFunctionRemoveWildcard = ReduxAction<typeof SPEC_FUNCTION_REMOVE_WILDCARD, {
  shelfId: ShelfId,
  fn: ShelfFunction
}>;

export const SPEC_LOAD = 'SPEC_LOAD';
export type SpecLoad = ReduxAction<typeof SPEC_LOAD, {
  spec: FacetedCompositeUnitSpec,
  keepWildcardMark: boolean
}>;

export const SPEC_ACTION_TYPE_INDEX: {[k in SpecAction['type']]: 1} = {
  SPEC_CLEAR: 1,
  SPEC_LOAD: 1,
  SPEC_MARK_CHANGE_TYPE: 1,

  SPEC_FIELD_ADD: 1,
  SPEC_COLOR_SCALE_SPECIFIED: 1,
  SPEC_POINT_SIZE_SPECIFIED: 1,
  SPEC_COLOR_TRANSFORM_SPECIFIED: 1,
  SPEC_FIELD_AUTO_ADD: 1,
  SPEC_FIELD_MOVE: 1,
  SPEC_FIELD_PROP_CHANGE: 1,
  SPEC_FIELD_NESTED_PROP_CHANGE: 1,
  SPEC_FIELD_REMOVE: 1,

  SPEC_TO_DENSITY_PLOT: 1,
  SPEC_TO_REMOVE_DENSITY_PLOT: 1,
  SPEC_AGGREGATE_POINTS_BY_COLOR: 1,
  SPEC_UNAGGREGATE_POINTS_BY_COLOR: 1,

  SPEC_FUNCTION_CHANGE: 1,
  SPEC_FUNCTION_ADD_WILDCARD: 1,
  SPEC_FUNCTION_DISABLE_WILDCARD: 1,
  SPEC_FUNCTION_ENABLE_WILDCARD: 1,
  SPEC_FUNCTION_REMOVE_WILDCARD: 1
};

export function isSpecAction(a: Action): a is SpecAction {
  return SPEC_ACTION_TYPE_INDEX[a.type];
}
