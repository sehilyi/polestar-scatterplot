import * as React from "react";
import * as CSSModules from 'react-css-modules';
import * as styles from "./actionable-new-vis.scss";
import {Logger} from "../../util/util.logger";
import {VegaLite} from "../../vega-lite";
import {GuidelineItem} from "../../../models/guidelines";
import {InlineData} from "../../../../node_modules/vega-lite/build/src/data";
import {FacetedCompositeUnitSpec} from "../../../../node_modules/vega-lite/build/src/spec";
import {Themes} from "../../../models/theme/theme";
import {GUIDELINE_TOGGLE_IGNORE_ITEM, ActionHandler, GuidelineAction, SPEC_FIELD_ADD, SpecAction, SPEC_FUNCTION_CHANGE, SpecMarkChangeType, SPEC_MARK_CHANGE_TYPE} from "../../../actions";
import {QUANTITATIVE} from "../../../../node_modules/vega-lite/build/src/type";
import {RECT} from "../../../../node_modules/vega-lite/build/src/mark";
import {COLOR, X, Y} from "../../../../node_modules/vega-lite/build/src/channel";
import {ShelfId} from "../../../models";

export interface ActionableNewVisProps extends ActionHandler<GuidelineAction | SpecAction | SpecMarkChangeType> {
  item: GuidelineItem;

  //preveiw
  data: InlineData;
  mainSpec: FacetedCompositeUnitSpec;
  theme: Themes;
}

export class ActionableNewVisBase extends React.PureComponent<ActionableNewVisProps, {}> {

  private plotLogger: Logger;
  private vegaLiteWrapper: HTMLElement;

  constructor(props: ActionableNewVisProps) {
    super(props);
  }

  public render() {
    const vegaReady = typeof this.props.mainSpec != "undefined";

    return (
      <div styleName="ac-root">
        <div styleName="guide-previews">
          {/* TODO: do we need ref here? */}
          <div styleName="guide-preview" className="preview" onClick={this.onNewVisClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
            {vegaReady ? this.renderNewVisPreview() : null}
            <i className="fa fa-hand-pointer-o" aria-hidden="true" />
            {' '} Use Binned Scatterplot
          </div>
          <div className="fa-gray" styleName="ignore-button">
            <a onClick={this.onIgnore.bind(this)}>
              <i className="fa fa-eye-slash" aria-hidden="true" />
              {' '} Ignore This Guideline...
            </a>
          </div>
        </div>
      </div>
    );
  }

  private onNewVisClick() {

    // mark as rect
    this.props.handleAction({
      type: SPEC_MARK_CHANGE_TYPE,
      payload: RECT
    });

    // color as count
    this.props.handleAction({
      type: SPEC_FIELD_ADD,
      payload: {
        shelfId: {channel: COLOR},
        fieldDef: {field: '*', fn: 'count', type: 'quantitative'},
        replace: true
      }
    });

    // bin x
    this.props.handleAction({
      type: SPEC_FUNCTION_CHANGE,
      payload: {
        shelfId: {channel: X},
        fn: 'bin'
      }
    });

    // bin y
    this.props.handleAction({
      type: SPEC_FUNCTION_CHANGE,
      payload: {
        shelfId: {channel: Y},
        fn: 'bin'
      }
    });
  }

  private onIgnore() {
    const {item} = this.props;
    this.props.handleAction({
      type: GUIDELINE_TOGGLE_IGNORE_ITEM,
      payload: {item}
    });
  }

  private vegaLiteWrapperRefHandler = (ref: any) => {
    this.vegaLiteWrapper = ref;
  }

  private renderNewVisPreview() {
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;

    //TODO: What should we do when color have a field?
    previewSpec.encoding.color = {
      aggregate: "count",
      field: "*",
      type: QUANTITATIVE
    };

    previewSpec.encoding.x = {
      ...previewSpec.encoding.x,
      bin: true
    };

    previewSpec.encoding.y = {
      ...previewSpec.encoding.x,
      bin: true
    };

    previewSpec.mark = RECT;

    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} />
    );
  }
}

export const ActionableNewVis = CSSModules(ActionableNewVisBase, styles);