export {isObject, toSet} from 'vega-lite/build/src/util';

export function isNullOrUndefined(x: any) {
  return x == null || typeof x == 'undefined';
}

export function range(n: number) {
  let a = [];
  for(let i = 0; i < n; i++){
    a.push(i);
  }
  return a;
}