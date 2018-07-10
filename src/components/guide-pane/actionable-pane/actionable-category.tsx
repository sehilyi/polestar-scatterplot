import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './actionable-category.scss';
import {DateTime} from 'vega-lite/build/src/datetime';
import {ShelfUnitSpec, Schema, toTransforms} from '../../../models';
import {Field} from '../../field';
import {ActionHandler, ShelfAction, SpecAction, SPEC_COLOR_SCALE_SPECIFIED, SPEC_COLOR_TRANSFORM_SPECIFIED, SPEC_FIELD_REMOVE, LogAction} from '../../../actions';
import {ACTIONABLE_SELECT_CATEGORIES, GuidelineAction} from '../../../actions/guidelines';
import {GuidelineItem} from '../../../models/guidelines';
import {insertItemToArray, removeItemFromArray} from '../../../reducers/util';
import {LookupTransform, LookupData, Transform} from 'vega-lite/build/src/transform';
import {COLOR} from 'vega-lite/build/src/channel';
import {VegaLite} from '../../vega-lite';
import {InlineData} from 'vega-lite/build/src/data';
import {FacetedCompositeUnitSpec} from 'vega-lite/build/src/spec';
import {Logger} from '../../util/util.logger';
import {Plot} from '../../plot';
import {Themes} from '../../../models/theme/theme';
import {OneOfFilter} from 'vega-lite/build/src/filter';

export interface ActionableCategoryProps extends ActionHandler<GuidelineAction | SpecAction | LogAction> {
  item: GuidelineItem;
  domain: string[] | number[] | boolean[] | DateTime[];
  spec: ShelfUnitSpec;
  schema: Schema;

  //preveiw
  data: InlineData;
  mainSpec: FacetedCompositeUnitSpec;
  theme: Themes;
}

export interface ActionableCategoryState {
  hideSearchBar: boolean;
}

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
    const {schema, spec} = this.props;
    let field = spec.encoding.color.field.toString();
    const fieldSchema = schema.fieldSchema(field);
    const fieldDef = {
      field,
      type: fieldSchema.vlType
    };

    return (
      <div>
        <div styleName="guide-previews">
          <div styleName="guide-preview" ref={this.vegaLiteWrapperRefHandler} className="preview">
            <a onClick={this.onFilterClick.bind(this)}>
              {this.renderFilterCategoriesPreview()}
              <i className="fa fa-filter" aria-hidden="true" />
              {' '} Filter Categories
            </a>
          </div>
          <div styleName="guide-preview" ref={this.vegaLiteWrapperRefHandler} className="preview">
            <a>
              {this.renderSelectCategoriesPreview()}
              <i className="fa fa-hand-pointer-o" aria-hidden="true" />
              {' '} Select Categories
            </a>
          </div>
          <div styleName="guide-preview" ref={this.vegaLiteWrapperRefHandler} className="preview">
            <a onClick={this.onRemoveField.bind(this)}>
              {this.renderRemoveFieldPreview()}
              <i className="fa fa-times" aria-hidden="true" />
              {' '} Remove Field
            </a>
          </div>
        </div>
        <div styleName='filter-shelf' key={'1'} hidden>
          <Field
            draggable={false}
            fieldDef={fieldDef}
            caretShow={true}
            isPill={true}
          />
          {this.renderCategorySelector()}
        </div>
      </div>
    );
  }

  private onFilterClick() {

  }

  private vegaLiteWrapperRefHandler = (ref: any) => {
    this.vegaLiteWrapper = ref;
  }

  private renderSelectCategoriesPreview() {
    const {mainSpec, data, handleAction} = this.props;
    let previewSpec = (JSON.parse(JSON.stringify(mainSpec))) as FacetedCompositeUnitSpec;
    ///temp
    let selected: any[] = [];
    const {domain, schema, spec} = this.props;
    let field = spec.encoding.color.field.toString();
    const fieldSchema = schema.fieldSchema(field);
    selected.push(domain[0]);
    selected.push(domain[1]);
    selected.push(domain[2]);
    previewSpec.encoding.color = {
      field,
      type: fieldSchema.vlType,
      scale: {
        domain: domain,
        range: this.getRange(selected)
      }
    }
    ///

    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={data} />
    );
  }

  private renderFilterCategoriesPreview() {
    const {mainSpec, data} = this.props;
    let previewSpec = (JSON.parse(JSON.stringify(mainSpec))) as FacetedCompositeUnitSpec;
    ///temp
    let oneOf: any[] = [];
    const {domain, schema, spec} = this.props;
    let field = spec.encoding.color.field.toString();
    oneOf.push(domain[0]);
    oneOf.push(domain[1]);
    oneOf.push(domain[2]);
    let newFilter: OneOfFilter = {
      field,
      oneOf
    }
    const {transform} = previewSpec;
    const newTransform = (transform || []).concat(toTransforms([newFilter]));
    previewSpec.transform = newTransform;
    console.log(previewSpec);
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

  private renderCategorySelector() {
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
              onChange={this.toggleCheckbox.bind(this, option)}
            /> {'' + option}
          </label>
          <span styleName='keep-only' onClick={this.onSelectOne.bind(this, option)}>
            Keep Only
          </span>
        </div>
      );
    });
    return (
      <div id={item.id}>
        <div styleName='below-header'>
          <span>
            <a styleName='select-all' onClick={this.onSelectAll.bind(this)}>
              Select All
            </a> /
            <a styleName='clear-all' onClick={this.onClearAll.bind(this)}>
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

  protected categoryModifyScale(selected: string[] | number[] | boolean[] | DateTime[]) {
    const {handleAction, item} = this.props;
    handleAction({
      type: ACTIONABLE_SELECT_CATEGORIES,
      payload: {
        item: item,
        selectedCategories: selected
      }
    });

    const {domain, schema, spec} = this.props;
    let field = spec.encoding.color.field.toString();
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

  private toggleCheckbox(option: string | number | boolean | DateTime) {
    const selected = this.props.item.selectedCategories;
    const valueIndex = (selected as any[]).indexOf(option);
    let changedSelectedValues;
    if (valueIndex === -1) {
      changedSelectedValues = insertItemToArray(selected, selected.length, option);
    } else {
      changedSelectedValues = removeItemFromArray(selected, valueIndex).array;
    }
    this.categoryModifyScale(changedSelectedValues);
  }

  private onSelectOne(value: string | number | boolean | DateTime) {
    this.categoryModifyScale([value]);
  }

  private onSelectAll() {
    const {domain} = this.props;
    this.categoryModifyScale(domain.slice());
  }

  private onClearAll() {
    this.categoryModifyScale([]);
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