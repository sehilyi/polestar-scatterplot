import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './actionable-overplotting.scss';
import {Actionables, GuidelineItem} from '../../../models/guidelines';
import {GuidelineAction, ActionHandler, GUIDELINE_TOGGLE_IGNORE_ITEM, LogAction} from '../../../actions';
import {Logger} from '../../util/util.logger';
import {Themes} from '../../../models/theme/theme';
import {FacetedCompositeUnitSpec} from '../../../../node_modules/vega-lite/build/src/spec';
import {InlineData} from '../../../../node_modules/vega-lite/build/src/data';
import {CIRCLE, SQUARE, POINT, Mark} from '../../../../node_modules/vega-lite/build/src/mark';
import {VegaLite} from '../../vega-lite';

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
          <div styleName="guide-preview" className="preview-large" onClick={this.onFilterClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
            {/* TODO: move title to the head? */}
            {/* TODO: how to best decide the default of the filtering target? */}
            Filter {' '}
            <i className="fa fa-filter" aria-hidden="true" />
            {vegaReady ? this.renderFilterPreview() : null}
          </div>
          {vegaReady && this.isChangePointSizeUsing() ?
            <div styleName="guide-preview" className="preview-large" onClick={this.onChangePointSizeClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
              Change Point Size {' '}
              <i className="fa fa-compress" aria-hidden="true" />
              {vegaReady ? this.renderChangePointSizePreview() : null}
            </div> :
            null
          }
          {vegaReady && this.isChangeOpacityUsing() ?
            <div styleName="guide-preview" className="preview-large" onClick={this.onChangeOpacityClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
              Change Opacity {' '}
              <i className="fa fa-tint" aria-hidden="true" />
              {vegaReady ? this.renderChangeOpacityPreview() : null}
            </div> :
            null
          }
          {vegaReady && this.isRemoveFillColorUsing() ?
            <div styleName="guide-preview" className="preview-large" onClick={this.onRemoveFillColorClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
              Remove Fill Color {' '}
              <i className="fa fa-circle-o" aria-hidden="true" />
              {vegaReady ? this.renderRemoveFillColorPreview() : null}
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
      else {
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
    // TODO: how to set default filter?
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;
    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} />
    );
  }
  private renderChangePointSizePreview() {
    // TODO: handle a case where size is already used
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;
    previewSpec.encoding = {
      ...previewSpec.encoding,
      size: {value: 10}
    }
    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} />
    );
  }
  private renderChangeOpacityPreview() {
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;
    previewSpec.encoding = {
      ...previewSpec.encoding,
      opacity: {value: 0.3}
    }
    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} />
    );
  }
  private renderRemoveFillColorPreview() {
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;
    previewSpec.mark = {
      type: previewSpec.mark as Mark,
      filled: false
    };
    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} />
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