import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './filter-adjuster.scss';
import {isNullOrUndefined} from '../../../../util';
import {Schema, filterHasField, filterIndexOf, ShelfFilter} from '../../../../models';
import {CategoryPicker} from './category-picker';
import {OneOfFilter} from 'vega-lite/build/src/filter';
import {GuidelineAction, FilterAction, SpecAction, FILTER_MODIFY_ONE_OF, FILTER_ADD} from '../../../../actions';
import {DateTime} from 'vega-lite/build/src/datetime';

export interface FilterAdjusterProps {
  id: string;
  title?: string;
  subtitle?: string;
  fields: string[];
  schema: Schema;
  filters: ShelfFilter[];
  defaultField: string;
  defaultOneOf: any[];
  handleAction: (action: GuidelineAction | FilterAction | SpecAction) => void;
  filterAction: (field: string, oneOf: any[]) => void;
}

export interface FilterAdjusterState {
  field: string;
  oneOf: any[];
}

export class FilterAdjusterBase extends React.PureComponent<FilterAdjusterProps, FilterAdjusterState> {
  constructor(props: FilterAdjusterProps) {
    super(props);
    const {defaultField, defaultOneOf} = this.props;
    this.state = {
      field: defaultField,
      oneOf: defaultOneOf
    }
  }

  public render() {
    const {id, title, subtitle, fields, filters, schema, handleAction} = this.props;
    const {field, oneOf} = this.state;
    const options = fields.map(field => (
      <option key={field} value={field}>
        {field}
      </option>
    ));

    return (
      <div id={id} styleName='filter-adjuster'>
        {title != '' ?
          <h2>{title}</h2> :
          null
        }
        {subtitle != '' ?
          <h3>{subtitle}</h3> :
          null
        }
        <div styleName='filter'>
          <select
            styleName='dropdown-menu'
            value={field}
            onChange={this.onFieldChange.bind(this)}
          >
            {options}
          </select>
          <CategoryPicker
            id={id + field + "FILTER_CATEGORIES"}
            field={field}
            domain={schema.domain({field})}
            selected={(filterHasField(filters, field) ?
              (filters[filterIndexOf(filters, field)] as OneOfFilter).oneOf :
              schema.domain({field}))}
            handleAction={handleAction}
            pickedCategoryAction={this.pickedCategoryActionForFilter}
            isCopyFromUI={false}
          />
        </div>
      </div>
    )
  }

  public onFieldChange(event: any) {
    this.props.filterAction(this.state.field, this.state.oneOf)
    this.setState({field: event.target.value, oneOf: this.state.oneOf})
  }

  pickedCategoryActionForFilter = (selected: string[] | number[] | boolean[] | DateTime[]) => {
    const {handleAction, filters} = this.props;
    const {field} = this.state;
    console.log(filters);
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
    this.setState({oneOf: selected})
  }
}

export const FilterAdjuster = (CSSModules(FilterAdjusterBase, styles));