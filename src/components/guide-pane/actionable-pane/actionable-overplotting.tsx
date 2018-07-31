import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './actionable-overplotting.scss';
import {Actionables, GuidelineItem, ACTIONABLE_FILTER_GENERAL, ACTIONABLE_POINT_SIZE, ACTIONABLE_POINT_OPACITY, ACTIONABLE_REMOVE_FILL_COLOR} from '../../../models/guidelines';
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
    const filter = ACTIONABLE_FILTER_GENERAL,
      pointSize = ACTIONABLE_POINT_SIZE,
      pointOpacity = ACTIONABLE_POINT_OPACITY,
      removeFill = ACTIONABLE_REMOVE_FILL_COLOR;
    return (
      // TODO: this should be more general
      <div styleName="ac-root">
        <div styleName={triggeredActionable == "NONE" ? "guide-previews" : "guide-previews-hidden"}>
          {/* TODO: show action filter */}
          <div styleName="guide-preview" className="preview-large" onClick={this.onFilterClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
            {/* TODO: move title to the head? */}
            {/* TODO: how to best decide the default of the filtering target? */}
            <p styleName="preview-title">
              {filter.title + ' '}
              <i className={filter.faIcon} aria-hidden="true" />
            </p>
            {vegaReady ? this.renderFilterPreview() : null}
            <p styleName='preview-desc'>
                <i className="fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />
                {' ' + filter.pros}
                {'\n'}
                <i className="fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />
                {' ' + filter.cons}
              </p>
          </div>
          {vegaReady && this.isChangePointSizeUsing() ?
            <div styleName="guide-preview" className="preview-large" onClick={this.onChangePointSizeClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
              <p styleName="preview-title">
                {pointSize.title + ' '}
                <i className={pointSize.faIcon} aria-hidden="true" />
              </p>
              {vegaReady ? this.renderChangePointSizePreview() : null}
              <p styleName='preview-desc'>
                <i className="fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />
                {' ' + pointSize.pros}
                {'\n'}
                <i className="fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />
                {' ' + pointSize.cons}
              </p>
            </div> :
            null
          }
          {vegaReady && this.isChangeOpacityUsing() ?
            <div styleName="guide-preview" className="preview-large" onClick={this.onChangeOpacityClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
              <p styleName="preview-title">
                {pointOpacity.title + ' '}
                <i className={pointOpacity.faIcon} aria-hidden="true" />
              </p>
              {vegaReady ? this.renderChangeOpacityPreview() : null}
              <p styleName='preview-desc'>
                <i className="fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />
                {' ' + pointOpacity.pros}
                {'\n'}
                <i className="fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />
                {' ' + pointOpacity.cons}
              </p>
            </div> :
            null
          }
          {vegaReady && this.isRemoveFillColorUsing() ?
            <div styleName="guide-preview" className="preview-large" onClick={this.onRemoveFillColorClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
              <p styleName="preview-title">
                {removeFill.title + ' '}
                <i className={removeFill.faIcon} aria-hidden="true" />
              </p>
              {vegaReady ? this.renderRemoveFillColorPreview() : null}
              <p styleName='preview-desc'>
                <i className="fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />
                {' ' + removeFill.pros}
                {'\n'}
                <i className="fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />
                {' ' + removeFill.cons}
              </p>
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