import {getTopSpecQueryItem} from 'compassql/build/src/model';
import {recommend} from 'compassql/build/src/recommend';
import {Schema} from 'compassql/build/src/schema';
import {isWildcard, SHORT_WILDCARD} from 'compassql/build/src/wildcard';
import {FieldDef} from 'vega-lite/build/src/fielddef';
import {Action} from '../../actions';
import {
  SPEC_CLEAR, SPEC_FIELD_ADD, SPEC_FIELD_MOVE,
  SPEC_FIELD_REMOVE, SPEC_FUNCTION_CHANGE, SPEC_FUNCTION_ENABLE_WILDCARD, SPEC_MARK_CHANGE_TYPE
} from '../../actions/shelf';
import {
  SPEC_FUNCTION_ADD_WILDCARD, SPEC_FUNCTION_DISABLE_WILDCARD,
  SPEC_FUNCTION_REMOVE_WILDCARD
} from '../../actions/shelf';
import {SPEC_FIELD_NESTED_PROP_CHANGE, SPEC_FIELD_PROP_CHANGE, SpecFieldAutoAdd, SPEC_TO_REMOVE_DENSITY_PLOT, SPEC_COLOR_SCALE_SPECIFIED, SPEC_POINT_SIZE_SPECIFIED, SPEC_COLOR_TRANSFORM_SPECIFIED, SPEC_TO_DENSITY_PLOT, SPEC_AGGREGATE_POINTS_BY_COLOR, SPEC_UNAGGREGATE_POINTS_BY_COLOR} from '../../actions/shelf/spec';
import {isWildcardChannelId} from '../../models';
import {ShelfAnyEncodingDef, ShelfFieldDef, ShelfId, ShelfUnitSpec} from '../../models/shelf';
import {sortFunctions} from '../../models/shelf';
import {autoAddFieldQuery} from '../../models/shelf';
import {DEFAULT_SHELF_UNIT_SPEC, fromSpecQuery} from '../../models/shelf/spec';
import {insertItemToArray, modifyItemInArray, removeItemFromArray} from '../util';
import {COLOR, X, Y, SIZE} from 'vega-lite/build/src/channel';
import {Scale} from 'vega-lite/build/src/scale';
import {Transform} from 'vega-lite/build/src/transform';
import {QUANTITATIVE} from '../../../node_modules/vega-lite/build/src/type';
import {SQUARE, CIRCLE} from 'vega-lite/build/src/mark';

export function shelfSpecFieldAutoAddReducer(
  shelfSpec: Readonly<ShelfUnitSpec>, action: SpecFieldAutoAdd, schema: Schema
): ShelfUnitSpec {
  const {fieldDef} = action.payload;

  if (shelfSpec.anyEncodings.length > 0 || isWildcard(fieldDef.field)) {
    // If there was an encoding shelf or if the field is a wildcard, just add to wildcard shelf
    return {
      ...shelfSpec,
      anyEncodings: [
        ...shelfSpec.anyEncodings,
        {
          channel: SHORT_WILDCARD,
          ...fieldDef
        }
      ]
    };
  } else {
    // Otherwise, query for the best encoding if there is no wildcard channel
    const query = autoAddFieldQuery(shelfSpec, fieldDef);
    const rec = recommend(query, schema);
    const topSpecQuery = getTopSpecQueryItem(rec.result).specQuery;

    return {
      ...fromSpecQuery(topSpecQuery, shelfSpec.config),
      // retain auto-mark if mark is previously auto
      ...(isWildcard(shelfSpec.mark) ? {mark: shelfSpec.mark} : {})
    };
  }
}

export function shelfSpecReducer(
  shelfSpec: Readonly<ShelfUnitSpec> = DEFAULT_SHELF_UNIT_SPEC,
  action: Action
): ShelfUnitSpec {
  switch (action.type) {
    case SPEC_CLEAR:
      return DEFAULT_SHELF_UNIT_SPEC;

    case SPEC_MARK_CHANGE_TYPE: {
      const mark = action.payload;
      return {
        ...shelfSpec,
        mark
      };
    }

    case SPEC_TO_DENSITY_PLOT: {
      return {
        ...shelfSpec,
        mark: SQUARE,
        encoding: {
          ...shelfSpec.encoding,
          [COLOR]: {
            fn: 'count',
            field: '*',
            type: QUANTITATIVE,
            scale: {scheme: 'blues'}
          },
          [X]: {
            ...shelfSpec.encoding[X],
            fn: 'bin'
          },
          [Y]: {
            ...shelfSpec.encoding[Y],
            fn: 'bin'
          }
        }
      };
    }
    case SPEC_TO_REMOVE_DENSITY_PLOT: {
      delete shelfSpec.encoding.color;
      delete shelfSpec.encoding.x.fn;
      delete shelfSpec.encoding.y.fn;
      return {
        ...shelfSpec,
        mark: CIRCLE
      };
    }
    case SPEC_UNAGGREGATE_POINTS_BY_COLOR: {
      delete shelfSpec.encoding.color;
      delete shelfSpec.encoding.x.fn;
      delete shelfSpec.encoding.y.fn;
      return {
        ...shelfSpec
      };
    }
    case SPEC_AGGREGATE_POINTS_BY_COLOR: {
      const {shelfId, fieldDef, replace} = action.payload;
      return {
        ...shelfSpec,
        encoding: {
          ...shelfSpec.encoding,
          [shelfId.channel as string]: fieldDef,
          x: {
            ...shelfSpec.encoding.x,
            fn: 'mean'
          },
          y: {
            ...shelfSpec.encoding.y,
            fn: 'mean'
          }
        }
      };
    }

    case SPEC_FIELD_ADD: {
      const {shelfId, fieldDef, replace} = action.payload;
      return addEncoding(shelfSpec, shelfId, fieldDef, replace);
    }

    case SPEC_FIELD_REMOVE:
      return removeEncoding(shelfSpec, action.payload).shelf;

    case SPEC_FIELD_MOVE: {
      const {to, from} = action.payload;

      const {fieldDef: fieldDefFrom, shelf: removedShelf1} = removeEncoding(shelfSpec, from);
      const {fieldDef: fieldDefTo, shelf: removedShelf2} = removeEncoding(removedShelf1, to);

      const addedShelf1 = addEncoding(removedShelf2, to, fieldDefFrom, false);
      const addedShelf2 = addEncoding(addedShelf1, from, fieldDefTo, false);

      return addedShelf2;
    }

    case SPEC_COLOR_SCALE_SPECIFIED: {
      const {fieldDef} = action.payload;
      return addScaleToColor(shelfSpec, fieldDef);
    }

    // //TODO: make sure if this is okay with other than scatterplot
    // case SPEC_POINT_SIZE_SPECIFIED: {
    //   const value = action.payload;
    //   return modifyPointSize(shelfSpec, value);
    // }

    case SPEC_COLOR_TRANSFORM_SPECIFIED: {
      const {fieldDef, transform} = action.payload;
      return addTransformAndNewColor(shelfSpec, fieldDef, transform);
    }

    case SPEC_FIELD_PROP_CHANGE: {
      const {shelfId, prop, value} = action.payload;
      return modifyEncoding(shelfSpec, shelfId, (fieldDef: Readonly<ShelfFieldDef | ShelfAnyEncodingDef>) => {
        return modifyFieldProp(fieldDef, prop, value);
      });
    }

    case SPEC_FIELD_NESTED_PROP_CHANGE: {
      const {shelfId, prop, nestedProp, value} = action.payload;
      return modifyEncoding(shelfSpec, shelfId, (fieldDef: Readonly<ShelfFieldDef | ShelfAnyEncodingDef>) => {
        return modifyNestedFieldProp(fieldDef, prop, nestedProp, value);
      });
    }

    case SPEC_FUNCTION_CHANGE: {
      const {shelfId, fn} = action.payload;
      return modifyEncoding(shelfSpec, shelfId, (fieldDef: Readonly<ShelfFieldDef | ShelfAnyEncodingDef>) => {
        return {
          ...fieldDef,
          fn: fn
        };
      });
    }

    case SPEC_FUNCTION_ADD_WILDCARD: {
      const {shelfId, fn} = action.payload;
      return modifyEncoding(shelfSpec, shelfId, (fieldDef: Readonly<ShelfFieldDef | ShelfAnyEncodingDef>) => {
        const {fn: oldFn, ...fieldDefWithoutFn} = fieldDef;

        return {
          ...fieldDefWithoutFn,
          fn: {
            enum: sortFunctions(oldFn['enum'].concat(fn))
          }
        };
      });
    }

    case SPEC_FUNCTION_DISABLE_WILDCARD: {
      const {shelfId} = action.payload;
      return modifyEncoding(shelfSpec, shelfId, (fieldDef: Readonly<ShelfFieldDef | ShelfAnyEncodingDef>) => {
        const {fn, ...fieldDefWithoutFn} = fieldDef;

        if (isWildcard(fn)) {
          return {
            ...fieldDefWithoutFn,
            ...fn.enum.length > 0 ? {fn: fn.enum[0]} : {}
          };
        } else {
          throw Error('fn must be a wildcard to disable wildcard');
        }
      });
    }

    case SPEC_FUNCTION_ENABLE_WILDCARD: {
      const {shelfId} = action.payload;
      return modifyEncoding(shelfSpec, shelfId, (fieldDef: Readonly<ShelfFieldDef | ShelfAnyEncodingDef>) => {
        const {fn, ...fieldDefWithoutFn} = fieldDef;
        return {
          ...fieldDefWithoutFn,
          fn: {
            enum: [fn]
          }
        };
      });
    }

    case SPEC_FUNCTION_REMOVE_WILDCARD: {
      const {shelfId, fn} = action.payload;
      return modifyEncoding(shelfSpec, shelfId, (fieldDef: Readonly<ShelfFieldDef | ShelfAnyEncodingDef>) => {
        const {fn: oldFn, ...fieldDefWithoutFn} = fieldDef;

        if (isWildcard(oldFn)) {
          return {
            ...fieldDefWithoutFn,
            fn: {
              enum: oldFn.enum.filter(shelfFunc => shelfFunc !== fn)
            }
          };
        } else {
          throw Error('fn must be a wildcard to remove a wildcard');
        }
      });
    }
  }
  return shelfSpec;
}

function addEncoding(shelf: Readonly<ShelfUnitSpec>, shelfId: ShelfId, fieldDef: ShelfFieldDef, replace: boolean) {
  if (!fieldDef) {
    return shelf;
  } else if (isWildcardChannelId(shelfId)) {
    const index = shelfId.index;

    if (replace && shelf.anyEncodings[index]) {
      return {
        ...shelf,
        anyEncodings: modifyItemInArray<ShelfAnyEncodingDef>(shelf.anyEncodings, index, () => {
          return {
            channel: SHORT_WILDCARD,
            ...fieldDef
          };
        })
      };
    }

    // insert between two pills (not replace!)
    return {
      ...shelf,
      anyEncodings: insertItemToArray<ShelfAnyEncodingDef>(shelf.anyEncodings, index, {
        channel: SHORT_WILDCARD,
        ...fieldDef
      })
    };
  } else {
    return {
      ...shelf,
      encoding: {
        ...shelf.encoding,
        [shelfId.channel]: fieldDef
      }
    };
  }
}

function addScaleToColor(shelf: Readonly<ShelfUnitSpec>, fieldDef: ShelfFieldDef) {
  return {
    ...shelf,
    encoding: {
      ...shelf.encoding,
      [COLOR]: fieldDef
    }
  };
}

function addTransformAndNewColor(shelf: Readonly<ShelfUnitSpec>, fieldDef: ShelfFieldDef, transform: Transform) {
  return {
    ...shelf,
    transform: transform,
    encoding: {
      ...shelf.encoding,
      [COLOR]: fieldDef
    }
  };
}

type ShelfFieldDefModifier<T extends ShelfFieldDef> = (fieldDef: Readonly<T>) => T;

function modifyEncoding(shelf: Readonly<ShelfUnitSpec>, shelfId: ShelfId, modifier: ShelfFieldDefModifier<any>) {
  if (isWildcardChannelId(shelfId)) {
    return {
      ...shelf,
      anyEncodings: modifyItemInArray<ShelfAnyEncodingDef>(shelf.anyEncodings, shelfId.index, modifier)
    };
  } else {
    return {
      ...shelf,
      encoding: {
        ...shelf.encoding,
        [shelfId.channel]: modifier(shelf.encoding[shelfId.channel])
      }
    };
  }
}


function removeEncoding(shelf: Readonly<ShelfUnitSpec>, shelfId: ShelfId): {fieldDef: ShelfFieldDef, shelf: Readonly<ShelfUnitSpec>} {

  if (isWildcardChannelId(shelfId)) {
    const index = shelfId.index;
    const {array: anyEncodings, item} = removeItemFromArray(shelf.anyEncodings, index);

    if (item) {
      // Remove channel from the removed EncodingQuery if the removed shelf is not empty.
      const {channel: _, ...fieldDef} = item;

      return {
        fieldDef,
        shelf: {
          ...shelf,
          anyEncodings
        }
      };
    } else {
      return {
        fieldDef: undefined,
        shelf: {
          ...shelf,
          anyEncodings
        }
      };
    }
  } else {
    const {[shelfId.channel]: fieldDef, ...encoding} = shelf.encoding;
    return {
      fieldDef,
      shelf: {
        ...shelf,
        encoding: encoding
      }
    };
  }
}

export type AnyFieldDef = ShelfFieldDef | ShelfAnyEncodingDef | FieldDef<any>;

export function modifyFieldProp(
  fieldDef: Readonly<AnyFieldDef>,
  prop: string,
  value: any
): Readonly<AnyFieldDef> {
  const {[prop]: _oldProp, ...fieldDefWithoutProp} = fieldDef;
  return {
    ...fieldDefWithoutProp,
    ...(value !== undefined ? {[prop]: value} : {})
  };
}

export function modifyNestedFieldProp(
  fieldDef: Readonly<AnyFieldDef>,
  prop: string,
  nestedProp: string,
  value: any
): Readonly<AnyFieldDef> {
  const {[prop]: oldParent, ...fieldDefWithoutProp} = fieldDef;
  const {[nestedProp]: _oldValue, ...parentWithoutNestedProp} = oldParent || {};
  const parent = {
    ...parentWithoutNestedProp,
    ...(value !== undefined ? {[nestedProp]: value} : {})
  };
  return {
    ...fieldDefWithoutProp,
    ...(Object.keys(parent).length > 0 ? {[prop]: parent} : {})
  };
}
