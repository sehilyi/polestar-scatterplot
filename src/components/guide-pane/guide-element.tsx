import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from "./guide-element.scss";
import {GuidelineItemTypes, GuidelineItemActionableCategories, getGuidedSpec} from '../../models/guidelines';
import {ActionHandler} from '../../actions';
import {GuidelineAction} from '../../actions/guidelines';
import {Schema, ShelfUnitSpec, ShelfFilter} from '../../models';
import {InlineData} from 'vega-lite/build/src/data';
import {FacetedCompositeUnitSpec} from 'vega-lite/build/src/spec';
import {Themes} from '../../models/theme/theme';
import {ActionableOverplotting} from './actionable-pane/actionable-overplotting';
import {StudySetting} from '../../models/study';

export interface GuideElementProps extends ActionHandler<GuidelineAction> {
  item: GuidelineItemTypes;

  schema: Schema;
  spec: ShelfUnitSpec;

  // for vega preview
  data: InlineData;
  mainSpec: FacetedCompositeUnitSpec;
  filters: ShelfFilter[];
  theme: Themes;
  studySetting: StudySetting;

  // TODO: try to remove this
  guidelines: GuidelineItemTypes[];
}

export interface GuideElementState {
  isExpanded: boolean;
}

export class GuideElementBase extends React.PureComponent<GuideElementProps, GuideElementState> {

  constructor(props: GuideElementProps) {
    super(props);
    this.state = ({
      isExpanded: true
    })

    this.onOpenGuide = this.onOpenGuide.bind(this);
  }

  public render() {

    if (this.state.isExpanded === true && this.props.item.guideState == "IGNORE")
      this.setState({isExpanded: false});


    return (
      <div styleName={this.state.isExpanded ? "expanded" : "guideline"}>
        <div styleName="actionable-pane">
          {this.renderActionablePane()}
        </div>
      </div>
    );
  }
  private renderActionablePane() {
    const {id} = this.props.item;
    const {item, schema, handleAction, data, mainSpec, theme, filters, guidelines, studySetting} = this.props;

    switch (id) {
      case 'GUIDELINE_OVER_PLOTTING': {
        return (
          <ActionableOverplotting
            item={item as GuidelineItemActionableCategories}
            schema={schema}
            filters={filters}
            handleAction={handleAction}
            studySetting={studySetting}

            // for vega preview
            data={data}
            mainSpec={getGuidedSpec(mainSpec, guidelines, schema)}
            theme={theme}
          />
        );
      }
      case "GUIDELINE_NONE":
        break;
    }
  }

  private onOpenGuide() {
    this.setState({
      isExpanded: !this.state.isExpanded
    });
  }
}

export const GuideElement = CSSModules(GuideElementBase, styles);