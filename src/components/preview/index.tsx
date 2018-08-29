import * as React from 'react';
import * as CSSModules from 'react-css-modules';
import * as styles from './preview.scss';
import * as SplitPane from 'react-split-pane';

export interface PreviewProps {

}

export class PreviewBase extends React.PureComponent<PreviewProps, {}> {
  constructor(props: PreviewProps) {
    super(props);
  }

  public render() {
    return (
      <div styleName="preview-pane">
        {/* <div styleName='preview-apply-button'>
          <i className="fa fa-arrow-circle-up" aria-hidden="true" />{' '} Apply Preview
        </div> */}
        <h2><i className="fa fa-bookmark" aria-hidden="true" /> Last Bookmark</h2>
        {this.renderPreview()}
      </div>
    );
  }

  private renderPreview() {
    return (
      <div id='last-bookmark-chart' styleName='preview-chart'>

      </div>
    );
  }
}

export const Preview = CSSModules(PreviewBase, styles);