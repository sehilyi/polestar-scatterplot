import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './category-picker.scss';
import {DateTime} from 'vega-lite/build/src/datetime';
import {Field} from '../../../field';
import {insertItemToArray, removeItemFromArray} from '../../../../reducers/util';
import {SpecAction, FilterAction, GuidelineAction} from '../../../../actions';


export interface CategoryPickerProps {
  id: string;
  title?: string;
  field: string;
  domain: string[] | number[] | boolean[] | DateTime[];
  selected: string[] | number[] | boolean[] | DateTime[];
  handleAction: (action: GuidelineAction | FilterAction | SpecAction) => void;  // Add other actions when needed
  pickedCategoryAction: (selected: string[] | number[] | boolean[] | DateTime[]) => void;

  isCopyFromUI?: boolean;
}

export interface CategoryPickerState {
  hideSearchBar: boolean;
}

export class CategoryPickerBase extends React.PureComponent<CategoryPickerProps, CategoryPickerState>{
  constructor(props: CategoryPickerProps) {
    super(props);
    this.state = ({
      hideSearchBar: true
    });
  }

  public render() {
    const {field, selected, isCopyFromUI, title} = this.props;
    const fieldDef = {
      field,
      selected
    }
    return (
      <div styleName={isCopyFromUI ? 'cropped-border' : 'not-cropped'}>
        {title != '' ?
          <h3>{title}</h3> :
          null
        }
        <div styleName='picker-shelf'>
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

  private renderCategorySelector() {
    const {id, domain, selected} = this.props;
    const oneOfFilter = (domain as any[]).map(option => {
      return (
        <div key={option} className='option-div' styleName='option-row'>
          <label>
            <input
              name={id}
              value={option}
              type='checkbox'
              checked={(selected as any[]).indexOf(option) !== -1}
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
      <div id={id}>
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
    const {domain} = this.props;
    for (let i of domain) {
      newC.push((((selected as any[]).indexOf(i) === -1) ? {from: i, to: "Others"} : {from: i, to: i}));
    }
    return newC;
  }

  private toggleCheckbox(option: string | number | boolean | DateTime) {
    const {selected, pickedCategoryAction} = this.props;
    const valueIndex = (selected as any[]).indexOf(option);
    let changedSelectedValues;
    if (valueIndex === -1) {
      changedSelectedValues = insertItemToArray(selected, selected.length, option);
    } else {
      changedSelectedValues = removeItemFromArray(selected, valueIndex).array;
    }
    pickedCategoryAction(changedSelectedValues);
  }

  private onSelectOne(value: string | number | boolean | DateTime) {
    this.props.pickedCategoryAction([value]);
  }

  private onSelectAll() {
    this.props.pickedCategoryAction(this.props.domain.slice());
  }

  private onClearAll() {
    this.props.pickedCategoryAction([]);
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
    const container = document.getElementById(this.props.id.toString());
    // select all divs
    const divs = container.getElementsByClassName('option-div');
    return divs;
  }
}

export const CategoryPicker = (CSSModules(CategoryPickerBase, styles));