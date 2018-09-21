import * as React from 'react';
import * as CSSModules from 'react-css-modules';
import {connect} from 'react-redux';
import {InlineData} from 'vega-lite/build/src/data';
import {SortField, SortOrder} from 'vega-lite/build/src/sort';
import {FacetedCompositeUnitSpec} from 'vega-lite/build/src/spec';
import {Action} from '../../actions/index';
import {ActionHandler, createDispatchHandler} from '../../actions/redux-action';
import {ShelfAction} from '../../actions/shelf';
import {SHELF_AUTO_ADD_COUNT_CHANGE, SHELF_GROUP_BY_CHANGE} from '../../actions/shelf/index';
import {SPEC_FIELD_PROP_CHANGE} from '../../actions/shelf/spec';
import {State, Schema} from '../../models';
import {Bookmark} from '../../models/bookmark';
import {VoyagerConfig} from '../../models/config';
import {RelatedViews as RelatedViewsModel} from '../../models/related-views';
import {Result} from '../../models/result/index';
import {ShelfFilter} from '../../models/shelf/filter';
import {SHELF_GROUP_BYS, ShelfGroupBy} from '../../models/shelf/index';
import {selectBookmark, selectConfig, selectMainSpec, selectTheme, selectGuidelines, selectDataset} from '../../selectors';
import {selectFilteredData, selectRelatedViews} from '../../selectors/index';
import {selectResult} from '../../selectors/result';
import {
  selectDefaultGroupBy, selectFilters, selectIsQuerySpecific,
  selectShelfAutoAddCount, selectShelfGroupBy
} from '../../selectors/shelf';
import {Plot} from '../plot';
import {PlotList} from '../plot-list';
import {RelatedViews} from './related-views';
import {RelatedViewsButton} from './related-views-button';
import * as styles from './view-pane.scss';
import {Themes} from '../../models/theme/theme';
import {Guidelines, checkGuideline} from '../../models/guidelines';

export interface ViewPaneProps extends ActionHandler<Action> {
  isQuerySpecific: boolean;
  spec: FacetedCompositeUnitSpec;
  result: Result;
  bookmark: Bookmark;
  autoAddCount: boolean;

  relatedViews: RelatedViewsModel;

  groupBy: ShelfGroupBy;
  defaultGroupBy: ShelfGroupBy;
  config: VoyagerConfig;

  data: InlineData;
  filters: ShelfFilter[];

  theme: Themes;

  guidelines: Guidelines;
  schema: Schema;
}

// Korean
const NO_PLOT_MESSAGE = `No specified visualization yet. ` +
  `Start exploring by dragging a field to encoding pane ` +
  `on the left or examining univariate summaries below.`;
// const NO_PLOT_MESSAGE = `아직 정의된 시각화가 없습니다. ` +
//   `인코딩 패널에 변수를 드래그해서 시각화를 시작하세요. ` +
//   ``;

const GROUP_BY_LABEL: {[K in ShelfGroupBy]: string} = {
  auto: 'Automatic',
  field: 'Field',
  fieldTransform: 'Field and Transformations',
  encoding: 'Visual Encodings'
};

class ViewPaneBase extends React.PureComponent<ViewPaneProps, {}> {

  constructor(props: ViewPaneProps) {
    super(props);
    this.onSort = this.onSort.bind(this);

    this.onAutoAddCountChange = this.onAutoAddCountChange.bind(this);
    this.onGroupByChange = this.onGroupByChange.bind(this);
  }

  public render() {
    const {isQuerySpecific, handleAction, relatedViews, config} = this.props;
    const {showHighlight, size, position} = this.props.guidelines;

    const collapseRelatedViews = relatedViews.isCollapsed === undefined ? config.relatedViews === 'initiallyCollapsed' :
      relatedViews.isCollapsed;

    const relatedViewsElement = config.relatedViews !== 'disabled' && (
      <div className="pane" styleName={collapseRelatedViews ? "view-pane-related-views-collapse" :
        "view-pane-related-views"}>
        <RelatedViewsButton
          collapseRelatedViews={collapseRelatedViews}
          handleAction={handleAction}
        />
        <h2>Related Views</h2>
        {!collapseRelatedViews && <RelatedViews />}
      </div>
    );

    if (isQuerySpecific) {
      return (
        <div styleName="view-pane">
          <div className="pane" id="specified-view" styleName={collapseRelatedViews ? 'view-pane-specific-stretch' : 'view-pane-specific'}>
            {/* Korean */}
            <h2>Specified View</h2>
            {/* <h2>사용자 정의 시각화</h2> */}
            {/* <div styleName='transition-progress-bg'>
              <div styleName='transition-progress'></div>
            </div> */}
            {this.renderSpecifiedView()}
            <div styleName={showHighlight ? 'highlighter-show' : 'highlighter'}
              style={{
                width: size.width + 'px',
                height: size.height + 'px',
                top: position.y + 'px',
                left: position.x + 'px',
              }}
            />
          </div>
          {relatedViewsElement}
        </div>
      );
    } else {
      return this.renderSpecifiedViews();
    }
  }

  private onSort(channel: 'x' | 'y', value: SortOrder | SortField) {
    const {handleAction} = this.props;
    handleAction({
      type: SPEC_FIELD_PROP_CHANGE,
      payload: {
        shelfId: {channel},
        prop: 'sort',
        value
      }
    });
  }

  private renderSpecifiedView() {
    const {bookmark, data, filters, handleAction, spec, theme, guidelines, schema} = this.props;

    if (spec) {
      return (
        <Plot
          bookmark={bookmark}
          data={data}
          filters={filters}
          handleAction={handleAction}
          onSort={this.onSort}
          showBookmarkButton={true}
          spec={spec}
          theme={theme}
          isSpecifiedView={true}
          guidelines={guidelines.list}
          schema={schema}
        />
      );
    } else {
      return (
        <span>{NO_PLOT_MESSAGE}</span>
      );
    }
  }

  private renderSpecifiedViews() {
    const {bookmark, handleAction, autoAddCount, groupBy, defaultGroupBy, result, theme} = this.props;

    const options = SHELF_GROUP_BYS.map(value => {
      const label = value === 'auto' ?
        `${GROUP_BY_LABEL[defaultGroupBy]} (Automatic)` :
        GROUP_BY_LABEL[value];
      return (
        <option value={value} key={value}>
          {label}
        </option>
      );
    });
    return (
      <div className="pane" styleName="view-pane-gallery">
        <div className="right">
          <label styleName="gallery-command">
            Showing views with different
            {' '}
            <select value={groupBy} onChange={this.onGroupByChange}>
              {options}
            </select>
          </label>

          <label styleName="gallery-command">
            <input
              type="checkbox"
              checked={autoAddCount}
              onChange={this.onAutoAddCountChange}
            />
            {' '}
            Auto Add Count
          </label>
        </div>

        <h2>Specified Views</h2>
        <PlotList
          result={result}
          resultType="main"
          handleAction={handleAction}
          bookmark={bookmark}
          theme={theme}
        />
      </div>
    );
  }

  private onAutoAddCountChange(event: any) {
    const autoAddCount = event.target.checked;
    const {handleAction} = this.props;
    handleAction({
      type: SHELF_AUTO_ADD_COUNT_CHANGE,
      payload: {autoAddCount}
    });
  }

  private onGroupByChange(event: any) {
    const {handleAction} = this.props;
    handleAction({
      type: SHELF_GROUP_BY_CHANGE,
      payload: {groupBy: event.target.value}
    });
  }

  componentDidUpdate(prevProps: ViewPaneProps) {
    if (prevProps.spec !== this.props.spec)
      checkGuideline(this.props);
  }
}
export const ViewPane = connect(
  (state: State) => {
    return {
      autoAddCount: selectShelfAutoAddCount(state),
      bookmark: selectBookmark(state),
      config: selectConfig(state),
      data: selectFilteredData(state),
      filters: selectFilters(state),
      groupBy: selectShelfGroupBy(state),
      defaultGroupBy: selectDefaultGroupBy(state),
      isQuerySpecific: selectIsQuerySpecific(state),
      result: selectResult.main(state),
      spec: selectMainSpec(state),
      relatedViews: selectRelatedViews(state),
      theme: selectTheme(state),
      guidelines: selectGuidelines(state),
      schema: selectDataset(state).schema,
    };
  },
  createDispatchHandler<ShelfAction>()
)(CSSModules(ViewPaneBase, styles));
