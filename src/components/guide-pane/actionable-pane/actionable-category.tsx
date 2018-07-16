import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './actionable-category.scss';
import {DateTime} from 'vega-lite/build/src/datetime';
import {ShelfUnitSpec, Schema, toTransforms, ShelfFilter, filterHasField, filterIndexOf, ShelfWildcardChannelId} from '../../../models';
import {ActionHandler, SpecAction, SPEC_COLOR_SCALE_SPECIFIED, SPEC_FIELD_REMOVE, LogAction, FILTER_MODIFY_ONE_OF, FilterAction, FILTER_ADD} from '../../../actions';
import {ACTIONABLE_SELECT_CATEGORIES, GuidelineAction, ACTIONABLE_MODIFY_ONE_OF_CATEGORIES, GUIDELINE_TOGGLE_IGNORE_ITEM, GUIDELINE_SET_USER_ACTION_TYPE} from '../../../actions/guidelines';
import {GuidelineItemActionableCategories, getDefaultCategoryPicks, guideActionShelf, getRange, Actionables} from '../../../models/guidelines';
import {VegaLite} from '../../vega-lite';
import {InlineData} from 'vega-lite/build/src/data';
import {FacetedCompositeUnitSpec} from 'vega-lite/build/src/spec';
import {Logger} from '../../util/util.logger';
import {Themes} from '../../../models/theme/theme';
import {OneOfFilter} from 'vega-lite/build/src/filter';
import {CategoryPicker} from './actionable-common-ui/category-picker';
import {Channel} from '../../../../node_modules/vega-lite/build/src/channel';

export interface ActionableCategoryProps extends ActionHandler<GuidelineAction | SpecAction | LogAction | FilterAction> {
  item: GuidelineItemActionableCategories;
  field: string;
  channel: Channel;
  domain: string[] | number[] | boolean[] | DateTime[];
  domainWithFilter: string[] | number[] | boolean[] | DateTime[];
  spec: ShelfUnitSpec;
  schema: Schema;

  isSelectionUsing?: boolean;

  //preveiw
  data: InlineData;
  mainSpec: FacetedCompositeUnitSpec;
  theme: Themes;
  filters: ShelfFilter[];
}

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
    const {domain, domainWithFilter, schema, spec, field, handleAction} = this.props;
    const {id, oneOfCategories, selectedCategories} = this.props.item;
    const {triggeredActionable} = this.state;
    const fieldSchema = schema.fieldSchema(field);

    return (
      <div styleName="ac-root">
        <div styleName={triggeredActionable == "NONE" ? "guide-previews" : "guide-previews-hidden"}>
          <div styleName="guide-preview" className="preview" onClick={this.onFilterClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
            {vegaReady ? this.renderFilterCategoriesPreview() : null}
            <i className="fa fa-filter" aria-hidden="true" />
            {' '} Filter Categories
          </div>
          {this.props.isSelectionUsing ?
            <div styleName="guide-preview" className="preview" onClick={this.onSelectClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
              {vegaReady ? this.renderSelectCategoriesPreview() : null}
              <i className="fa fa-hand-pointer-o" aria-hidden="true" />
              {' '} Select Categories\
              </div> :
            null
          }
          <div styleName="guide-preview" className="preview" onClick={this.onRemoveField.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
            {vegaReady ? this.renderRemoveFieldPreview() : null}
            <i className="fa fa-times" aria-hidden="true" />
            {' '} Remove Field
          </div>
          <div className="fa-gray" styleName="ignore-button">
            <a onClick={this.onIgnore.bind(this)}>
              <i className="fa fa-eye-slash" aria-hidden="true" />
              {' '} Ignore This Guideline...
            </a>
          </div>
        </div>
        <div styleName={triggeredActionable == "NONE" ? 'back-button-hidden' : 'back-button'}
          onClick={this.onBackButton.bind(this)}>
          <i className="fa fa-chevron-circle-left" aria-hidden="true" />
          {' '} Back
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
    const {handleAction, item, spec, field} = this.props;

    const {domainWithFilter, schema} = this.props;
    const fieldSchema = schema.fieldSchema(field);
    const fieldDef = {
      field,
      type: fieldSchema.vlType,
      scale: {
        domain: domainWithFilter,
        range: getRange(selected, domainWithFilter)
      }
    };
    handleAction({
      type: ACTIONABLE_SELECT_CATEGORIES,
      payload: {
        item,
        selectedCategories: selected
      }
    });
  }

  pickedCategoryActionForFilter = (selected: string[] | number[] | boolean[] | DateTime[]) => {
    const {handleAction, item, filters, field} = this.props;

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

  private onIgnore() {
    const {item} = this.props;
    this.props.handleAction({
      type: GUIDELINE_TOGGLE_IGNORE_ITEM,
      payload: {item}
    });
  }

  private setUserActionType(type: Actionables) {
    const {item} = this.props;
    this.props.handleAction({
      type: GUIDELINE_SET_USER_ACTION_TYPE,
      payload: {item, type}
    });
  }

  private onBackButton() {
    // this.setUserActionType("NONE");
    this.setState({triggeredActionable: "NONE"});
  }
  private onFilterClick() {
    this.pickedCategoryActionForFilter(getDefaultCategoryPicks(this.props.domainWithFilter));
    // this.setUserActionType("FILTER_CATEGORIES");
    this.setState({triggeredActionable: "FILTER_CATEGORIES"});
  }
  private onSelectClick() {
    this.props.handleAction({
      type: ACTIONABLE_SELECT_CATEGORIES,
      payload: {
        item: this.props.item,
        selectedCategories: getDefaultCategoryPicks(this.props.domainWithFilter)
      }
    });
    // this.setUserActionType("SELECT_CATEGORIES");
    this.setState({triggeredActionable: "SELECT_CATEGORIES"});
  }
  private onRemoveField() {
    // this.setUserActionType("REMOVE_FIELD");
    const {handleAction, channel} = this.props;
    handleAction({
      type: SPEC_FIELD_REMOVE,
      payload: {channel}
    });
    guideActionShelf(
      null,
      null,
      channel,
      null,
      this.props.filters,
      SPEC_FIELD_REMOVE,
      this.props.handleAction
    );
  }

  private vegaLiteWrapperRefHandler = (ref: any) => {
    this.vegaLiteWrapper = ref;
  }

  private renderFilterCategoriesPreview() {
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;
    let oneOf = getDefaultCategoryPicks(this.props.domainWithFilter);
    const {transform} = previewSpec;
    let newFilter: OneOfFilter = {
      field: this.props.field,
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
    let selected = getDefaultCategoryPicks(this.props.domainWithFilter);
    const fieldSchema = this.props.schema.fieldSchema(this.props.field);
    previewSpec.encoding[this.props.channel.toString()] = {
      field: this.props.field,
      type: fieldSchema.vlType,
      scale: {
        domain: this.props.domainWithFilter,
        range: getRange(selected, this.props.domainWithFilter)
      }
    }
    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} />
    );
  }

  private renderRemoveFieldPreview() {
    const {mainSpec, data, channel} = this.props;
    let previewSpec = (JSON.parse(JSON.stringify(mainSpec)));
    delete previewSpec.encoding[channel];
    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={data} />
    );
  }
}

export const ActionableCategory = (CSSModules(ActionableCategoryBase, styles));