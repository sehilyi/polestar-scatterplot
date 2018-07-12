import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './actionable-category.scss';
import {DateTime} from 'vega-lite/build/src/datetime';
import {ShelfUnitSpec, Schema, toTransforms, ShelfFilter, filterHasField, filterIndexOf} from '../../../models';
import {Field} from '../../field';
import {ActionHandler, ShelfAction, SpecAction, SPEC_COLOR_SCALE_SPECIFIED, SPEC_COLOR_TRANSFORM_SPECIFIED, SPEC_FIELD_REMOVE, LogAction, FILTER_MODIFY_ONE_OF, FilterAction, FILTER_ADD} from '../../../actions';
import {ACTIONABLE_SELECT_CATEGORIES, GuidelineAction, ACTIONABLE_TRIGGER_INTERFACE, ACTIONABLE_MODIFY_ONE_OF_CATEGORIES} from '../../../actions/guidelines';
import {GuidelineItem} from '../../../models/guidelines';
import {insertItemToArray, removeItemFromArray} from '../../../reducers/util';
import {COLOR} from 'vega-lite/build/src/channel';
import {VegaLite} from '../../vega-lite';
import {InlineData} from 'vega-lite/build/src/data';
import {FacetedCompositeUnitSpec} from 'vega-lite/build/src/spec';
import {Logger} from '../../util/util.logger';
import {Themes} from '../../../models/theme/theme';
import {OneOfFilter} from 'vega-lite/build/src/filter';
import {CategoryPicker} from './actionable-common-ui/category-picker';

export interface ActionableCategoryProps extends ActionHandler<GuidelineAction | SpecAction | LogAction | FilterAction> {
  item: GuidelineItem;
  domain: string[] | number[] | boolean[] | DateTime[];
  domainWithFilter: string[] | number[] | boolean[] | DateTime[];
  spec: ShelfUnitSpec;
  schema: Schema;

  //preveiw
  data: InlineData;
  mainSpec: FacetedCompositeUnitSpec;
  theme: Themes;
  filters: ShelfFilter[];
}

export interface ActionableCategoryState {
  hideSearchBar: boolean;
}

export type ACTIONABLES = "FILTER_CATEGORIES" | "SELECT_CATEGORIES" | "REMOVE_FIELD" | "NONE";

export class ActionableCategoryBase extends React.PureComponent<ActionableCategoryProps, ActionableCategoryState>{

  private plotLogger: Logger;
  private vegaLiteWrapper: HTMLElement;

  constructor(props: ActionableCategoryProps) {
    super(props);
    this.state = ({
      hideSearchBar: true
    });

    this.plotLogger = new Logger(props.handleAction);
    this.onFilterClick = this.onFilterClick.bind(this);
    this.onSelectClick = this.onSelectClick.bind(this);
    this.onRemoveField = this.onRemoveField.bind(this);
    this.onBackButton = this.onBackButton.bind(this);
  }

  public render() {
    const vegaReady = typeof this.props.mainSpec != "undefined";
    const {domain, domainWithFilter, schema, spec, mainSpec, handleAction} = this.props;
    const {id, triggeredActionable, oneOfCategories, selectedCategories} = this.props.item;
    let field = spec.encoding.color.field.toString();
    const fieldSchema = schema.fieldSchema(field);
    const fieldDef = {
      field,
      type: fieldSchema.vlType
    };

    return (
      <div>
        <div styleName={triggeredActionable == "NONE" ? "guide-previews" : "guide-previews-hidden"}>
          <div styleName="guide-preview" className="preview" onClick={this.onFilterClick} ref={this.vegaLiteWrapperRefHandler} >
            {vegaReady ? this.renderFilterCategoriesPreview() : null}
            <i className="fa fa-filter" aria-hidden="true" />
            {' '} Filter Categories
          </div>
          <div styleName="guide-preview" className="preview" onClick={this.onSelectClick} ref={this.vegaLiteWrapperRefHandler} >
            {vegaReady ? this.renderSelectCategoriesPreview() : null}
            <i className="fa fa-hand-pointer-o" aria-hidden="true" />
            {' '} Select Categories
          </div>
          <div styleName="guide-preview" className="preview" onClick={this.onRemoveField} ref={this.vegaLiteWrapperRefHandler} >
            {vegaReady ? this.renderRemoveFieldPreview() : null}
            <i className="fa fa-times" aria-hidden="true" />
            {' '} Remove Field
          </div>
        </div>
        <div styleName={triggeredActionable == "NONE" ? 'back-button-hidden' : 'back-button'}
          onClick={this.onBackButton}>
          <i className="fa fa-chevron-circle-left" aria-hidden="true" />
          {' '} Move Back
        </div>
        <div styleName={triggeredActionable == "FILTER_CATEGORIES" ? 'filter-shelf' : 'filter-shelf-hidden'}>
          <CategoryPicker
            id={id + field + "FILTER_CATEGORIES"}
            field={field}
            domain={domain}
            selected={oneOfCategories}
            handleAction={handleAction}
            pickedCategoryAction={this.pickedCategoryActionForFilter}
          />
        </div>
        <div styleName={triggeredActionable == "SELECT_CATEGORIES" ? 'filter-shelf' : 'filter-shelf-hidden'}>
          <CategoryPicker
            id={id + field + "SELECT_CATEGORIES"}
            field={field}
            domain={domainWithFilter}
            selected={selectedCategories}
            handleAction={handleAction}
            pickedCategoryAction={this.pickedCategoryActionForSelect}
          />
        </div>
      </div>
    );
  }

  pickedCategoryActionForSelect = (selected: string[] | number[] | boolean[] | DateTime[]) => {
    const {handleAction, item, spec} = this.props;
    let field = spec.encoding.color.field.toString();

    const {domainWithFilter, schema} = this.props;
    const fieldSchema = schema.fieldSchema(field);
    const fieldDef = {
      field,
      type: fieldSchema.vlType,
      scale: {
        domain: domainWithFilter,
        range: this.getRange(selected)
      }
    };
    handleAction({
      type: ACTIONABLE_SELECT_CATEGORIES,
      payload: {
        item,
        selectedCategories: selected
      }
    });
    handleAction({
      type: SPEC_COLOR_SCALE_SPECIFIED,
      payload: {
        fieldDef
      }
    });
  }

  pickedCategoryActionForFilter = (selected: string[] | number[] | boolean[] | DateTime[]) => {
    const {handleAction, item, spec, filters} = this.props;
    let field = spec.encoding.color.field.toString();

    handleAction({
      type: ACTIONABLE_MODIFY_ONE_OF_CATEGORIES,
      payload: {
        item: item,
        oneOfCategories: selected
      }
    });
    if (filterHasField(filters, field)) {
      handleAction({
        type: FILTER_MODIFY_ONE_OF,
        payload: {
          index: filterIndexOf(filters, field),
          oneOf: selected
        }
      });
    } else {
      handleAction({
        type: FILTER_ADD,
        payload: {
          filter: {
            field,
            oneOf: selected
          }
        }
      });
    }
  }

  private onBackButton() {
    let actionable: ACTIONABLES = "NONE";
    const {handleAction, item} = this.props;
    handleAction({
      type: ACTIONABLE_TRIGGER_INTERFACE,
      payload: {item: item, triggeredActionable: actionable}
    });
  }

  private onFilterClick() {
    let actionable: ACTIONABLES = "FILTER_CATEGORIES";
    const {handleAction, item} = this.props;
    handleAction({
      type: ACTIONABLE_TRIGGER_INTERFACE,
      payload: {item: item, triggeredActionable: actionable}
    });
  }

  private onSelectClick() {
    let actionable: ACTIONABLES = "SELECT_CATEGORIES";
    const {handleAction, item} = this.props;
    handleAction({
      type: ACTIONABLE_TRIGGER_INTERFACE,
      payload: {item: item, triggeredActionable: actionable}
    });
  }

  private vegaLiteWrapperRefHandler = (ref: any) => {
    this.vegaLiteWrapper = ref;
  }

  private renderFilterCategoriesPreview() {
    const {mainSpec, data, filters} = this.props;
    let previewSpec = (JSON.parse(JSON.stringify(mainSpec))) as FacetedCompositeUnitSpec;

    ///temp
    let oneOf: any[] = [];
    const {domainWithFilter, spec} = this.props;
    let field = spec.encoding.color.field.toString();

    const {transform} = previewSpec;

    oneOf.push(domainWithFilter[0]);
    oneOf.push(domainWithFilter[1]);
    oneOf.push(domainWithFilter[2]);
    oneOf.push(domainWithFilter[3]);
    oneOf.push(domainWithFilter[4]);
    let newFilter: OneOfFilter = {
      field,
      oneOf
    }
    const newTransform = (transform || []).concat(toTransforms([newFilter]));
    previewSpec.transform = newTransform;
    ///
    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={data} />
    );
  }

  private renderSelectCategoriesPreview() {
    const {mainSpec, data} = this.props;
    let previewSpec = (JSON.parse(JSON.stringify(mainSpec))) as FacetedCompositeUnitSpec;
    ///temp
    let selected: any[] = [];
    const {domainWithFilter, schema, spec} = this.props;
    let field = spec.encoding.color.field.toString();

    const fieldSchema = schema.fieldSchema(field);

    selected.push(domainWithFilter[0]);
    selected.push(domainWithFilter[1]);
    selected.push(domainWithFilter[2]);
    selected.push(domainWithFilter[3]);
    selected.push(domainWithFilter[4]);
    previewSpec.encoding.color = {
      field,
      type: fieldSchema.vlType,
      scale: {
        domain: domainWithFilter,
        range: this.getRange(selected)
      }
    }
    ///

    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={data} />
    );
  }

  private renderRemoveFieldPreview() {
    const {mainSpec, data} = this.props;
    let previewSpec = (JSON.parse(JSON.stringify(mainSpec)));
    delete previewSpec.encoding.color;
    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={data} />
    );
  }

  private onRemoveField() {
    this.props.item.guideState = "IGNORE";
    const {handleAction} = this.props;
    handleAction({
      type: SPEC_FIELD_REMOVE,
      payload: {channel: COLOR}
    });
  }

  //TODO: Any better algorithm for this?
  private getRange(selected: string[] | number[] | boolean[] | DateTime[]): string[] {
    const p = ["#4c78a8", "#f58518", "#e45756", "#72b7b2", "#54a24b", "#eeca3b", "#b279a2", "#ff9da6", "#9d755d", "#bab0ac"]; //TODO: auto get colors from library
    const r = [];
    let round = 0;
    for (let i of this.props.domain) {
      r.push((((selected as any[]).indexOf(i) !== -1) ? p[round++] : p[p.length - 1]));
      if (round >= p.length - 1) round = 0;
    }
    return r;
  }
}

export const ActionableCategory = (CSSModules(ActionableCategoryBase, styles));