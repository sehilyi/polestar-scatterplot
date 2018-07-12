import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './actionable-category.scss';
import {DateTime} from 'vega-lite/build/src/datetime';
import {ShelfUnitSpec, Schema, toTransforms, ShelfFilter, filterHasField, filterIndexOf} from '../../../models';
import {Field} from '../../field';
import {ActionHandler, ShelfAction, SpecAction, SPEC_COLOR_SCALE_SPECIFIED, SPEC_COLOR_TRANSFORM_SPECIFIED, SPEC_FIELD_REMOVE, LogAction, FILTER_MODIFY_ONE_OF, FilterAction} from '../../../actions';
import {ACTIONABLE_SELECT_CATEGORIES, GuidelineAction, ACTIONABLE_TRIGGER_INTERFACE} from '../../../actions/guidelines';
import {GuidelineItem} from '../../../models/guidelines';
import {insertItemToArray, removeItemFromArray} from '../../../reducers/util';
import {COLOR} from 'vega-lite/build/src/channel';
import {VegaLite} from '../../vega-lite';
import {InlineData} from 'vega-lite/build/src/data';
import {FacetedCompositeUnitSpec} from 'vega-lite/build/src/spec';
import {Logger} from '../../util/util.logger';
import {Themes} from '../../../models/theme/theme';
import {OneOfFilter} from 'vega-lite/build/src/filter';

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
  }

  public render() {
    const vegaReady = typeof this.props.mainSpec != "undefined";
    const {schema, spec, mainSpec} = this.props;
    const {triggeredActionable} = this.props.item;
    let field = spec.encoding.color.field.toString();
    const fieldSchema = schema.fieldSchema(field);
    const fieldDef = {
      field,
      type: fieldSchema.vlType
    };

    return (
      <div>
        <div styleName={triggeredActionable == "NONE" ? "guide-previews" : "guide-previews-hidden"}>
          <div styleName="guide-preview" ref={this.vegaLiteWrapperRefHandler} className="preview" onClick={this.onFilterClick.bind(this)}>
            <a>
              {vegaReady ? this.renderFilterCategoriesPreview() : ''}
              <i className="fa fa-filter" aria-hidden="true" />
              {' '} Filter Categories
            </a>
          </div>
          <div styleName="guide-preview" ref={this.vegaLiteWrapperRefHandler} className="preview" onClick={this.onSelectClick.bind(this)}>
            <a>
              {vegaReady ? this.renderSelectCategoriesPreview() : ''}
              <i className="fa fa-hand-pointer-o" aria-hidden="true" />
              {' '} Select Categories
            </a>
          </div>
          <div styleName="guide-preview" onClick={this.onRemoveField.bind(this)} ref={this.vegaLiteWrapperRefHandler} className="preview">
            <a>
              {vegaReady ? this.renderRemoveFieldPreview() : ''}
              <i className="fa fa-times" aria-hidden="true" />
              {' '} Remove Field
            </a>
          </div>
        </div>
        <div styleName={triggeredActionable == "FILTER_CATEGORIES" ? 'filter-shelf' : 'filter-shelf-hidden'} key={'1'}>
          <Field
            draggable={false}
            fieldDef={fieldDef}
            caretShow={true}
            isPill={true}
          />
          {this.renderCategorySelector("FILTER_CATEGORIES")}
        </div>
        <div styleName={triggeredActionable == "SELECT_CATEGORIES" ? 'filter-shelf' : 'filter-shelf-hidden'} key={'2'}>
          <Field
            draggable={false}
            fieldDef={fieldDef}
            caretShow={true}
            isPill={true}
          />
          {this.renderCategorySelector("SELECT_CATEGORIES")}
        </div>
      </div>
    );
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
    const {domainWithFilter, schema, spec} = this.props;
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
    const {mainSpec, data, handleAction, filters} = this.props;
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

  private renderCategorySelector(actionable: ACTIONABLES) {
    const {domain, spec, item} = this.props;
    const oneOfFilter = (domain as any[]).map(option => {
      return (
        <div key={option} className='option-div' styleName='option-row'>
          <label>
            <input
              name={item.id}
              value={option}
              type='checkbox'
              checked={(item.selectedCategories as any[]).indexOf(option) !== -1}
              onChange={this.toggleCheckbox.bind(this, option, actionable)}
            /> {'' + option}
          </label>
          <span styleName='keep-only' onClick={this.onSelectOne.bind(this, option, actionable)}>
            Keep Only
          </span>
        </div>
      );
    });
    return (
      <div id={item.id}>
        <div styleName='below-header'>
          <span>
            <a styleName='select-all' onClick={this.onSelectAll.bind(this, actionable)}>
              Select All
            </a> /
            <a styleName='clear-all' onClick={this.onClearAll.bind(this, actionable)}>
              Clear All
            </a>
          </span>
          {this.state.hideSearchBar ?
            null :
            <input type='text' onChange={this.onSearch.bind(this)} autoFocus={true} />
          }
          <a styleName='search' onClick={this.onClickSearch.bind(this)}>
            <i className='fa fa-search' />
          </a>
        </div>
        {oneOfFilter}
      </div>
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

  protected categoryModifyScale(selected: string[] | number[] | boolean[] | DateTime[], actionable: ACTIONABLES) {

    const {handleAction, item, spec} = this.props;
    let field = spec.encoding.color.field.toString();

    handleAction({
      type: ACTIONABLE_SELECT_CATEGORIES,
      payload: {
        item: item,
        selectedCategories: selected
      }
    });

    switch (actionable) {
      case "SELECT_CATEGORIES": {
        const {domain, schema} = this.props;
        const fieldSchema = schema.fieldSchema(field);
        const fieldDef = {
          field,
          type: fieldSchema.vlType,
          scale: {
            domain: domain,
            range: this.getRange(selected)
          }
        };
        handleAction({
          type: SPEC_COLOR_SCALE_SPECIFIED,
          payload: {
            fieldDef: fieldDef
          }
        });
        // TODO: Is there any nice way to show unselected categories as "Ohters"?
        // const newData = this.getNewCategory(selected);
        // const lookupData: LookupData = {
        //   data: {values: newData},
        //   key: 'from',
        //   fields: ['to']
        // }
        // const transform: LookupTransform = {
        //   lookup: field,
        //   from: lookupData
        // }
        // handleAction({
        //   type: SPEC_COLOR_TRANSFORM_SPECIFIED,
        //   payload: {
        //     transform: transform,
        //     fieldDef: fieldDef
        //   }
        // });
      }
        break;
      case "FILTER_CATEGORIES": {
        const {handleAction, filters} = this.props;
        const index = filterIndexOf(filters, field);
        if (index != -1) {
          handleAction({
            type: FILTER_MODIFY_ONE_OF,
            payload: {
              index,
              oneOf: selected
          }
          });
        }
        break;
      }
    }
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

  private getNewCategory(selected: string[] | number[] | boolean[] | DateTime[]): any[] {
    const newC = [];
    for (let i of this.props.domain) {
      newC.push((((selected as any[]).indexOf(i) === -1) ? {from: i, to: "Others"} : {from: i, to: i}));
    }
    return newC;
  }

  private toggleCheckbox(option: string | number | boolean | DateTime, actionable: ACTIONABLES) {
    const selected = this.props.item.selectedCategories;
    const valueIndex = (selected as any[]).indexOf(option);
    let changedSelectedValues;
    if (valueIndex === -1) {
      changedSelectedValues = insertItemToArray(selected, selected.length, option);
    } else {
      changedSelectedValues = removeItemFromArray(selected, valueIndex).array;
    }
    this.categoryModifyScale(changedSelectedValues, actionable);
  }

  private onSelectOne(value: string | number | boolean | DateTime, actionable: ACTIONABLES) {
    this.categoryModifyScale([value], actionable);
  }

  private onSelectAll(actionable: ACTIONABLES) {
    const {domain} = this.props;
    this.categoryModifyScale(domain.slice(), actionable);
  }

  private onClearAll(actionable: ACTIONABLES) {
    this.categoryModifyScale([], actionable);
  }

  private onClickSearch() {
    if (!this.state.hideSearchBar) {
      const divs = this.getDivs();
      Array.prototype.forEach.call(divs, (div: HTMLDivElement) => {
        div.style.display = 'block';
      });
    }
    this.setState({
      hideSearchBar: !this.state.hideSearchBar
    });
  }

  private onSearch(e: any) {
    const searchedDivs = this.getDivs();
    Array.prototype.forEach.call(searchedDivs, (searchedDiv: HTMLDivElement) => {
      // its first child is label, the label's child is checkbox input
      const searchedOption = searchedDiv.childNodes[0].childNodes[0] as HTMLInputElement;
      if (searchedOption.value.toLowerCase().indexOf(e.target.value.toLowerCase().trim()) === -1) {
        searchedDiv.style.display = 'none';
      } else {
        searchedDiv.style.display = 'block';
      }
    });
  }

  /**
   * returns all div nodes in current filter shelf
   */
  private getDivs() {
    // select the current filter shelf
    const container = document.getElementById(this.props.item.id.toString());
    // select all divs
    const divs = container.getElementsByClassName('option-div');
    return divs;
  }
}

export const ActionableCategory = (CSSModules(ActionableCategoryBase, styles));