import React = require("react");
import {connect} from "react-redux";
import {State, Schema, ShelfUnitSpec, ShelfFieldDef} from "../../models";
import * as styles from "./guide-pane.scss"
import * as CSSModules from 'react-css-modules';
import {GuideNotification} from "./guide-notification";
import {GuidelineItem, Guidelines, GUIDELINE_TOO_MANY_CATEGORIES} from "../../models/guidelines";
import {selectGuidelines, selectDataset, selectShelfSpec} from "../../selectors";
import {ActionHandler, createDispatchHandler, SPEC_FIELD_ADD, SPEC_FIELD_MOVE, SPEC_FIELD_REMOVE, ShelfAction} from "../../actions";
import {Action} from "../../actions/index";
import {GuidelineAction, GUIDELINE_ADD_ITEM, GUIDELINE_REMOVE_ITEM} from "../../actions/guidelines";
import {EncodingShelfProps} from "../../components/encoding-pane/encoding-shelf";
import {COLOR} from "vega-lite/build/src/channel";

export interface GuidePaneProps extends ActionHandler<Action> {
  guidelines: Guidelines;

  schema: Schema;
  spec: ShelfUnitSpec;
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

        <h2>
          <i className="fa fa-bolt" aria-hidden="true"/>
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
    const {handleAction, schema, spec} = this.props;
    return (
      <GuideNotification
        key={id}
        item={gs}
        schema={schema}
        spec={spec}
        handleAction={handleAction}
      />
    );
  }
}

export const GuidePane = connect(
  (state: State) => {
    return {
      guidelines: selectGuidelines(state),

      schema: selectDataset(state).schema,
      spec: selectShelfSpec(state),
    };
  },
  createDispatchHandler<GuidelineAction>()
)(CSSModules(GuidePaneBase, styles));

//TODO: make this process more systematic
//1) every guideline must have their own id
export function guideActionShelf(props: EncodingShelfProps, fieldDefs: ShelfFieldDef, type: string) {
  let domain = props.schema.domain({field: fieldDefs.field.toString()});

  switch (type) {
    case SPEC_FIELD_ADD:
    case SPEC_FIELD_MOVE:
      if (props.id.channel == COLOR && domain.length > 10 && fieldDefs.type == "nominal") {
        props.handleAction({
          type: GUIDELINE_ADD_ITEM,
          payload: {
            item: GUIDELINE_TOO_MANY_CATEGORIES
          }
        });
      }
      break;
    case SPEC_FIELD_REMOVE:
      if (props.id.channel == COLOR) {
        props.handleAction({
          type: GUIDELINE_REMOVE_ITEM,
          payload: {
            item: GUIDELINE_TOO_MANY_CATEGORIES
          }
        });
      }
      break;
  }
}