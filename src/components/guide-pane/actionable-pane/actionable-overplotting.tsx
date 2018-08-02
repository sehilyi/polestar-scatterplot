import * as React from 'react';
import * as CSSModules from 'react-css-modules';

import * as styles from './actionable-overplotting.scss';
import {Actionables, GuidelineItem, ACTIONABLE_FILTER_GENERAL, ACTIONABLE_POINT_SIZE, ACTIONABLE_POINT_OPACITY, ACTIONABLE_REMOVE_FILL_COLOR, ACTIONABLE_CHANGE_SHAPE, ACTIONABLE_AGGREGATE, ACTIONABLE_ENCODING_DENSITY, ACTIONABLE_SEPARATE_GRAPH} from '../../../models/guidelines';
import {GuidelineAction, ActionHandler, GUIDELINE_TOGGLE_IGNORE_ITEM, LogAction} from '../../../actions';
import {Logger} from '../../util/util.logger';
import {Themes} from '../../../models/theme/theme';
import {FacetedCompositeUnitSpec} from '../../../../node_modules/vega-lite/build/src/spec';
import {InlineData} from '../../../../node_modules/vega-lite/build/src/data';
import {CIRCLE, SQUARE, POINT, Mark, RECT} from '../../../../node_modules/vega-lite/build/src/mark';
import {VegaLite} from '../../vega-lite';
import {QUANTITATIVE, NOMINAL} from '../../../../node_modules/vega-lite/build/src/type';
import {Schema, FieldSchema} from '../../../models';
import {forEach} from '../../../../node_modules/vega-lite/build/src/encoding';

export interface ActionableOverplottingProps extends ActionHandler<GuidelineAction | LogAction> {
  item: GuidelineItem;
  schema: Schema;

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
      removeFill = ACTIONABLE_REMOVE_FILL_COLOR,
      changeShape = ACTIONABLE_CHANGE_SHAPE,
      aggregate = ACTIONABLE_AGGREGATE,
      encodingDensity = ACTIONABLE_ENCODING_DENSITY,
      separateGraph = ACTIONABLE_SEPARATE_GRAPH;

    return (
      // TODO: this should be more general
      <div styleName="ac-root">
        <div styleName={triggeredActionable == "NONE" ? "guide-previews" : "guide-previews-hidden"}>
          {/* TODO: show action filter */}
          <div styleName="guide-preview" className="preview-large" onClick={this.onFilterClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
            {/* TODO: how to best decide the default of the filtering target? */}
            <p styleName="preview-title">
              <i className={filter.faIcon} aria-hidden="true" />
              {' ' + filter.title}
            </p>
            <p styleName='preview-score'>77% experts</p>
            {vegaReady ? this.renderFilterPreview() : null}
            <ul styleName='preview-desc' className='fa-ul'>
              <li><i className="fa-li fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />{filter.pros}</li>
              <li><i className="fa-li fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />{filter.cons}</li>
            </ul>
          </div>
          {vegaReady && this.isChangePointSizeUsing() ?
            <div styleName="guide-preview" className="preview-large" onClick={this.onChangePointSizeClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
              <p styleName="preview-title">
                <i className={pointSize.faIcon} aria-hidden="true" />
                {' ' + pointSize.title}
              </p>
              <p styleName='preview-score'>75% experts</p>
              {vegaReady ? this.renderChangePointSizePreview() : null}
              <ul styleName='preview-desc' className='fa-ul'>
                <li><i className="fa-li fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />{pointSize.pros}</li>
                <li><i className="fa-li fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />{pointSize.cons}</li>
              </ul>
            </div> :
            null
          }
          {vegaReady && this.isChangeOpacityUsing() ?
            <div styleName="guide-preview" className="preview-large" onClick={this.onChangeOpacityClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
              <p styleName="preview-title">
                <i className={pointOpacity.faIcon} aria-hidden="true" />
                {' ' + pointOpacity.title}
              </p>
              <p styleName='preview-score'>72% experts</p>
              {vegaReady ? this.renderChangeOpacityPreview() : null}
              <ul styleName='preview-desc' className='fa-ul'>
                <li><i className="fa-li fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />{pointOpacity.pros}</li>
                <li><i className="fa-li fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />{pointOpacity.cons}</li>
              </ul>
            </div> :
            null
          }
          {vegaReady && this.isRemoveFillColorUsing() ?
            <div styleName="guide-preview" className="preview-large" onClick={this.onRemoveFillColorClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
              <p styleName="preview-title">
                <i className={removeFill.faIcon} aria-hidden="true" />
                {' ' + removeFill.title}
              </p>
              <p styleName='preview-score'>45% experts</p>
              {vegaReady ? this.renderRemoveFillColorPreview() : null}
              <ul styleName='preview-desc' className='fa-ul'>
                <li><i className="fa-li fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />{removeFill.pros}</li>
                <li><i className="fa-li fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />{removeFill.cons}</li>
              </ul>
            </div> :
            null
          }
          {vegaReady && this.isChangeShapeUsing() ?
            <div styleName="guide-preview" className="preview-large" onClick={this.onRemoveFillColorClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
              <p styleName="preview-title">
                <i className={changeShape.faIcon} aria-hidden="true" />
                {' ' + changeShape.title}
              </p>
              <p styleName='preview-score'>42% experts</p>
              {vegaReady ? this.renderChangeShapePreview() : null}
              <ul styleName='preview-desc' className='fa-ul'>
                <li><i className="fa-li fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />{changeShape.pros}</li>
                <li><i className="fa-li fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />{changeShape.cons}</li>
              </ul>
            </div> :
            null
          }
          {vegaReady && this.isAggregateUsing() ?
            <div styleName="guide-preview" className="preview-large" onClick={this.onRemoveFillColorClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
              <p styleName="preview-title">
                <i className={aggregate.faIcon} aria-hidden="true" />
                {' ' + aggregate.title}
              </p>
              <p styleName='preview-score'>38% experts</p>
              {vegaReady ? this.renderAggregatePreview() : null}
              <ul styleName='preview-desc' className='fa-ul'>
                <li><i className="fa-li fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />{aggregate.pros}</li>
                <li><i className="fa-li fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />{aggregate.cons}</li>
              </ul>
            </div> :
            null
          }
          {vegaReady && this.isEncodingDensityUsing() ?
            <div styleName="guide-preview" className="preview-large" onClick={this.onRemoveFillColorClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
              <p styleName="preview-title">
                <i className={encodingDensity.faIcon} aria-hidden="true" />
                {' ' + encodingDensity.title}
              </p>
              <p styleName='preview-score'>18% experts</p>
              {vegaReady ? this.renderEncodingDensityPreview() : null}
              <ul styleName='preview-desc' className='fa-ul'>
                <li><i className="fa-li fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />{encodingDensity.pros}</li>
                <li><i className="fa-li fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />{encodingDensity.cons}</li>
              </ul>
            </div> :
            null
          }
          {vegaReady && this.isSeparateGraphUsing() ?
            <div styleName="guide-preview" className="preview-large" onClick={this.onRemoveFillColorClick.bind(this)} ref={this.vegaLiteWrapperRefHandler} >
              <p styleName="preview-title">
                <i className={separateGraph.faIcon} aria-hidden="true" />
                {' ' + separateGraph.title}
              </p>
              <p styleName='preview-score'>11% experts</p>
              {vegaReady ? this.renderSeparateGraphPreview() : null}
              <ul styleName='preview-desc' className='fa-ul'>
                <li><i className="fa-li fa fa-thumbs-o-up" styleName='pros' aria-hidden="true" />{separateGraph.pros}</li>
                <li><i className="fa-li fa fa-thumbs-o-down" styleName='cons' aria-hidden="true" />{separateGraph.cons}</li>
              </ul>
            </div> :
            null
          }
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
  private isChangeShapeUsing(){
    // TODO:
    return true;
  }
  private isAggregateUsing(){
    // TODO:
    return true;
  }
  private isEncodingDensityUsing(){
    // TODO:
    return true;
  }
  private isSeparateGraphUsing(){
    // TOOD:
    return this.isThereNominalField();
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
  private renderChangeShapePreview(){
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;

    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} />
    );
  }
  private renderAggregatePreview(){
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;

    previewSpec.encoding.x = {
      ...previewSpec.encoding.x,
      aggregate: "mean"
    };

    previewSpec.encoding.y = {
      ...previewSpec.encoding.y,
      aggregate: "mean"
    };

    let field = this.getDefaultNominalFieldName();
    previewSpec.encoding.color = {
      field,
      type: NOMINAL
    };

    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} />
    );
  }
  private renderEncodingDensityPreview(){
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;

    //TODO: What should we do when color have a field?
    previewSpec.encoding.color = {
      aggregate: "count",
      field: "*",
      type: QUANTITATIVE,
      scale: {scheme: "greenblue"}
    };

    previewSpec.encoding.x = {
      ...previewSpec.encoding.x,
      bin: {maxbins:60}
    };

    previewSpec.encoding.y = {
      ...previewSpec.encoding.y,
      bin: {maxbins:60}
    };

    previewSpec.mark = RECT;

    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} />
    );
  }
  private renderSeparateGraphPreview(){
    let previewSpec = (JSON.parse(JSON.stringify(this.props.mainSpec))) as FacetedCompositeUnitSpec;
    // console.log(previewSpec);

    // Select nominal field by default
    let field = this.getDefaultNominalFieldName();
    previewSpec.encoding = {
      ...previewSpec.encoding,
      column: {
        field,
        type: NOMINAL
      }
    }
    return (
      <VegaLite spec={previewSpec} logger={this.plotLogger} data={this.props.data} />
    );
  }

  private getDefaultNominalFieldName(){
    for(let f of this.props.schema.fieldSchemas){
      if(f.vlType == NOMINAL)
        return f.name;
    }
    return null;
  }

  private isThereNominalField(){
    for(let f of this.props.schema.fieldSchemas){
      if(f.vlType == NOMINAL)
        return true;
    }
    return false;
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