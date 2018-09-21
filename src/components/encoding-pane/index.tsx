import {Schema} from 'compassql/build/src/schema';
import {SHORT_WILDCARD} from 'compassql/build/src/wildcard';
import * as React from 'react';
import * as CSSModules from 'react-css-modules';
import {connect} from 'react-redux';
import {Channel} from 'vega-lite/build/src/channel';
import {OneOfFilter, RangeFilter} from 'vega-lite/build/src/filter';
import {FilterAction} from '../../actions';
import {ActionHandler} from '../../actions/index';
import {createDispatchHandler} from '../../actions/redux-action';
import {ResultAsyncAction} from '../../actions/result';
import {ShelfAction, SPEC_CLEAR, FILTER_CLEAR} from '../../actions/shelf';
import {ShelfUnitSpec, State} from '../../models';
import {VoyagerConfig} from '../../models/config';
import {ShelfFieldDef} from '../../models/shelf';
import {selectConfig, selectDataset, selectShelfPreview} from '../../selectors';
import {selectSchemaFieldDefs} from '../../selectors/index';
import {selectFilters, selectShelfSpec} from '../../selectors/shelf';
import {FilterPane} from '../filter-pane';
import * as styles from './encoding-pane.scss';
import {EncodingShelf} from './encoding-shelf';
import {MarkPicker} from './mark-picker';
import {GuidelineAction, GUIDELINE_CLEAR} from '../../actions/guidelines';
import {checkGuideline} from '../../models/guidelines';

interface EncodingPanelProps extends ActionHandler<ShelfAction | ResultAsyncAction | FilterAction | GuidelineAction> {
  spec: ShelfUnitSpec;

  specPreview: ShelfUnitSpec;

  filters: Array<RangeFilter | OneOfFilter>;

  schema: Schema;

  fieldDefs: ShelfFieldDef[];

  config: VoyagerConfig;
}

class EncodingPanelBase extends React.PureComponent<EncodingPanelProps, {}> {
  constructor(props: EncodingPanelProps) {
    super(props);

    // Bind - https://facebook.github.io/react/docs/handling-events.html
    this.onClear = this.onClear.bind(this);
  }

  public render() {
    const {specPreview, spec} = this.props;
    const {wildcards} = this.props.config;
    const {anyEncodings} = specPreview || spec;

    const positionShelves = ['x', 'y'].map(this.encodingShelf, this);
    // Korean
    const facetShelves = ['row', 'column'].slice(2, 2).map(this.encodingShelf, this);
    // const facetShelves = ['row', '열'].slice(1, 2).map(this.encodingShelf, this);
    // Korean
    const nonPositionShelves = ['size', 'color', 'shape', 'detail', 'text'].slice(1, 2).map(this.encodingShelf, this);
    // const nonPositionShelves = ['size', '색깔', 'shape', 'detail', 'text'].slice(1, 2).map(this.encodingShelf, this);

    const wildcardShelvesGroup = wildcards !== 'disabled' && (
      <div styleName="shelf-group">
        <h3>Wildcard Shelves</h3>
        {[...anyEncodings.map((_, i) => i),
        -1 // map the empty placeholder to -1
        ].map(this.wildcardShelf, this)}
      </div>
    );

    return (
      <div className="pane" styleName="encoding-pane">
        <a className="right" onClick={this.onClear}>
          <i className="fa fa-eraser" />
          {' '}
          {/* Korean */}
          Clear
          {/* 초기화 */}
        </a>

        <h2>
          {/* Korean */}
          Encoding
          {/* 인코딩 */}
          {specPreview && ' Preview'}
        </h2>

        <div styleName="shelf-group">
          {positionShelves}
        </div>

        <div styleName="shelf-group">
          <div className="right">
            {this.markPicker()}
          </div>
          {/* Korean */}
          <h3>Mark</h3>
          {/* <h3>마크</h3> */}
          {nonPositionShelves}
        </div>

        {/* <div styleName="shelf-group"> */}
          {/* Korean */}
          {/* <h3>Facet</h3> */}
          {/* <h3>분할</h3>
          {facetShelves}
        </div> */}

        {/* TODO: correctly highlight field in the wildcard */}
        {wildcardShelvesGroup}

        {/* <div styleName="shelf-group"> */}
          {/* Korean */}
          {/* <h3>Filter</h3> */}
          {/* <h3>필터</h3>
          {this.filterPane()}
        </div> */}
      </div>
    );
  }

  /**
   * Return encoding shelf for normal (non-wildcard channels).
   */
  private encodingShelf(channel: Channel) {
    // This one can't be wildcard, thus we use VL's Channel, not our ShelfChannel

    const {handleAction, spec, specPreview, schema, filters} = this.props;
    const {encoding} = specPreview || spec;
    return (
      <EncodingShelf
        key={channel}
        id={{channel}}
        fieldDef={encoding[channel]}
        filters={filters}
        schema={schema}
        handleAction={handleAction}
      />
    );
  }

  private markPicker() {
    const {handleAction, spec, specPreview} = this.props;
    const {mark} = specPreview || spec;
    return <MarkPicker
      mark={mark}
      handleAction={handleAction}
    />;
  }

  private wildcardShelf(index: number) {
    const {handleAction, spec, specPreview, schema, filters} = this.props;
    const {anyEncodings} = specPreview || spec;

    const id = {
      channel: SHORT_WILDCARD,
      index
    };

    return (
      <EncodingShelf
        key={index}
        id={id}
        schema={schema}
        filters={filters}
        fieldDef={anyEncodings[index]}
        handleAction={handleAction}
      />
    );
  }

  private filterPane() {
    const {filters, schema, handleAction, spec} = this.props;
    return (
      <FilterPane
        filters={filters}
        schema={schema}
        handleAction={handleAction}
        // props for guideline
        spec={spec}
      />
    );
  }

  private onClear() {
    this.props.handleAction({type: SPEC_CLEAR});
    this.props.handleAction({type: FILTER_CLEAR});
    this.props.handleAction({type: GUIDELINE_CLEAR});
  }
}

export const EncodingPane = connect(
  (state: State) => {
    const presentUndoableState = state.undoable.present;
    const newProps = {
      spec: selectShelfSpec(state),
      filters: selectFilters(state),
      schema: selectDataset(state).schema,
      fieldDefs: selectSchemaFieldDefs(state),
      specPreview: selectShelfPreview(state).spec,
      config: selectConfig(state)
    };
    // checkGuideline(newProps); // Temporaly moved to
    return newProps;
  },
  createDispatchHandler<ShelfAction>()
)(CSSModules(EncodingPanelBase, styles));
