export {isObject, toSet} from 'vega-lite/build/src/util';

export function isNullOrUndefined(x: any){
  return x == null || typeof x == 'undefined';
}