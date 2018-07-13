import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './actionable-category.scss';
import {DateTime} from 'vega-lite/build/src/datetime';
import {ShelfUnitSpec, Schema, toTransforms, ShelfFilter, filterHasField, filterIndexOf} from '../../../models';
import {ActionHandler, SpecAction, SPEC_COLOR_SCALE_SPECIFIED, SPEC_FIELD_REMOVE, LogAction, FILTER_MODIFY_ONE_OF, FilterAction, FILTER_ADD} from '../../../actions';
import {ACTIONABLE_SELECT_CATEGORIES, GuidelineAction, ACTIONABLE_MODIFY_ONE_OF_CATEGORIES} from '../../../actions/guidelines';
import {GuidelineItemActionableCategories, getDefaultCategoryPicks} from '../../../models/guidelines';
import {COLOR} from 'vega-lite/build/src/channel';
import {VegaLite} from '../../vega-lite';
import {InlineData} from 'vega-lite/build/src/data';
import {FacetedCompositeUnitSpec} from 'vega-lite/build/src/spec';
import {Logger} from '../../util/util.logger';
import {Themes} from '../../../models/theme/theme';
import {OneOfFilter} from 'vega-lite/build/src/filter';
import {CategoryPicker} from './actionable-common-ui/category-picker';

export interface ActionableCategoryProps extends ActionHandler<GuidelineAction | SpecAction | LogAction | FilterAction> {
  item: GuidelineItemActionableCategories;
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

//TODO: Later, this could be more systematic, including all kinds of actionables in all guidelines
export type Actionables = "FILTER_CATEGORIES" | "SELECT_CATEGORIES" | "REMOVE_FIELD" | "NONE";

export interface ActionableCategoryState {
  hideSearchBar: boolean;
  triggeredActionable: Actionables;
}

export class ActionableCategoryBase extends React.PureComponent<ActionableCategoryProps, ActionableCategoryState>{

  private plotLogger: Logger;
  private vegaLiteWrapper: HTMLElement;

  constructor(props: ActionableCategoryProps) {
    super(props);
    this.state = ({
      hideSearchBar: true,
      triggeredActionable: "NONE"
    });

    this.plotLogger = new Logger(props.handleAction);
  }

  public render() {
    const vegaReady = typeof this.props.mainSpec != "undefined";
    const {domain, domainWithFilter, schema, spec, handleAction} = this.props;
    const {id, oneOfCategories, selectedCategories} = this.props.item;
    const {triggeredActionable} = this.state;
    let field = spec.encoding.color.field.toString();
    const fieldSchema = schema.fieldSchema(field);

    return (
      <div>
        <div styleName={triggeredActionable == "NONE" ? "guide-previews" : "guide-previews-hidden"}>
          <div styleName="guide-preview" className="preview" onClick={this.onFilterClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
            {vegaReady ? this.renderFilterCategoriesPreview() : null}
            <i className="fa fa-filter" aria-hidden="true" />
            {' '} Filter Categories
          </div>
          <div styleName="guide-preview" className="preview" onClick={this.onSelectClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
            {vegaReady ? this.renderSelectCategoriesPreview() : null}
            <i className="fa fa-hand-pointer-o" aria-hidden="true" />
            {' '} Select Categories
          </div>
          <div styleName="guide-preview" className="preview" onClick={this.onRemoveField.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
            {vegaReady ? this.renderRemoveFieldPreview() : null}
            <i className="fa fa-times" aria-hidden="true" />
            {' '} Remove Field
          </div>
        </div>
        <div styleName={triggeredActionable == "NONE" ? 'back-button-hidden' : 'back-button'}
          onClick={this.onBackButton.bind(this)}>
          {/* TODO: do we have to put undo button here? */}
          <i className="fa fa-chevron-circle-left" aria-hidden="true" />
          {' '} Move Back
        </div>
        <div styleName={triggeredActionable == "FILTER_CATEGORIES" ? '' : 'hidden'}>
          <CategoryPicker
            id={id + field + "FILTER_CATEGORIES"}
            title='Filter'
            field={field}
            domain={domain}
            selected={oneOfCategories}
            handleAction={handleAction}
            pickedCategoryAction={this.pickedCategoryActionForFilter}
            isCopyFromUI={true}
          />
        </div>
        <div styleName={triggeredActionable == "SELECT_CATEGORIES" ? '' : 'hidden'}>
          <CategoryPicker
            id={id + field + "SELECT_CATEGORIES"}
            title='Select'
            field={field}
            domain={domainWithFilter}
            selected={selectedCategories}
            handleAction={handleAction}
            pickedCategoryAction={this.pickedCategoryActionForSelect}
          />
        </div>
      </div>
    );
  }

  pickedCategoryActionForSelect = (selected: string[] | number[] | boolean[] | DateTime[]) => {
    const {handleAction, item, spec} = this.props;
    let field = spec.encoding.color.field.toString();

    const {domainWithFilter, schema} = this.props;
    const fieldSchema = schema.fieldSchema(field);
    const fieldDef = {
      field,
      type: fieldSchema.vlType,
      scale: {
        domain: domainWithFilter,
        range: this.getRange(selected)
      }
    };
    handleAction({
      type: ACTIONABLE_SELECT_CATEGORIES,
      payload: {
        item,
        selectedCategories: selected
      }
    });
    handleAction({
      type: SPEC_COLOR_SCALE_SPECIFIED,
      payload: {
        fieldDef
      }
    });
  }

  pickedCategoryActionForFilter = (selected: string[] | number[] | boolean[] | DateTime[]) => {
    const {handleAction, item, spec, filters} = this.props;
    let field = spec.encoding.color.field.toString();

    handleAction({
      type: ACTIONABLE_MODIFY_ONE_OF_CATEGORIES,
      payload: {
        item: item,
        oneOfCategories: selected
      }
    });
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
  }

  private onBackButton() {
    this.setState({triggeredActionable: "NONE"});
  }
  private onFilterClick() {
    this.setState({triggeredActionable: "FILTER_CATEGORIES"});
  }
  private onSelectClick() {
    this.setState({triggeredActionable: "SELECT_CATEGORIES"});
  }

  private vegaLiteWrapperRefHandler = (ref: any) => {
    this.vegaLiteWrapper = ref;
  }

  private renderFilterCategoriesPreview() {
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;
    let field = this.props.spec.encoding.color.field.toString();
    let oneOf = getDefaultCategoryPicks(this.props.domainWithFilter);
    const {transform} = previewSpec;
    let newFilter: OneOfFilter = {
      field,
      oneOf
    }
    const newTransform = (transform || []).concat(toTransforms([newFilter]));
    previewSpec.transform = newTransform;

    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} />
    );
  }

  private renderSelectCategoriesPreview() {
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;
    let field = this.props.spec.encoding.color.field.toString();
    let selected = getDefaultCategoryPicks(this.props.domainWithFilter);
    const fieldSchema = this.props.schema.fieldSchema(field);
    previewSpec.encoding.color = {
      field,
      type: fieldSchema.vlType,
      scale: {
        domain: this.props.domainWithFilter,
        range: this.getRange(selected)
      }
    }

    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} />
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

  private onRemoveField() {
    this.props.item.guideState = "IGNORE";
    const {handleAction} = this.props;
    handleAction({
      type: SPEC_FIELD_REMOVE,
      payload: {channel: COLOR}
    });
  }

  //TODO: Any better algorithm for this?
  private getRange(selected: string[] | number[] | boolean[] | DateTime[]): string[] {
    const p = ["#4c78a8", "#f58518", "#e45756", "#72b7b2", "#54a24b", "#eeca3b", "#b279a2", "#ff9da6", "#9d755d", "#bab0ac55"]; //TODO: auto get colors from library
    const r = [];
    let round = 0;
    for (let i of this.props.domain) {
      r.push((((selected as any[]).indexOf(i) !== -1) ? p[round++] : p[p.length - 1]));
      if (round >= p.length - 1) round = 0;
    }
    return r;
  }
}

export const ActionableCategory = (CSSModules(ActionableCategoryBase, styles));