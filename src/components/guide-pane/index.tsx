import React = require("react");
import {connect} from "react-redux";
import {State, Schema, ShelfUnitSpec, ShelfFieldDef, ShelfFilter, toTransforms, filterHasField, filterIndexOf} from "../../models";
import * as styles from "./guide-pane.scss"
import * as CSSModules from 'react-css-modules';
import {GuideNotification} from "./guide-notification";
import {GuidelineItem, Guidelines, GUIDELINE_TOO_MANY_CATEGORIES} from "../../models/guidelines";
import {selectGuidelines, selectDataset, selectShelfSpec, selectFilteredData, selectMainSpec, selectTheme, selectFilters} from "../../selectors";
import {ActionHandler, createDispatchHandler, SPEC_FIELD_ADD, SPEC_FIELD_MOVE, SPEC_FIELD_REMOVE, ShelfAction, SpecAction, LogAction, FILTER_MODIFY_ONE_OF} from "../../actions";
import {Action} from "../../actions/index";
import {GuidelineAction, GUIDELINE_ADD_ITEM, GUIDELINE_REMOVE_ITEM} from "../../actions/guidelines";
import {EncodingShelfProps} from "../../components/encoding-pane/encoding-shelf";
import {COLOR} from "vega-lite/build/src/channel";
import {InlineData} from "vega-lite/build/src/data";
import {FacetedCompositeUnitSpec} from "vega-lite/build/src/spec";
import {Themes} from "../../models/theme/theme";
import {OneOfFilter, RangeFilter} from "../../../node_modules/vega-lite/build/src/filter";
import {OneOfFilterShelfProps} from "../filter-pane/one-of-filter-shelf";

export interface GuidePaneProps extends ActionHandler<Action> {
  guidelines: Guidelines;

  schema: Schema;
  spec: ShelfUnitSpec;

  //for preview
  data: InlineData;
  mainSpec: FacetedCompositeUnitSpec;
  theme: Themes;
  filters: Array<RangeFilter | OneOfFilter>;
}

export class GuidePaneBase extends React.PureComponent<GuidePaneProps, {}> {

  constructor(props: GuidePaneProps) {
    super(props);
  }

  public render() {

    const guideNotifis = this.props.guidelines.list.map(this.guideNotification, this);

    return (
      <div className="pane" styleName="guide-pane">
        {/* <a className="right">
          <i className="fa fa-eraser" />
          {' '}
          Clear
        </a> */}

        <h2 className="H2-in-guideline">
          <i className="fa fa-bolt" aria-hidden="true" />
          {/* <i className="fa fa-lightbulb-o" aria-hidden="true" /> */}
          {' '}
          Guidelines {' (' + this.props.guidelines.list.length + ')'}
        </h2>

        <div styleName="guide-group">
          {guideNotifis}
        </div>

      </div>
    );
  }


  private guideNotification(gs: GuidelineItem) {

    const {id} = gs;
    const {handleAction, schema, spec, data, theme, filters, mainSpec} = this.props;

    return (
      <GuideNotification
        key={id}
        item={gs}
        schema={schema}
        spec={spec}
        handleAction={handleAction}

        data={data}
        mainSpec={typeof mainSpec == "undefined" ? undefined : this.specWithFilter}
        theme={theme}
        filters={filters}
      />
    );
  }
  private get specWithFilter() {
    const {mainSpec, filters} = this.props;
    // console.log(filters);
    const transform = (mainSpec.transform || []).concat(toTransforms(filters));
    return {
      ...mainSpec,
      ...(transform.length > 0 ? {transform} : {})
    };
  }
}

export const GuidePane = connect(
  (state: State) => {
    return {
      guidelines: selectGuidelines(state),

      schema: selectDataset(state).schema,
      spec: selectShelfSpec(state),

      //for preview
      data: selectFilteredData(state),
      mainSpec: selectMainSpec(state),
      theme: selectTheme(state),
      filters: selectFilters(state),
    };
  },
  createDispatchHandler<GuidelineAction | SpecAction | LogAction>()
)(CSSModules(GuidePaneBase, styles));