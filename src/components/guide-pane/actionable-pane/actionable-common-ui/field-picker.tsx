import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './field-picker.scss';
import {Schema} from '../../../../models';

export interface FieldPickerProps {
  id: string;
  title?: string;
  subtitle?: string;
  fields: string[];
  schema: Schema;
  defaultField: string;
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
    const {id, title, subtitle, fields, schema} = this.props;
    const fieldPicker = (fields as any[]).map(option => {
      return (
        <div key={option} className='option-div' styleName='option-row'>
          <label>
            <input
              name={id}
              value={option}
              type='radio'
              disabled={schema.domain({field: option}).length > 10}
              checked={option == this.state.selectedField}
              onChange={this.toggleRadio.bind(this, option)}
            /> {'' + option}
          </label>
          <span>
            {'(' + schema.domain({field: option}).length + ' categories)'}
          </span>
        </div>
      );
    });
    return (
      <div id={id}>
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
    // const valueIndex = (selected as any[]).indexOf(option);
    // let changedSelectedValues;
    // if (valueIndex === -1) {
    //   changedSelectedValues = insertItemToArray(selected, selected.length, option);
    // } else {
    //   changedSelectedValues = removeItemFromArray(selected, valueIndex).array;
    // }
    pickedFieldAction(option);
  }
}

export const FieldPicker = (CSSModules(FieldPickerBase, styles));