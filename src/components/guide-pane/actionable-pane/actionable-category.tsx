import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './actionable-category.scss';
import {DateTime} from 'vega-lite/build/src/datetime';
import {ShelfUnitSpec, Schema} from '../../../models';
import {Field} from '../../field';
import {ActionHandler, ShelfAction, SpecAction, SPEC_COLOR_SCALE_SPECIFIED} from '../../../actions';
import {ACTIONABLE_SELECT_CATEGORIES, GuidelineAction} from '../../../actions/guidelines';
import {GuidelineItem} from '../../../models/guidelines';

export interface ActionableCategoryProps extends ActionHandler<GuidelineAction | SpecAction> {
  item: GuidelineItem;
  domain: string[] | number[] | boolean[] | DateTime[];
  spec: ShelfUnitSpec;
  schema: Schema;
}

export interface ActionableCategoryState {
  hideSearchBar: boolean;
}

export class ActionableCategoryBase extends React.PureComponent<ActionableCategoryProps, ActionableCategoryState>{
  constructor(props: ActionableCategoryProps) {
    super(props);
    this.state = ({
      hideSearchBar: true
    });
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
      <div styleName='filter-shelf' key={'1'}>
        <Field
          draggable={false}
          fieldDef={fieldDef}
          caretShow={true}
          isPill={true}
        />
        {this.renderCategorySelector()}
      </div>
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
    })
  }

  //TODO: Any better algorithm for this?
  private getRange(selected: string[] | number[] | boolean[] | DateTime[]): string[] {
    const p = ["#4c78a8", "#f58518", "#e45756", "#72b7b2", "#54a24b", "#eeca3b", "#b279a2", "#ff9da6", "#9d755d", "#bab0ac"]; //TODO: auto get colors from library
    const r = [];
    let round = 0;
    for (let i of this.props.domain) {
      console.log(selected + "/" + i);
      r.push((((selected as any[]).indexOf(i) !== -1) ? p[round++] : p[p.length - 1]));
      if (round >= p.length - 1) round = 0;
    }
    return r;
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