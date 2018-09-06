
import * as React from 'react';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import {connect} from 'react-redux';
import {ClipLoader} from 'react-spinners';
import * as SplitPane from 'react-split-pane';
import {SPINNER_COLOR, DEFAULT_DATASETS} from '../../constants';
import {VoyagerConfig} from '../../models/config';
import {Dataset} from '../../models/dataset';
import {State} from '../../models/index';
import {selectConfig} from '../../selectors';
import {selectDataset} from '../../selectors/dataset';
import '../app.scss';
import {DataPane} from '../data-pane/index';
import {EncodingPane} from '../encoding-pane/index';
import {Footer} from '../footer/index';
import {Header} from '../header/index';
import {LoadData} from '../load-data-pane/index';
import {LogPane} from '../log-pane/index';
import {ViewPane} from '../view-pane/index';
import {GuidePane} from '../guide-pane';
import {LastBookmark} from '../last-bookmark';
import {DatasetAsyncAction, ActionHandler, datasetLoad, createDispatchHandler} from '../../actions';

export interface AppRootProps extends ActionHandler<DatasetAsyncAction> {
  dataset: Dataset;
  config: VoyagerConfig;
}

class AppRootBase extends React.PureComponent<AppRootProps, {}> {
  public render() {
    const IS_DEBUG: boolean = false;
    const {dataset, config} = this.props;
    const {hideHeader, hideFooter} = config;
    let bottomPane, footer;
    if (!dataset.isLoading) {
      if (!dataset.data) {
        bottomPane = <LoadData />;
        if (IS_DEBUG) {
          this.props.handleAction(datasetLoad(DEFAULT_DATASETS[1].name, DEFAULT_DATASETS[1]));
        }
      } else {
        bottomPane = (
          <SplitPane split="vertical" defaultSize={200} minSize={175} maxSize={350}>
            <DataPane />
            <SplitPane split="vertical" defaultSize={235} minSize={200} maxSize={350}>
              <EncodingPane />
              <SplitPane split="vertical" defaultSize={410} minSize={410} maxSize={410} primary="second">
                <SplitPane split="horizontal" defaultSize={'50%'} primary='first' >
                  <ViewPane />
                  <LastBookmark />
                </SplitPane>
                <GuidePane />
              </SplitPane>
            </SplitPane>
          </SplitPane>
        );
        if (!hideFooter) {
          footer = <Footer />;
        }
      }
    }
    return (
      <div className="voyager">
        {/* <LogPane/> */}
        {!hideHeader && <Header />}
        <ClipLoader color={SPINNER_COLOR} loading={dataset.isLoading} />
        {bottomPane}
        {footer}
      </div>
    );
  }
}

export const AppRoot = connect(
  (state: State) => {
    return {
      dataset: selectDataset(state),
      config: selectConfig(state)
    };
  },
  createDispatchHandler<DatasetAsyncAction>()
)(DragDropContext(HTML5Backend)(AppRootBase));