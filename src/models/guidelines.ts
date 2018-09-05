import {DateTime} from "vega-lite/build/src/datetime";
import {filterHasField, filterIndexOf, ShelfFilter} from "./shelf";
import {OneOfFilter, RangeFilter} from "vega-lite/build/src/filter";
import {SPEC_FIELD_REMOVE, SPEC_FIELD_ADD, SPEC_FIELD_MOVE, FILTER_MODIFY_ONE_OF, FilterAction, SpecAction} from "../actions";
import {COLOR, Channel, SHAPE} from "vega-lite/build/src/channel";
import {GUIDELINE_REMOVE_ITEM, GUIDELINE_ADD_ITEM, GuidelineAction} from "../actions/guidelines";
import {OneOfFilterShelfProps} from "../components/filter-pane/one-of-filter-shelf";
import {NOMINAL, QUANTITATIVE} from "../../node_modules/vega-lite/build/src/type";
import {POINT, CIRCLE, SQUARE, RECT, Mark} from "vega-lite/build/src/mark";
import {FacetedCompositeUnitSpec, TopLevelExtendedSpec} from "vega-lite/build/src/spec";
import {Schema} from "../api/api";
import {encoding} from "../../node_modules/vega-lite";
import {TransitionAttr, COMMON_DURATION, COMMON_SHORT_DELAY} from "./d3-chart";
import {isNullOrUndefined} from "../util";
import d3 = require("d3");

export type GuideState = "WARN" | "TIP" | "DONE" | "IGNORE";
export type guidelineIds = "NEW_CHART_BINNED_SCATTERPLOT" | "GUIDELINE_TOO_MANY_COLOR_CATEGORIES" | "GUIDELINE_TOO_MANY_SHAPE_CATEGORIES" |
  "GUIDELINE_OVER_PLOTTING" | "GUIDELINE_NONE";
export type GuidelineItemTypes = GuidelineItemOverPlotting | GuidelineItemActionableCategories | GuidelineItem;

//Thresholds
export const CATEGORY_THRESHOLD = 10;
export const DEFAULT_CHANGE_POINT_SIZE = 12;

export interface Guidelines {
  list: GuidelineItemTypes[];

  showHighlight: boolean;
  size: {width: number, height: number},
  position: {x: number, y: number}
}

export interface GuidelineItem {
  id: guidelineIds;
  title?: string;
  subtitle: string;
  content?: string;
  guideState: GuideState; //TODO: move to state
  noneIndicator?: boolean;
}

export interface GuidelineItemOverPlotting extends GuidelineItem {
  fieldToSeparate?: string;
  pointSize?: number;
  pointOpacity?: number;
  filled?: boolean;
  // TODO: add more
}

export interface GuidelineItemActionableCategories extends GuidelineItem {
  selectedCategories: string[] | number[] | boolean[] | DateTime[];
  oneOfCategories: string[] | number[] | boolean[] | DateTime[];
  userActionType: ActionableID;
}

export const DEFAULT_GUIDELINES: Guidelines = {
  list: [],

  showHighlight: false,
  size: {width: 0, height: 0},
  position: {x: 0, y: 0}
}

// TODO: should we consider too many categories?
export const GUIDELINE_OVER_PLOTTING: GuidelineItemOverPlotting = {
  id: 'GUIDELINE_OVER_PLOTTING',
  title: 'Is Your Chart Too Cluttered?',
  subtitle: 'Use clutter reduction methods to unveil visual patterns',
  content: 'In some graphs, especially those that use data points or lines to encode data, multiple objects can end up sharing the same space, positioned on top of one another. This makes it difficult or impossible to see the individual values, which in turn makes analysis of the data difficult.',
  guideState: 'TIP',
  noneIndicator: true,

  fieldToSeparate: ''
  // TODO: add more
}

export const NEW_CHART_BINNED_SCATTERPLOT: GuidelineItem = {
  id: "NEW_CHART_BINNED_SCATTERPLOT",
  title: 'Alternative Chart',
  subtitle: 'Binned Scatterplot',
  content: '',
  guideState: "TIP",
  noneIndicator: true
}

export const GUIDELINE_TOO_MANY_COLOR_CATEGORIES: GuidelineItemActionableCategories = {
  id: "GUIDELINE_TOO_MANY_COLOR_CATEGORIES",
  title: 'Too Many Categories For Color',
  subtitle: 'Select at most 10 categories to color',
  content: '',
  guideState: "WARN",

  selectedCategories: [],
  oneOfCategories: [],
  userActionType: "NONE"
}

export const GUIDELINE_TOO_MANY_SHAPE_CATEGORIES: GuidelineItemActionableCategories = {
  id: "GUIDELINE_TOO_MANY_SHAPE_CATEGORIES",
  title: 'Too Many Categories For Shape',
  subtitle: 'Select at most 10 categories to apply shape',
  content: '',
  guideState: "WARN",

  selectedCategories: [],
  oneOfCategories: [],
  userActionType: "NONE"
}

//TODO: Later, this could be more systematic, including all kinds of actionables in all guidelines
export type ActionableID = "FILTER" | "SEPARATE_GRAPH" | "AGGREGATE_POINTS" | 'CHANGE_POINT_SIZE' | 'CHANGE_POINT_OPACITY' | "REMOVE_FILL_COLOR" | "ENCODING_DENSITY" |
  "FILTER_CATEGORIES" | "SELECT_CATEGORIES" | "REMOVE_FIELD" | "NONE" | "NONE2";  //TODO: don't mix with vega-lite types

export interface GuideActionItem {
  title: string;
  subtitle: string;
  faIcon?: string;
  pros?: string;
  cons?: string;
}

export const ACTIONABLE_FILTER_GENERAL: GuideActionItem = {
  title: '필터',
  subtitle: '관심 없는 데이터를 제거해 시각화에 사용되는 점들의 개수를 줄입니다',
  faIcon: 'fa fa-filter',
  pros: '<hl>점의 색깔</hl>을 잘 보여줌 / 큰 데이터에서 효과적임',
  cons: '<hl>관심 없는 데이터</hl>가 미리 정의되어 있어야 함 / 점들의 <hl>밀도</hl>(겹쳐진 정도)를 보여주지 못함 / <hl>정보의 손실</hl>이 있음 (모든 점들을 보여주지 않음)'
}

export const ACTIONABLE_POINT_SIZE: GuideActionItem = {
  title: '점 크기 조절',
  subtitle: '점의 크기를 줄여서 서로 겹치는 면적을 줄입니다',
  faIcon: 'fa fa-compress',
  pros: '<hl>점의 색깔</hl>을 잘 보여줌',
  cons: '점들의 <hl>밀도</hl>(겹쳐진 정도)를 보여주지 못함 / <hl>같은 좌표</hl>에 있는 점들은 여전히 겹침 / <hl>겹친 점들이 많으면</hl> 효과가 적음'
}

export const ACTIONABLE_POINT_OPACITY: GuideActionItem = {
  title: '점 투명도 조절',
  subtitle: '점의 투명도를 조절해서 다른 점들로 인해 가려진 점들도 보이도록 합니다',
  faIcon: 'fa fa-tint',
  pros: '점들의 <hl>밀도</hl>(겹쳐진 정도)를 잘 보여줌',
  cons: '<hl>점의 색깔</hl>이 잘 구분되지 않을 수 있음 / <hl>Outlier</hl>를 잘 보여주지 못함'
}

export const ACTIONABLE_REMOVE_FILL_COLOR: GuideActionItem = {
  title: '점 중앙색 제거',
  subtitle: '점 중앙을 투명하게 해서 서로 겹치는 면적을 줄입니다',
  faIcon: 'fa fa-circle-o',
  pros: '<hl>점의 색깔</hl>을 잘 보여줌',
  cons: '점들의 <hl>밀도</hl>(겹쳐진 정도)를 잘 보여주지 못함 / <hl>겹친 점들이 많으면</hl> 효과가 적음'
}

// TODO: change pros and cons for these four actions
// export const ACTIONABLE_CHANGE_SHAPE: GuideActionItem = {
//   title: 'Change Shape',
//   subtitle: '',
//   faIcon: 'fa fa-square-o',
//   pros: 'Retain data. Can show point attrubute (color/shape)',
//   cons: 'Not scalable to large data. Cannot see overlap density.'
// }

export const ACTIONABLE_AGGREGATE: GuideActionItem = {
  title: '점 합치기',
  subtitle: '카테고리에 따른 평균 좌표를 계산해 카테고리별로 점들을 합칩니다',
  faIcon: 'fa fa-object-group',
  pros: '<hl>점의 색깔</hl>을 잘 보여줌 / <hl>큰 데이터</hl>에서도 효과적임',
  cons: '점들의 <hl>밀도</hl>(겹쳐진 정도)를 보여주지 못함 / <hl>정보의 손실</hl>이 있음 (모든 점들을 보여주지 않음)'
}

export const ACTIONABLE_ENCODING_DENSITY: GuideActionItem = {
  title: '밀도 플롯',
  subtitle: '구간별 점들의 개수를 색깔의 강도로 표현합니다',
  faIcon: 'fa fa-th',
  pros: '점들의 <hl>밀도</hl>(겹쳐진 정도)를 잘 보여줌',
  cons: '색깔이 이미 의미있게 쓰이기 때문에 <hl>색깔</hl>을 <hl>범주형 변수</hl>를 표현하는데 사용될 수 없음 / <hl>Outlier</hl>를 잘 보여주지 못함'
}

export const ACTIONABLE_SEPARATE_GRAPH: GuideActionItem = {
  title: '차트 분리',
  subtitle: '카테고리에 따라 차트를 여러개로 분리합니다',
  faIcon: 'fa fa-clone',
  pros: ' <hl>점의 색깔</hl>을 잘 보여줌 / 큰 데이터에서도 효과적임',
  cons: '점들의 <hl>밀도</hl>(겹쳐진 정도)를 보여주지 못함 / 차트를 그리기 위한 <hl>충분한 공간</hl>이 필요함'
}

export const AggregateStages: TransitionAttr[] = [
  {id: 'COLOR', title: '카테고리로 색칠', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY},
  {id: 'REPOSITION', title: '평균 좌표로 합침', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
];
export const DensityPlotStages: TransitionAttr[] = [
  {id: 'MORPH', title: '사각 마크로 변경', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY},
  {id: 'COLOR', title: '투명도 조절', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY},
  {id: 'REPOSITION', title: '격자형 좌표로 이동', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
];
export const PointOpacityStages: TransitionAttr[] = [
  {id: 'COLOR', title: '투명도 조절', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
]
export const FilterStages: TransitionAttr[] = [
  {id: 'COLOR', title: '카테고리로 필터', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
];
export const PointResizeStages: TransitionAttr[] = [
  {id: 'MORPH', title: '점 크기 조절', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
]
export const RemoveFillColorStages: TransitionAttr[] = [
  {id: 'COLOR', title: '중앙 색 제거', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
];
export const SeperateGraphStages: TransitionAttr[] = [
  {id: 'REPOSITION', title: '카테고리로 차트 분리', duration: COMMON_DURATION, delay: COMMON_SHORT_DELAY}
];

//TODO: Be more smart for picking defaults by perhaps considering metadata
export function getDefaultCategoryPicks(domain: string[] | number[] | boolean[] | DateTime[]): any[] {
  return domain.length > CATEGORY_THRESHOLD ? domain.slice(0, 7) : domain.slice();
}

//TODO: Any better algorithm for this?
export function getRange(selected: string[] | number[] | boolean[] | DateTime[], domain: string[] | number[] | boolean[] | DateTime[]): string[] {
  const p = ["#4c78a8", "#f58518", "#e45756", "#72b7b2", "#54a24b", "#eeca3b", "#b279a2", "#ff9da6", "#9d755d", "#bab0ac55"]; //TODO: auto get colors from library
  const r = [];
  let round = 0;
  for (let i of domain) {
    r.push((((selected as any[]).indexOf(i) !== -1) ? p[round++] : p[p.length - 1]));
    if (round >= p.length - 1) round = 0;
  }
  return r;
}
/**
 * spec, filters, schema, fieldDefs, specPreview, config
 * TODO: Any better way to compare the states?
 */
export function checkGuideline(props: any) {
  // console.log("MainSpec:");
  // console.log(props);

  if (typeof props.spec == "undefined") return; // vega spec is not ready

  const {spec} = props;

  // OVER_PLOTTING
  {
    // TODO: only considering scatterplot for now
    if (isAllowedScatterplot(spec)) {
      addGuidelineItem(GUIDELINE_OVER_PLOTTING, props.handleAction);
    } else {
      removeGuidelineItem(GUIDELINE_OVER_PLOTTING, props.handleAction);
    }
  }

  /*
  // NEW_CHART_BINNED_SCATTERPLOT
  // Added to over-plotting
  {
    try {
      // x and y.type == quantitative && mark == point, circle, or square && size, shape, text, and detail == null
      if (encoding.x.type == QUANTITATIVE && encoding.y.type == QUANTITATIVE &&
        (mark == POINT || mark == CIRCLE || mark == SQUARE) &&
        typeof encoding.size == 'undefined' && typeof encoding.shape == 'undefined' && typeof encoding.text == 'undefined' && typeof encoding.detail == 'undefined') {
        addGuidelineItem(NEW_CHART_BINNED_SCATTERPLOT, props.handleAction);
      } else {removeGuidelineItem(NEW_CHART_BINNED_SCATTERPLOT, props.handleAction);}
    } catch (e) {removeGuidelineItem(NEW_CHART_BINNED_SCATTERPLOT, props.handleAction);}
  }
  */
}
export function handleTooManyCategories(newSpec: FacetedCompositeUnitSpec, itemDetail: GuidelineItemActionableCategories, schema: Schema, isColor: boolean, filters: ShelfFilter[]): FacetedCompositeUnitSpec {
  let field = newSpec.encoding.color["field"].toString();
  const domainWithFilter = (filterHasField(filters, field) ?
    (filters[filterIndexOf(filters, field)] as OneOfFilter).oneOf :
    schema.domain({field}));
  let selected = itemDetail.selectedCategories;
  if (isColor) {
    newSpec.encoding.color = {
      ...newSpec.encoding.color,
      scale: {
        domain: domainWithFilter,
        range: getRange(selected, domainWithFilter)
      }
    }
  } else {
    newSpec.encoding.shape = {
      ...newSpec.encoding.shape,
      scale: {
        domain: domainWithFilter,
        range: getRange(selected, domainWithFilter)
      }
    }
  }
  return newSpec;
}

export function getGuidedSpec(spec: TopLevelExtendedSpec, guidelines: GuidelineItemTypes[], schema: Schema, filters?: ShelfFilter[]): any {
  if (typeof spec == 'undefined') return spec;
  // console.log(spec);
  let newSpec = (JSON.parse(JSON.stringify(spec))) as FacetedCompositeUnitSpec;
  guidelines.forEach(item => {
    const {id} = item;
    switch (id) {
      case "GUIDELINE_TOO_MANY_COLOR_CATEGORIES":
      case "GUIDELINE_TOO_MANY_SHAPE_CATEGORIES": {
        const itemDetail = (item as GuidelineItemActionableCategories);
        if (itemDetail.selectedCategories.length !== 0 && typeof filters != 'undefined')
          newSpec = handleTooManyCategories(newSpec, itemDetail, schema, "GUIDELINE_TOO_MANY_COLOR_CATEGORIES" === id, filters);
        break;
      }
      case "GUIDELINE_OVER_PLOTTING": {
        const itemDetail = (item as GuidelineItemOverPlotting);
        if (typeof itemDetail.pointSize != 'undefined') {
          newSpec.encoding = {
            ...newSpec.encoding,
            size: {value: itemDetail.pointSize}
          }
        }
        if (typeof itemDetail.pointOpacity != 'undefined') {
          newSpec.encoding = {
            ...newSpec.encoding,
            opacity: {value: itemDetail.pointOpacity}
          }
        }
        if (!isNullOrUndefined(itemDetail.filled)) {
          let markType = isNullOrUndefined(newSpec.mark['type']) ? newSpec.mark : newSpec.mark['type'];
          newSpec.mark = itemDetail.filled ? markType as Mark : {
            type: markType as Mark,
            filled: itemDetail.filled
          }
          // console.log(newSpec.mark);
        }
        break;
      }
      default:
        break;
    }
  });

  // HACK to put maxbins if binned for better look and feel
  try {
    if (newSpec.encoding.x['bin'] === true) {
      newSpec.encoding.x['bin'] = {maxbins: 10};
    }
  } catch (e) {}
  try {
    if (newSpec.encoding.y['bin'] === true) {
      newSpec.encoding.y['bin'] = {maxbins: 10};
    }
  } catch (e) {}

  return newSpec;
}

export function isSkipColorOfAggregatePoints(id: ActionableID, fromSpec: any) {
  return id === 'AGGREGATE_POINTS' && isLegendUsing(fromSpec);
}
export function isRowOrColumnUsed(spec: any) {
  const {encoding} = spec;
  if (typeof encoding.row != 'undefined' || typeof encoding.column != 'undefined') {
    return true;
  }
  else {
    return false;
  }
}
export function isRowUsed(spec: any) {
  const {encoding} = spec;
  if (typeof encoding.row != 'undefined') {
    return true;
  }
  else {
    return false;
  }
}
export function getRowAndColumnField(spec: any) {
  const {encoding} = spec;
  let fields: string[] = [];
  if (typeof encoding.row != 'undefined') {
    fields.push(encoding.row.field);
  }
  else if (typeof encoding.column != 'undefined') {
    fields.push(encoding.column.field);
  }
  return fields;
}
export function isColorUsed(spec: any) {
  const {encoding} = spec;
  if (typeof encoding.color != 'undefined') {
    return true;
  }
  else {
    return false;
  }
}
// For D3 chart
export function isAllowedScatterplot(spec: any) {
  if (isSimpleScatterplot(spec)) {
    return true;
  }
  else if (isDensityPlot(spec)) {
    return true;
  }
  else {
    return false;
  }
}

export function isSimpleScatterplot(spec: any) {
  const {encoding, mark} = spec;
  try {
    if (typeof encoding.shape == 'undefined' && typeof encoding.text == 'undefined' &&
      typeof encoding.row == 'undefined' &&
      (typeof encoding.size == 'undefined' || typeof encoding.size.field == 'undefined') &&
      encoding.x.type === QUANTITATIVE && encoding.y.type === QUANTITATIVE &&
      // typeof encoding.x.bin == 'undefined' && typeof encoding.y.bin == 'undefined' &&
      // (typeof encoding.x.aggregate == 'undefined' || typeof encoding.y.aggregate == 'undefined')
      (mark === POINT || mark === CIRCLE || mark === SQUARE ||
        mark.type === POINT || mark.type === CIRCLE || mark.type === SQUARE)) {
      return true;
    } else {
      return false;
    }
  } catch (e) { // when some parts of spec are not defined
    return false;
  }
}
export function isDensityPlot(spec: any) {
  const {encoding, mark} = spec;
  try {
    if (encoding.x.type === QUANTITATIVE && encoding.y.type === QUANTITATIVE &&
      typeof encoding.x.bin !== 'undefined' && typeof encoding.y.bin !== 'undefined' &&
      // important: originally, vega use RECT for density plot. But we use square to restrict mark types.
      mark === SQUARE && encoding.color.aggregate === 'count') {
      return true;
    }
    else {
      return false;
    }
  } catch (e) {
    return false;
  }
}
export function isMeanAggregated(spec: any) {
  const {encoding} = spec;
  let isXMeanFn = false, isYMeanFn = false;
  if (typeof encoding.x.aggregate != 'undefined') {
    isXMeanFn = true;
  }
  if (typeof encoding.y.aggregate != 'undefined') {
    isYMeanFn = true;
  }
  return {isXMeanFn, isYMeanFn};
}
export function getColorField(spec: any) {
  const {encoding} = spec;
  let field, type;
  try {
    if (typeof encoding.color['field'] != 'undefined') {
      field = encoding.color['field'];
      type = encoding.color['type'];
    }
  } catch (e) {}
  return {
    colorField: {
      field, type
    }
  };
}
export function getColumnField(spec: any) {
  const {encoding} = spec;
  let columnField;
  try {
    columnField = encoding.column.field;
  } catch (e) {}
  return {columnField};
}
export function getNumberOfGraphs(spec: any, schema: Schema, data: any[]) {
  // return isColumnFieldUsing(spec) ? schema.domain({field: getColumnField(spec).columnField}).length : 1;
  return isColumnFieldUsing(spec) ? d3.map(data, d => d[getColumnField(spec).columnField]).keys().length : 1;
}
export function isColumnFieldUsing(spec: any) {
  return typeof getColumnField(spec).columnField != 'undefined';
}
export function isLegendUsing(spec: FacetedCompositeUnitSpec) {
  return typeof getColorField(spec).colorField.field != 'undefined';
}
/**
 * USED BY)
 * GUIDELINE_TOO_MANY_COLOR_CATEGORIES
 * GUIDELINE_TOO_MANY_SHAPE_CATEGORIES
 */
export function guideActionShelf(
  field: string,
  fieldType: string,
  channel: Channel,
  domain: any[],
  filters: Array<RangeFilter | OneOfFilter>,
  actionType: string,
  handleAction: (action: GuidelineAction | FilterAction | SpecAction) => void) {

  // const domainWithFilter = (filterHasField(filters, field) ?
  //   (filters[filterIndexOf(filters, field)] as OneOfFilter).oneOf : domain);

  // switch (actionType) {
  //   case SPEC_FIELD_REMOVE:
  //     if (channel == COLOR) removeGuidelineItem(GUIDELINE_TOO_MANY_COLOR_CATEGORIES, handleAction);
  //     else if (channel == SHAPE) removeGuidelineItem(GUIDELINE_TOO_MANY_SHAPE_CATEGORIES, handleAction);
  //     break;
  //   case SPEC_FIELD_ADD:
  //   case SPEC_FIELD_MOVE:
  //     if (domainWithFilter.length > 10 && fieldType == NOMINAL) {
  //       if (channel == COLOR) addGuidelineItem(GUIDELINE_TOO_MANY_COLOR_CATEGORIES, handleAction);
  //       else if (channel == SHAPE) addGuidelineItem(GUIDELINE_TOO_MANY_SHAPE_CATEGORIES, handleAction);
  //     } else {
  //       if (channel == COLOR) removeGuidelineItem(GUIDELINE_TOO_MANY_COLOR_CATEGORIES, handleAction);
  //       else if (channel == SHAPE) removeGuidelineItem(GUIDELINE_TOO_MANY_SHAPE_CATEGORIES, handleAction);
  //     }
  //     break;
  // }
}

/**
 * USED BY)
 * GUIDELINE_TOO_MANY_COLOR_CATEGORIES
 * GUIDELINE_TOO_MANY_SHAPE_CATEGORIES
 */
export function guideActionFilter(props: OneOfFilterShelfProps, oneOf: string[] | number[] | boolean[] | DateTime[], type: string) {
  const {spec, filter} = props;
  // switch (type) {
  //   case FILTER_MODIFY_ONE_OF: {
  //     //TODO: Should check if nominal
  //     if (typeof spec.encoding != 'undefined' && typeof spec.encoding.color != 'undefined' &&
  //       spec.encoding.color.field == filter.field) {
  //       if (oneOf.length > 10) addGuidelineItem(GUIDELINE_TOO_MANY_COLOR_CATEGORIES, props.handleAction);
  //       else removeGuidelineItem(GUIDELINE_TOO_MANY_COLOR_CATEGORIES, props.handleAction);
  //     }
  //     else if (typeof spec.encoding != 'undefined' && typeof spec.encoding.shape != 'undefined' &&
  //       spec.encoding.shape.field == filter.field) {
  //       if (oneOf.length > 10) addGuidelineItem(GUIDELINE_TOO_MANY_SHAPE_CATEGORIES, props.handleAction);
  //       else removeGuidelineItem(GUIDELINE_TOO_MANY_SHAPE_CATEGORIES, props.handleAction);
  //     }
  //     else {} // do nothing
  //     break;
  //   }
  // }
}

export function addGuidelineItem(item: GuidelineItemTypes, handleAction?: (action: GuidelineAction) => void) {
  handleAction({
    type: GUIDELINE_ADD_ITEM,
    payload: {item}
  });
}
export function removeGuidelineItem(item: GuidelineItemTypes, handleAction?: (action: GuidelineAction) => void) {
  handleAction({
    type: GUIDELINE_REMOVE_ITEM,
    payload: {item}
  });
}

