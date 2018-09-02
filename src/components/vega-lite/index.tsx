import * as React from 'react';
import {ClipLoader} from 'react-spinners';
import * as vega from 'vega';
import * as vl from 'vega-lite';
import {InlineData, isNamedData} from 'vega-lite/build/src/data';
import {TopLevelExtendedSpec, FacetedCompositeUnitSpec} from 'vega-lite/build/src/spec';
import * as vegaTooltip from 'vega-tooltip';
import {SPINNER_COLOR} from '../../constants';
import {Logger} from '../util/util.logger';
import {Themes, themeDict} from '../../models/theme/theme';
import {Guidelines, GuidelineItemTypes, GuidelineItemActionableCategories, getRange, GuidelineItemOverPlotting, isSimpleScatterplot, isAllowedScatterplot, getDefaultCategoryPicks, getGuidedSpec, ActionableID} from '../../models/guidelines';
import {Schema, ShelfFilter, filterHasField, filterIndexOf} from '../../models';
import {OneOfFilter} from '../../../node_modules/vega-lite/build/src/filter';
import {X} from '../../../node_modules/vega-lite/build/src/channel';
import {NOMINAL} from '../../../node_modules/vega-lite/build/src/type';
import * as d3 from 'd3';
import {renderD3Preview, TransitionAttr} from '../../models/d3-chart';
import {schemeAccent} from 'd3';

export interface VegaLiteProps {
  spec: TopLevelExtendedSpec;

  renderer?: 'svg' | 'canvas';

  logger: Logger;

  data: InlineData;

  theme?: Themes;

  viewRunAfter?: (view: vega.View) => any;

  // For Guideline Preview
  fromSpec?: TopLevelExtendedSpec;
  isSpecifiedView?: boolean;
  isNoTimeline?: boolean;
  actionId?: ActionableID;
  guidelines?: GuidelineItemTypes[];
  schema?: Schema;
  filters?: ShelfFilter[];
  isPreview?: boolean;
  transitionAttrs?: TransitionAttr[];
  // isLastBookmark?: boolean;
}

export interface VegaLiteState {
  isLoading: boolean;
}

const CHART_REF = 'chart';

export class VegaLite extends React.PureComponent<VegaLiteProps, VegaLiteState> {
  private view: vega.View;
  private size: {width: number, height: number};

  private mountTimeout: number;
  private updateTimeout: number;

  constructor(props: VegaLiteProps) {
    super(props);
    this.state = {
      isLoading: true
    };
  }

  public render() {
    return (
      <div>
        {/* <ClipLoader color={SPINNER_COLOR} loading={this.state.isLoading} /> */}
        <div className='chart' ref={CHART_REF} />
        {/* chart is defined in app.scss */}
        <div id="vis-tooltip" className="vg-tooltip" />
      </div>
    );
  }

  public componentDidMount() {
    if (this.mountTimeout) {
      clearTimeout(this.mountTimeout);
    }
    this.setState({
      isLoading: true
    });
    this.mountTimeout = window.setTimeout(() => {
      this.updateSpec();
      if (!this.isRenderD3Preview()) {
        this.runView();
      }
      this.setState({
        isLoading: false
      });
    });
  }

  public componentWillReceiveProps(nextProps: VegaLiteProps) {
    if (nextProps.spec !== this.props.spec || nextProps.guidelines !== this.props.guidelines) {
      this.setState({
        isLoading: true
      });
      try {
        this.size = this.getChartSize();
      } catch (e) {
        console.log(this.props.spec);
        console.log(nextProps.spec);
      }
    }
  }

  public componentDidUpdate(prevProps: VegaLiteProps, prevState: VegaLiteState) {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    this.updateTimeout = window.setTimeout(
      (spec: TopLevelExtendedSpec, data: InlineData) => {
        if (prevProps.spec !== spec || prevProps.guidelines !== this.props.guidelines) {
          const chart = this.refs[CHART_REF] as HTMLElement;
          chart.style.width = this.size.width + 'px';
          chart.style.height = this.size.height + 'px';
          this.updateSpec();
        } else if (prevProps.data !== data) {
          if (this.isRenderD3Preview()) {
            const {actionId, fromSpec, spec, schema, data, transitionAttrs, isSpecifiedView, isNoTimeline} = this.props;
            let newSpec = this.getGuidedSpec();
            renderD3Preview(actionId, this.refs[CHART_REF], fromSpec as FacetedCompositeUnitSpec, newSpec as FacetedCompositeUnitSpec, schema, data.values, transitionAttrs, false, isSpecifiedView || isNoTimeline);
          }
          else {
            this.bindData();
            this.runView();
          }
        }
        this.setState({
          isLoading: false
        });
      },
      0, this.props.spec, this.props.data
    );
  }

  public componentWillUnmount() {
    if (this.mountTimeout) {
      clearTimeout(this.mountTimeout);
    }

    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    if (this.view) {
      this.view.finalize();
    }
  }

  private isRenderD3Preview(): boolean {
    return (this.props.isPreview || this.props.isSpecifiedView) && isAllowedScatterplot(this.props.spec);
  }
  protected updateSpec() {
    // NOTE: spec used to test warning logger
    // vlSpec = {
    //   "description": "A simple bar chart with embedded data.",
    //   "data": {
    //     "values": [
    //       {"a": "A", "b": 28},
    //       {"a": "B", "b": 55},
    //       {"a": "C", "b": 43},
    //       {"a": "D", "b": 91},
    //       {"a": "E", "b": 81},
    //       {"a": "F", "b": 53},
    //       {"a": "G", "b": 19},
    //       {"a": "H", "b": 87},
    //       {"a": "I", "b": 52}
    //     ]
    //   },
    //   "mark": "bar",
    //   "encoding": {
    //     "x": {"field": "a", "type": "quantitative"},
    //     "y": {"field": "b", "type": "quantitative"}
    //   }
    // };
    const {logger} = this.props;
    const vlSpec = this.getGuidedSpec();// this.props.spec;
    // const vlConfig = themeDict[this.props.theme.theme];

    try {
      let spec = vl.compile(vlSpec, logger).spec;
      const runtime = vega.parse(spec, vlSpec.config);// vlConfig);
      if (this.isRenderD3Preview()) {
        const {actionId, fromSpec, spec, schema, data, transitionAttrs, isSpecifiedView, isNoTimeline} = this.props;
        renderD3Preview(actionId, this.refs[CHART_REF], fromSpec as FacetedCompositeUnitSpec, vlSpec as FacetedCompositeUnitSpec, schema, data.values, transitionAttrs, false, isSpecifiedView || isNoTimeline);
      }
      else {
        this.view = new vega.View(runtime)
          .logLevel(vega.Warn)
          .initialize(this.refs[CHART_REF] as any)
          .renderer(this.props.renderer || 'svg')
          .hover();
        // TODO: upgrade tooltip
        // var handler = new vegaTooltip.Handler();
        // vegaTooltip(this.view);
        // this.view.tooltip(handler.call);
        this.bindData();
      }
    } catch (err) {
      logger.error(err);
    }
  }

  private bindData() {
    const {data, spec} = this.props;
    const guidedSpec = this.getGuidedSpec();
    if (data && isNamedData(guidedSpec.data)) {
      this.view.change(guidedSpec.data.name,
        vega.changeset()
          .remove(() => true) // remove previous data
          .insert(data.values)
      );
    }
  }

  private runView() {
    try {
      this.view.run();
      if (this.props.viewRunAfter) {
        this.view.runAfter(this.props.viewRunAfter);
      }
    } catch (err) {
      this.props.logger.error(err);
    }
  }

  private getChartSize(): {width: number, height: number} {
    const chart = this.refs[CHART_REF] as HTMLElement;
    const chartContainer = chart.querySelector(this.props.renderer || 'svg');
    const width = Number(chartContainer.getAttribute('width'));
    const height = Number(chartContainer.getAttribute('height'));
    return {width, height};
  }

  private getGuidedSpec(spec?: TopLevelExtendedSpec): TopLevelExtendedSpec {
    if (!this.props.isSpecifiedView) {
      // console.log('!this.props.isSpecifiedView');
      return this.props.spec;
    }
    let newSpec = getGuidedSpec(this.props.spec, this.props.guidelines, this.props.schema, this.props.filters);
    return newSpec;
  }

  private separateGraph(newSpec: FacetedCompositeUnitSpec, field: string) {
    newSpec.encoding.column = {field, type: NOMINAL};
    return newSpec;
  }
}
