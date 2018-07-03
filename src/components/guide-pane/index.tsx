import React = require("react");
import {connect} from "react-redux";
import {State} from "../../models";
import * as styles from "./guide-pane.scss"
import * as CSSModules from 'react-css-modules';
import {GuideNotification} from "./guide-notification";
import {GuidelineItem, Guidelines} from "../../models/guidelines";
import {selectGuidelines} from "../../selectors";
import {ActionHandler, Action} from "../../actions";

export interface GuidePaneProps extends ActionHandler<Action> {
  guidelines: Guidelines;
}

export class GuidePaneBase extends React.PureComponent<GuidePaneProps, {}> {

  constructor(props: GuidePaneProps) {
    super(props);
  }

  public render() {

    // temp
    let a: GuidelineItem = {title: 'Reduce # of Categories', category: 'Visual Encoding', content: 'Corrently, there are too many visual categories. You can reduce categories by grouping similar categories.'};
    let b: GuidelineItem = {title: 'Novel Visualization Recommended', category: 'Visualization', content: ''};
    let guidelines = [];
    guidelines.push(a);
    guidelines.push(b);
    //

    const guideNotifis = guidelines.map(this.guideNotification, this);

    return (
      <div className="pane" styleName="guide-pane">
        <a className="right">
          <i className="fa fa-eraser" />
          {' '}
          Clear
        </a>

        <h2>
          {/* <i className="fa fa-bolt" aria-hidden="true"/> */}
          <i className="fa fa-lightbulb-o" aria-hidden="true"/>
          {' '}
          Guidelines {' (' + guidelines.length + ')'}
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
        guideHeader={gs}
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
  }
)(CSSModules(GuidePaneBase, styles));