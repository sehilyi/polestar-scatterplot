import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './actionable-category.scss';
import {DateTime} from 'vega-lite/build/src/datetime';
import {ShelfUnitSpec, Schema} from '../../../models';
import {Field} from '../../field';

export interface ActionableCategoryProps {
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
    const {domain, spec} = this.props;
    const oneOfFilter = (domain as any[]).map(option => {
      return (
        <div key={option} className='option-div' styleName='option-row'>
          <label>
            <input
              name="temp"
              value={option}
              type='checkbox'
            /> {'' + option}
          </label>
          <span styleName='keep-only'>
            Keep Only
          </span>
        </div>
      );
    });
    return (
      <div id="temp">
        <div styleName='below-header'>
          <span>
            <a styleName='select-all'>
              Select All
            </a> /
            <a styleName='clear-all'>
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
    const container = document.getElementById("temp".toString());
    // select all divs
    const divs = container.getElementsByClassName('option-div');
    return divs;
  }
}

export const ActionableCategory = (CSSModules(ActionableCategoryBase, styles));