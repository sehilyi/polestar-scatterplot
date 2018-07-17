import * as React from "react";
import * as CSSModules from 'react-css-modules';
import * as styles from "./actionable-new-vis.scss";

export interface ActionableNewVisProps {

}

export class ActionableNewVisBase extends React.PureComponent<ActionableNewVisProps, {}> {
  constructor(props: ActionableNewVisProps) {
    super(props);
  }

  public render() {
    return (
      <div />
    );
  }
}

export const ActionableNewVis = CSSModules(ActionableNewVisBase, styles);