import {DateTime} from "vega-lite/build/src/datetime";
import {filterHasField, filterIndexOf, ShelfFilter} from "./shelf";
import {OneOfFilter, RangeFilter} from "vega-lite/build/src/filter";
import {SPEC_FIELD_REMOVE, SPEC_FIELD_ADD, SPEC_FIELD_MOVE, FILTER_MODIFY_ONE_OF, FilterAction, SpecAction} from "../actions";
import {COLOR, Channel, SHAPE} from "vega-lite/build/src/channel";
import {GUIDELINE_REMOVE_ITEM, GUIDELINE_ADD_ITEM, GuidelineAction} from "../actions/guidelines";
import {OneOfFilterShelfProps} from "../components/filter-pane/one-of-filter-shelf";
import {NOMINAL, QUANTITATIVE} from "../../node_modules/vega-lite/build/src/type";
import {POINT, CIRCLE, SQUARE} from "vega-lite/build/src/mark";
import {FacetedCompositeUnitSpec, TopLevelExtendedSpec} from "vega-lite/build/src/spec";
import {Schema} from "../api/api";

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
  "FILTER_CATEGORIES" | "SELECT_CATEGORIES" | "REMOVE_FIELD" | "NONE";

export interface GuideActionItem {
  title: string;
  subtitle: string;
  faIcon?: string;
  pros?: string;
  cons?: string;
}

export const ACTIONABLE_FILTER_GENERAL: GuideActionItem = {
  title: 'Filter',
  subtitle: 'Remove unneccessary values in the chart if there are any',
  faIcon: 'fa fa-filter',
  pros: 'Scalable to large data. Can show point attrubute (color/shape).',
  cons: 'Do not retain data. Cannot see overlap density. \'Uninteresting\' data should be predetermined.'
}

export const ACTIONABLE_POINT_SIZE: GuideActionItem = {
  title: 'Change Point Size',
  subtitle: 'Reduce the size of marks when over-plotting is relatively minor',
  faIcon: 'fa fa-compress',
  pros: 'Retain data. Can show point attrubute (color/shape)',
  cons: 'Not scalable to large data. Cannot see overlap density.'
}

export const ACTIONABLE_POINT_OPACITY: GuideActionItem = {
  title: 'Change Point Opacity',
  subtitle: '',
  faIcon: 'fa fa-tint',
  pros: 'Retain data. Can see overlap density.',
  cons: 'Point attribute (color/shape) become less distinguishable. Dim outliers. Not scalable to large data.'
}

export const ACTIONABLE_REMOVE_FILL_COLOR: GuideActionItem = {
  title: 'Remove Fill Color',
  subtitle: '',
  faIcon: 'fa fa-circle-o',
  pros: 'Retain data. Can show point attrubute (color/shape)',
  cons: 'Not scalable to large data. Cannot see overlap density.'
}

// TODO: change pros and cons for these four actions
export const ACTIONABLE_CHANGE_SHAPE: GuideActionItem = {
  title: 'Change Shape',
  subtitle: '',
  faIcon: 'fa fa-square-o',
  pros: 'Retain data. Can show point attrubute (color/shape)',
  cons: 'Not scalable to large data. Cannot see overlap density.'
}

export const ACTIONABLE_AGGREGATE: GuideActionItem = {
  title: 'Aggregate Points',
  subtitle: '',
  faIcon: 'fa fa-object-group',
  pros: 'Retain data. Can show point attrubute (color/shape)',
  cons: 'Not scalable to large data. Cannot see overlap density.'
}

export const ACTIONABLE_ENCODING_DENSITY: GuideActionItem = {
  title: 'Use Desnsity Plot',
  subtitle: '',
  faIcon: 'fa fa-th',
  pros: 'Retain data. Can show point attrubute (color/shape)',
  cons: 'Not scalable to large data. Cannot see overlap density.'
}

export const ACTIONABLE_SEPARATE_GRAPH: GuideActionItem = {
  title: 'Separate Graph',
  subtitle: '',
  faIcon: 'fa fa-clone',
  pros: 'Retain data. Can show point attrubute (color/shape)',
  cons: 'Not scalable to large data. Cannot see overlap density.'
}

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
    if (isClutteredScatterPlot(spec)) {
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

export function getGuidedSpec(spec: TopLevelExtendedSpec, guidelines: GuidelineItemTypes[], schema: Schema, filters?: ShelfFilter[]): any{
  if(typeof spec == 'undefined') return spec;
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
        break;
      }
      default:
        break;
    }
  });

  // HACK to put maxbins if binned for better look and feel
  try {
    if (newSpec.encoding.x['bin'] === true) {
      newSpec.encoding.x['bin'] = {maxbins: 60};
    }
  } catch (e) {}
  try {
    if (newSpec.encoding.y['bin'] === true) {
      newSpec.encoding.y['bin'] = {maxbins: 60};
    }
  } catch (e) {}

  // console.log("newSpec:");
  // console.log(newSpec);
  return newSpec;
}

export function isClutteredScatterPlot(spec: any) {
  // console.log("Checking If This Is Scatterplot:");
  // console.log(spec);
  const {encoding, mark} = spec;
  try {
    // TODO: any other spec to make this not scatterplot?
    if (encoding.x.type === QUANTITATIVE && encoding.y.type === QUANTITATIVE &&
      typeof encoding.x.bin == 'undefined' && typeof encoding.y.bin == 'undefined' &&
      (mark === POINT || mark === CIRCLE || mark === SQUARE)) { //&&
      // (typeof encoding.x.aggregate == 'undefined' || typeof encoding.y.aggregate == 'undefined')) {
      return true;
    } else {
      return false;
    }
  } catch (e) { // when some parts of spec are not defined
    return false;
  }
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
export function isSimpleScatterPlot(spec: any) {
  if (!isClutteredScatterPlot(spec)) {
    return;
  }
  const {encoding} = spec;
  if (typeof encoding.color == 'undefined' && typeof encoding.shape == 'undefined' &&
    typeof encoding.text == 'undefined' &&
    typeof encoding.x.aggregate == 'undefined' && typeof encoding.y.aggregate == 'undefined' &&
    typeof encoding.row == 'undefined' &&
    (typeof encoding.size == 'undefined' || typeof encoding.size.field == 'undefined')) {
    return true;
  }
  //TODO: check density plot
  else {
    return false;
  }
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

  const domainWithFilter = (filterHasField(filters, field) ?
    (filters[filterIndexOf(filters, field)] as OneOfFilter).oneOf : domain);

  switch (actionType) {
    case SPEC_FIELD_REMOVE:
      if (channel == COLOR) removeGuidelineItem(GUIDELINE_TOO_MANY_COLOR_CATEGORIES, handleAction);
      else if (channel == SHAPE) removeGuidelineItem(GUIDELINE_TOO_MANY_SHAPE_CATEGORIES, handleAction);
      break;
    case SPEC_FIELD_ADD:
    case SPEC_FIELD_MOVE:
      if (domainWithFilter.length > 10 && fieldType == NOMINAL) {
        if (channel == COLOR) addGuidelineItem(GUIDELINE_TOO_MANY_COLOR_CATEGORIES, handleAction);
        else if (channel == SHAPE) addGuidelineItem(GUIDELINE_TOO_MANY_SHAPE_CATEGORIES, handleAction);
      } else {
        if (channel == COLOR) removeGuidelineItem(GUIDELINE_TOO_MANY_COLOR_CATEGORIES, handleAction);
        else if (channel == SHAPE) removeGuidelineItem(GUIDELINE_TOO_MANY_SHAPE_CATEGORIES, handleAction);
      }
      break;
  }
}

/**
 * USED BY)
 * GUIDELINE_TOO_MANY_COLOR_CATEGORIES
 * GUIDELINE_TOO_MANY_SHAPE_CATEGORIES
 */
export function guideActionFilter(props: OneOfFilterShelfProps, oneOf: string[] | number[] | boolean[] | DateTime[], type: string) {
  const {spec, filter} = props;
  switch (type) {
    case FILTER_MODIFY_ONE_OF: {
      //TODO: Should check if nominal
      if (typeof spec.encoding != 'undefined' && typeof spec.encoding.color != 'undefined' &&
        spec.encoding.color.field == filter.field) {
        if (oneOf.length > 10) addGuidelineItem(GUIDELINE_TOO_MANY_COLOR_CATEGORIES, props.handleAction);
        else removeGuidelineItem(GUIDELINE_TOO_MANY_COLOR_CATEGORIES, props.handleAction);
      }
      else if (typeof spec.encoding != 'undefined' && typeof spec.encoding.shape != 'undefined' &&
        spec.encoding.shape.field == filter.field) {
        if (oneOf.length > 10) addGuidelineItem(GUIDELINE_TOO_MANY_SHAPE_CATEGORIES, props.handleAction);
        else removeGuidelineItem(GUIDELINE_TOO_MANY_SHAPE_CATEGORIES, props.handleAction);
      }
      else {} // do nothing
      break;
    }
  }
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

