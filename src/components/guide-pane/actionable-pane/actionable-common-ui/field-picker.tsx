import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './field-picker.scss';
import {Schema, filterIndexOf, filterHasField, ShelfFilter} from '../../../../models';
import {OneOfFilter} from 'vega-lite/build/src/filter';
import {DEFAULT_NONE_USED_STR} from '../../../../models/guidelines';

export interface FieldPickerProps {
  id: string;
  title?: string;
  subtitle?: string;
  fields: string[];
  schema: Schema;
  filters: ShelfFilter[];
  defaultField: string;
  disableThreshold: number;
  pickedFieldAction: (picked: string) => void;
}

export interface FieldPickerState {
  selectedField: string;
}

export class FieldPickerBase extends React.PureComponent<FieldPickerProps, FieldPickerState>{
  constructor(props: FieldPickerProps) {
    super(props);
    this.state = {
      selectedField: this.props.defaultField
    }
  }

  public render() {
    const {id, title, subtitle, fields, filters, schema, disableThreshold} = this.props;
    const fieldPicker = (fields as any[]).map(option => {
      const isNone = option == DEFAULT_NONE_USED_STR;
      const length = isNone ? 0 : filterHasField(filters, option) ?
        (filters[filterIndexOf(filters, option)] as OneOfFilter).oneOf.length :
        schema.domain({field: option}).length;
      return (
        <div key={option} className='option-div' styleName='option-row'>
          <label>
            <input
              name={id}
              value={option}
              type='radio'
              disabled={length > disableThreshold}
              checked={option == this.state.selectedField}
              onChange={this.toggleRadio.bind(this, option)}
            />
            {'' + option}
            {/* Korean */}
            {/* {length > disableThreshold ? ' - 카테고리가 너무 많습니다. 필터 후 사용하세요.' : ''} */}
            {length > disableThreshold ? ' - There are too many categories. Fiter categories in advance.' : ''}
          </label>
          {isNone ? null :
            <span>
              {/* Korean */}
              {/* {'(' + length + ' 카테고리)'} */}
              {'(' + length + ' Categories)'}
            </span>
          }
        </div>
      );
    });
    return (
      <div id={id} styleName='field-picker'>
        {title != '' ?
          <h2>{title}</h2> :
          null
        }
        {subtitle != '' ?
          <h3>{subtitle}</h3> :
          null
        }
        {fieldPicker}
      </div>
    );
  }

  private toggleRadio(option: string) {
    const {pickedFieldAction} = this.props;
    this.setState({selectedField: option});
    pickedFieldAction(option);
  }
}

export const FieldPicker = (CSSModules(FieldPickerBase, styles));