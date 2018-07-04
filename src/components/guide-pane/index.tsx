import React = require("react");
import {connect} from "react-redux";
import {State} from "../../models";
import * as styles from "./guide-pane.scss"
import * as CSSModules from 'react-css-modules';
import {GuideNotification} from "./guide-notification";
import {GuidelineItem, Guidelines, GUIDELINE_TOO_MANY_CATEGORIES} from "../../models/guidelines";
import {selectGuidelines} from "../../selectors";
import {ActionHandler, createDispatchHandler, SPEC_FIELD_ADD, SPEC_FIELD_MOVE, SPEC_FIELD_REMOVE} from "../../actions";
import {Action} from "../../actions/index";
import {GuidelineAction, GUIDELINE_ADD_ITEM, GUIDELINE_REMOVE_ITEM} from "../../actions/guidelines";
import {EncodingShelfProps} from "../../components/encoding-pane/encoding-shelf";
import {COLOR} from "vega-lite/build/src/channel";

export interface GuidePaneProps extends ActionHandler<Action> {
  guidelines: Guidelines;
}

export class GuidePaneBase extends React.PureComponent<GuidePaneProps, {}> {

  constructor(props: GuidePaneProps) {
    super(props);

    // temp
    // let a: GuidelineItem = {title: '카테고리가 너무 많습니다.', category: '시각적 요소', content: '[Job]들을 색깔로 구별하기에 개수가 너무 많아 차트가 이해하기 어렵습니다. 효과적인 차트를 만들기 위해 다음의 조치를 취해주세요.'};
    let b: GuidelineItem = {title: 'Novel Visualization Recommended', category: 'Visualization', content: ''};

    // this.props.guidelines.list.push(a);
    this.props.guidelines.list.push(b);
    //
  }

  public render() {

    const guideNotifis = this.props.guidelines.list.map(this.guideNotification, this);

    return (
      <div className="pane" styleName="guide-pane">
        <a className="right">
          <i className="fa fa-eraser" />
          {' '}
          Clear
        </a>

        <h2>
          {/* <i className="fa fa-bolt" aria-hidden="true"/> */}
          <i className="fa fa-lightbulb-o" aria-hidden="true" />
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

    const {title} = gs;
    const {handleAction} = this.props;
    return (
      <GuideNotification
        key={title}
        item={gs}
        handleAction={handleAction}
      />
    );
  }
}

export const GuidePane = connect(
  (state: State) => {
    return {
      guidelines: selectGuidelines(state)
    };
  },
  createDispatchHandler<GuidelineAction>()
)(CSSModules(GuidePaneBase, styles));

//TODO: make this process more systematic
//1) every guideline must have their own id
export function guideActionShelf(props: EncodingShelfProps, type: string) {
  switch (type) {
    case SPEC_FIELD_ADD:
    case SPEC_FIELD_MOVE:
      if (props.id.channel == COLOR) {
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