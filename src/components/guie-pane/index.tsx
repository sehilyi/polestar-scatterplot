import React = require("react");
import {connect} from "react-redux";
import {State} from "../../models";
import * as styles from "./guide-pane.scss"
import * as CSSModules from 'react-css-modules';

export interface GuidePaneProps {

}

class GuidePaneBase extends React.PureComponent<GuidePaneProps, {}> {
  public render() {
    return (
      <div className="pane" styleName="guide-pane">
        <a className="right">
          <i className="fa fa-eraser" />
          {' '}
          Clear
        </a>

        <h2>
          Guideline
        </h2>
      </div>
    );
  }
}

export const GuidePane = connect(
  (state: State) => {
    return {

    };
  }
)(CSSModules(GuidePaneBase, styles));