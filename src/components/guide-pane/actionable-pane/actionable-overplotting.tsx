import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './actionable-overplotting.scss';
import {Actionables, GuidelineItem} from '../../../models/guidelines';
import {GuidelineAction, ActionHandler, GUIDELINE_TOGGLE_IGNORE_ITEM, LogAction} from '../../../actions';
import {Logger} from '../../util/util.logger';
import {Themes} from '../../../models/theme/theme';
import {FacetedCompositeUnitSpec} from '../../../../node_modules/vega-lite/build/src/spec';
import {InlineData} from '../../../../node_modules/vega-lite/build/src/data';
import {CIRCLE, SQUARE} from '../../../../node_modules/vega-lite/build/src/mark';

export interface ActionableOverplottingProps extends ActionHandler<GuidelineAction | LogAction> {
  item: GuidelineItem;

  //preveiw
  data: InlineData;
  mainSpec: FacetedCompositeUnitSpec;
  theme: Themes;
}

export interface ActionableOverplottingState {
  triggeredActionable: Actionables;
}

export class ActionableOverplottingBase extends React.PureComponent<ActionableOverplottingProps, ActionableOverplottingState>{

  private plotLogger: Logger;
  private vegaLiteWrapper: HTMLElement;

  constructor(props: ActionableOverplottingProps) {
    super(props);
    this.state = ({
      triggeredActionable: "NONE"
    });
    this.plotLogger = new Logger(props.handleAction);
  }

  public render() {
    const vegaReady = typeof this.props.mainSpec != 'undefined';
    const {triggeredActionable} = this.state;
    return (
      // TODO: this should be more general
      <div styleName="ac-root">
        <div styleName={triggeredActionable == "NONE" ? "guide-previews" : "guide-previews-hidden"}>
          {/* TODO: show action filter */}
          <div styleName="guide-preview" className="preview" onClick={this.onFilterClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
            {/* TODO: move title to the head? */}
            {/* TODO: how to best decide the default of the filtering target? */}
            <i className="fa fa-filter" aria-hidden="true" />
            {' '} Filter
            {vegaReady ? this.renderFilterPreview() : null}
          </div>
          {vegaReady && this.isChangePointSizeUsing() ?
            <div styleName="guide-preview" className="preview" onClick={this.onChangePointSizeClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
              <i className="fa fa-hand-pointer-o" aria-hidden="true" />
              {' '} Change Point Size
              {vegaReady ? this.renderChangePointSizePreview() : null}
            </div> :
            null
          }
          {vegaReady && this.isChangeOpacityUsing() ?
            <div styleName="guide-preview" className="preview" onClick={this.onChangeOpacityClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
              {vegaReady ? this.renderChangeOpacityPreview() : null}
              <i className="fa fa-times" aria-hidden="true" />
              {' '} Change Opacity
            </div> :
            null
          }
          {vegaReady && this.isRemoveFillColorUsing() ?
            <div styleName="guide-preview" className="preview" onClick={this.onRemoveFillColorClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
              {vegaReady ? this.renderRemoveFillColorPreview() : null}
              <i className="fa fa-times" aria-hidden="true" />
              {' '} Remove Fill Color
            </div> :
            null
          }
          {/* TODO: Add more */}
          <div className="fa-gray" styleName="ignore-button">
            <a onClick={this.onIgnore.bind(this)}>
              <i className="fa fa-eye-slash" aria-hidden="true" />
              {' '} Ignore This Guideline...
            </a>
          </div>
        </div>
        <div styleName={triggeredActionable == "NONE" ? 'back-button-hidden' : 'back-button'}
          onClick={this.onBackButton.bind(this)}>
          <i className="fa fa-chevron-circle-left" aria-hidden="true" />
          {' '} Back
        </div>
      </div>
    );
  }

  private isChangePointSizeUsing() {
    // TODO:
    return true;
  }
  private isChangeOpacityUsing() {
    // TODO:
    return true;
  }
  private isRemoveFillColorUsing() {
    const {mainSpec} = this.props;
    const {encoding, mark} = mainSpec;
    try {
      if (mark == CIRCLE || mark == SQUARE) {
        return true;
      }
      else{
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  private onFilterClick() {

  }
  private onChangePointSizeClick() {

  }
  private onChangeOpacityClick() {

  }
  private onRemoveFillColorClick() {

  }

  private renderFilterPreview() {
    return (
      <div></div>
    );
  }
  private renderChangePointSizePreview() {
    return (
      <div></div>
    );
  }
  private renderChangeOpacityPreview() {
    return (
      <div></div>
    );
  }
  private renderRemoveFillColorPreview() {
    return (
      <div></div>
    );
  }

  private onIgnore() {
    const {item} = this.props;
    this.props.handleAction({
      type: GUIDELINE_TOGGLE_IGNORE_ITEM,
      payload: {item}
    });
  }

  private onBackButton() {
    this.setState({triggeredActionable: "NONE"});
  }

  private vegaLiteWrapperRefHandler = (ref: any) => {
    this.vegaLiteWrapper = ref;
  }
}

export const ActionableOverplotting = (CSSModules(ActionableOverplottingBase, styles));