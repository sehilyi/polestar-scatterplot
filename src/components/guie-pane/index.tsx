import React = require("react");
import {connect} from "react-redux";
import {State} from "../../models";
import * as styles from "./guide-pane.scss"
import * as CSSModules from 'react-css-modules';
import {GuideNotification} from "./guide-notification";

/*
 * Should move to /models
 **/
export interface GuideNotificationModel {
  title: string;

  category?: string;
  isIgnored?: boolean;
}

export interface GuidePaneProps {
  guidelines: GuideNotificationModel[];
}

export class GuidePaneBase extends React.PureComponent<GuidePaneProps, {}> {

  constructor(props: GuidePaneProps) {
    super(props);
  }

  public render() {

    // temp
    let a: GuideNotificationModel = {title: 'Reduce # of Categories', category: 'Visual Encoding'};
    let b: GuideNotificationModel = {title: 'Novel Visualization Recommended', category: 'Visualization'};
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
          Guidelines
        </h2>

        <div styleName="guide-group">
          {guideNotifis}
        </div>

      </div>
    );
  }


  private guideNotification(gs: GuideNotificationModel) {

    const {title} = gs;
    return (
      <GuideNotification
        key={title}
        guide={gs}
      />
    );
  }
}

export const GuidePane = connect(
  (state: State) => {
    return {};
  }
)(CSSModules(GuidePaneBase, styles));