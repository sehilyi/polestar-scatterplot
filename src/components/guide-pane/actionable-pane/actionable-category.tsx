import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './guideline-categories.scss';
import {DateTime} from 'vega-lite/build/src/datetime';
import {OneOfFilter} from 'vega-lite/build/src/filter';

export interface ActionableCategoryProps {
  domain: string[] | number[] | boolean[] | DateTime[];
  index: number;
  filter: OneOfFilter;
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
    const {domain, filter, index} = this.props;
    const oneOfFilter = (domain as any[]).map(option => {
      return (
        <div key={option} className='option-div' styleName='option-row'>
          <label>
            <input
              name={index.toString()}
              value={option}
              type='checkbox'
              checked={(filter.oneOf as any[]).indexOf(option) !== -1}
            /> {'' + option}
          </label>
          <span styleName='keep-only'>
            Keep Only
          </span>
        </div>
      );
    });
    return (
      <div id={index.toString()}>
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
    const container = document.getElementById(this.props.index.toString());
    // select all divs
    const divs = container.getElementsByClassName('option-div');
    return divs;
  }
}

export const ActionableCategory = (CSSModules(ActionableCategoryBase, styles));