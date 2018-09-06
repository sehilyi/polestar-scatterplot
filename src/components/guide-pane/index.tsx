import React = require("react");
import {connect} from "react-redux";
import {State, Schema, ShelfUnitSpec, toTransforms} from "../../models";
import * as styles from "./guide-pane.scss"
import * as CSSModules from 'react-css-modules';
import {GuideElement} from "./guide-element";
import {GuidelineItem, Guidelines} from "../../models/guidelines";
import {selectGuidelines, selectDataset, selectShelfSpec, selectFilteredData, selectMainSpec, selectTheme, selectFilters, selectStudySetting} from "../../selectors";
import {ActionHandler, createDispatchHandler, SpecAction, LogAction, SpecMarkChangeType} from "../../actions";
import {Action} from "../../actions/index";
import {GuidelineAction} from "../../actions/guidelines";
import {InlineData} from "vega-lite/build/src/data";
import {FacetedCompositeUnitSpec} from "vega-lite/build/src/spec";
import {Themes} from "../../models/theme/theme";
import {OneOfFilter, RangeFilter} from "../../../node_modules/vega-lite/build/src/filter";
import {StudySetting} from "../../models/study";

export interface GuidePaneProps extends ActionHandler<Action> {
  guidelines: Guidelines;

  schema: Schema;
  spec: ShelfUnitSpec;

  // for vega preview
  data: InlineData;
  mainSpec: FacetedCompositeUnitSpec;
  filters: Array<RangeFilter | OneOfFilter>;
  theme: Themes;
  studySetting: StudySetting;
}

export class GuidePaneBase extends React.PureComponent<GuidePaneProps, {}> {

  constructor(props: GuidePaneProps) {
    super(props);
  }

  public render() {
    const {list} = this.props.guidelines;
    const guideElements = list.map(this.guideElement, this);

    return (
      <div className="pane" styleName="guide-pane">

        <h2 className="H2-in-guideline">
          <i className="fa fa-bolt" aria-hidden="true" />
          {' '}
          {/* Recommendations */}
          추천 시각화
          {/* {' (' + list.length + ')'} */}
        </h2>

        <div styleName="guide-group">
          {guideElements}
        </div>
      </div>
    );
  }


  private guideElement(gs: GuidelineItem) {

    const {id} = gs;
    const {handleAction, schema, spec, data, theme, filters, mainSpec, guidelines, studySetting} = this.props;

    return (
      <GuideElement
        key={id}
        item={gs}
        schema={schema}
        spec={spec}
        handleAction={handleAction}

        data={data}
        mainSpec={typeof mainSpec == "undefined" ? undefined : this.specWithFilter}
        theme={theme}
        filters={filters}
        studySetting={studySetting}
        //TODO: try to remove this
        guidelines={guidelines.list}
      />
    );
  }
  private get specWithFilter() {
    const {mainSpec, filters} = this.props;
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

      // for vega preview
      data: selectFilteredData(state),
      mainSpec: selectMainSpec(state),
      theme: selectTheme(state),
      filters: selectFilters(state),
      studySetting: selectStudySetting(state)
    };
  },
  createDispatchHandler<GuidelineAction | SpecAction | LogAction | SpecMarkChangeType>()
)(CSSModules(GuidePaneBase, styles));