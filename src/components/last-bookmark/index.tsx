import * as React from 'react';
import * as CSSModules from 'react-css-modules';
import { connect } from 'react-redux';
import * as styles from './last-bookmark.scss';
import { selectBookmark, selectSchema, selectFilteredData, selectGuidelines } from '../../selectors';
import { State, Bookmark, ResultPlot, Schema } from '../../models';
import { VegaLite } from '../vega-lite';
import { InlineData } from 'vega-lite/build/src/data';
import { ActionHandler, LogAction } from '../../actions';
import { Logger } from '../util/util.logger';
import { isNullOrUndefined } from '../../util';
import { GuidelineItemTypes, Guidelines } from '../../models/guidelines';

export interface LastBookmarkProps extends ActionHandler<LogAction> {
  bookmark: Bookmark;
  schema: Schema;
  data: InlineData;
  guidelines: Guidelines;
}

export class LastBookmarkBase extends React.PureComponent<LastBookmarkProps, {}> {

  private plotLogger: Logger;

  constructor(props: LastBookmarkProps) {
    super(props);
    this.plotLogger = new Logger(props.handleAction);
  }

  shouldComponentUpdate(nextProps: LastBookmarkProps) {
    return this.props.bookmark != nextProps.bookmark;
  }

  public render() {
    return (
      <div styleName="preview-pane">
        {/* <div styleName='preview-apply-button'>
          <i className="fa fa-arrow-circle-up" aria-hidden="true" />{' '} Apply Preview
        </div> */}
        <h2><i className="fa fa-thumb-tack" aria-hidden="true" /> Pinned View</h2>
        {this.renderLastBookmark()}
      </div>
    );
  }

  private renderLastBookmark() {
    const { bookmark } = this.props;
    if (isNullOrUndefined(bookmark) || isNullOrUndefined(bookmark.dict[bookmark.list[0]])) return <div></div>;

    const plot: ResultPlot = bookmark.dict[bookmark.list[0]].plot;

    return (
      <div id='last-bookmark-chart' styleName='preview-chart'>
        <VegaLite spec={plot.spec}
          logger={this.plotLogger}
          data={this.props.data}
          guidelines={this.props.guidelines.list}
          isSpecifiedView={true}
          actionId={'NONE2'}
          schema={this.props.schema} />
      </div>
    );
  }
}

export const LastBookmark = connect(
  (state: State) => {
    return {
      bookmark: selectBookmark(state),
      schema: selectSchema(state),
      data: selectFilteredData(state),
      guidelines: selectGuidelines(state)
    };
  }
)(CSSModules(LastBookmarkBase, styles));