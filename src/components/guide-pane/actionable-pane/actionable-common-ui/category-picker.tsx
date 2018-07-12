import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './category-picker.scss';
import {DateTime} from 'vega-lite/build/src/datetime';
import {Field} from '../../../field';

export interface CategoryPickerProps {
  field: string;
  domain: string[] | number[] | boolean[] | DateTime[];
  selected: string[] | number[] | boolean[] | DateTime[];
}

export class CategoryPickerBase extends React.PureComponent<CategoryPickerProps, {}>{
  constructor(props: CategoryPickerProps) {
    super(props);
  }

  public render() {
    const {field, selected} = this.props;
    const fieldDef = {field, selected}
    return (
      <Field
        draggable={false}
        fieldDef={fieldDef}
        caretShow={true}
        isPill={true}
      />
      // {this.renderCategorySelector()}
    );
  }
}

export const CategoryPicker = (CSSModules(CategoryPickerBase, styles));