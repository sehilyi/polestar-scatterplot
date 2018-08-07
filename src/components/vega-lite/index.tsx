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
import {Guidelines, GuidelineItemTypes, GuidelineItemActionableCategories, getRange, GuidelineItemOverPlotting, isScatterPlot} from '../../models/guidelines';
import {Schema, ShelfFilter, filterHasField, filterIndexOf} from '../../models';
import {OneOfFilter} from '../../../node_modules/vega-lite/build/src/filter';
import {X} from '../../../node_modules/vega-lite/build/src/channel';
import {NOMINAL} from '../../../node_modules/vega-lite/build/src/type';
import * as d3 from 'd3';

export interface VegaLiteProps {
  spec: TopLevelExtendedSpec;

  renderer?: 'svg' | 'canvas';

  logger: Logger;

  data: InlineData;

  theme?: Themes;

  viewRunAfter?: (view: vega.View) => any;

  // For considering guidelines
  isSpecifiedView?: boolean;
  guidelines?: GuidelineItemTypes[];
  schema?: Schema;
  filters?: ShelfFilter[];
  isPreview?: boolean;
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
        <ClipLoader color={SPINNER_COLOR} loading={this.state.isLoading} />
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
      this.runView();
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
      this.size = this.getChartSize();
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
          this.bindData();
        }
        this.runView();
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
      this.view = new vega.View(runtime)
        .logLevel(vega.Warn)
        .initialize(this.refs[CHART_REF] as any)
        .renderer(this.props.renderer || 'svg')
        .hover();
      if (!this.props.isPreview) {
        vegaTooltip.vega(this.view);
      }
      this.bindData();

      // console.log(spec);
      // console.log(vlSpec);
      // console.log(this.props.data);
      // console.log(this.props.schema);

      if (this.props.isSpecifiedView && isScatterPlot(this.props.spec)) {
        console.log('vlSpec:');
        console.log(vlSpec);
        console.log('runtime:');
        console.log(runtime);
        //
        this.d3Chart(spec);
      }
    } catch (err) {
      logger.error(err);
    }
  }

  // Implement chart using D3.js for animated transition
  private d3Chart(spec: any) {
    console.log('spec for d3:');
    console.log(spec);

    const margin = {top: 20, right: 20, bottom: 50, left: 50},
      width = Number((spec.signals as any[]).filter(item => item.name === 'width')[0].update),
      height = Number((spec.signals as any[]).filter(item => item.name === 'height')[0].update);

    let root = d3.select(this.refs[CHART_REF] as any)
      .append('div')
      .attr('class', 'd3-chart')
      .style('margin', 'auto')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    let data = this.props.data.values,
      xField = (spec.scales as any[]).filter(item => item.name === 'x')[0].domain.field,
      yField = (spec.scales as any[]).filter(item => item.name === 'y')[0].domain.field,
      fill = spec.marks[0].encode.update.fill.value,
      opacity = spec.marks[0].encode.update.opacity.value,
      stroke = spec.marks[0].encode.update.stroke.value;

    let x = d3.scaleLinear().domain([0, d3.max(data, function (d) {return d[xField]})]).nice().range([0, width]);//.nice();
    let y = d3.scaleLinear().domain([0, d3.max(data, function (d) {return d[yField]})]).nice().range([height, 0]);//.nice();

    let svg = root.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    let xAxis = d3.axisBottom(x).ticks(Math.ceil(width / 40));
    let yAxis = d3.axisLeft(y).ticks(Math.ceil(height / 40));
    let xGrid = d3.axisBottom(x).ticks(Math.ceil(width / 40)).tickFormat(null).tickSize(-width);
    let yGrid = d3.axisLeft(y).ticks(Math.ceil(height / 40)).tickFormat(null).tickSize(-height);

    svg.append('g')
      .attr('class', 'grid')
      .attr("transform", "translate(" + margin.left + ',' + (height + margin.top) + ")")
      .call(xGrid);

    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .call(yGrid);

    svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(" + margin.left + ',' + (height + margin.top) + ")")
      .attr('stroke', '#888888')
      .attr('stroke-width', 0.5)
      .call(xAxis)
      .append("text")
      .attr("class", "label")
      .attr('x', width / 2)
      .attr("y", margin.bottom - 10)
      .style('fill', 'black')
      .style('font-weight', 'bold')
      .style('font-family', 'sans-serif')
      .style('font-size', 11)
      .style("text-anchor", "middle")
      .text(xField);

    svg.append("g")
      .attr("class", "axis")
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .attr('stroke', '#888888')
      .attr('stroke-width', 0.5)
      .call(yAxis)
      .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("x", -width / 2)
      .attr("y", -50)
      .attr("dy", ".71em")
      .style('font-weight', 'bold')
      .style('font-family', 'sans-serif')
      .style('font-size', 11)
      .style('fill', 'black')
      .style("text-anchor", "middle")
      .text(yField);

    svg.selectAll('.point')
      .data(data)
      .enter().append("circle")
      .attr('class', 'point')
      .attr('stroke-width', 2)
      .attr('r', 3) //TODO:
      .attr('cx', function (d) {return (x(d[xField]) + margin.left);})
      .attr('cy', function (d) {return (y(d[yField]) + margin.top);})
      .attr('fill', fill)
      .attr('opacity', opacity)
      .attr('stroke', stroke);
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
      return this.props.spec;
    }
    // console.log(spec);
    let newSpec = (JSON.parse(JSON.stringify(this.props.spec))) as FacetedCompositeUnitSpec;
    const {guidelines, schema} = this.props;
    guidelines.forEach(item => {
      const {id} = item;
      switch (id) {
        case "GUIDELINE_TOO_MANY_COLOR_CATEGORIES":
        case "GUIDELINE_TOO_MANY_SHAPE_CATEGORIES": {
          const itemDetail = (item as GuidelineItemActionableCategories);
          if (itemDetail.selectedCategories.length !== 0)
            newSpec = this.handleTooManyCategories(newSpec, itemDetail, schema, "GUIDELINE_TOO_MANY_COLOR_CATEGORIES" === id);
          break;
        }
        default:
          break;
      }
    });

    // HACK to put maxbins if binned for better look and feel
    try {
      if (newSpec.encoding.x['bin'] === true) {
        newSpec.encoding.x['bin'] = {maxbins: 60};
      }
    } catch (e) {}
    try {
      if (newSpec.encoding.y['bin'] === true) {
        newSpec.encoding.y['bin'] = {maxbins: 60};
      }
    } catch (e) {}

    // console.log("newSpec:");
    // console.log(newSpec);
    return newSpec;
  }

  private separateGraph(newSpec: FacetedCompositeUnitSpec, field: string) {
    newSpec.encoding.column = {field, type: NOMINAL};
    return newSpec;
  }
  private handleTooManyCategories(newSpec: FacetedCompositeUnitSpec, itemDetail: GuidelineItemActionableCategories, schema: Schema, isColor: boolean) {
    let field = newSpec.encoding.color["field"].toString();
    const domainWithFilter = (filterHasField(this.props.filters, field) ?
      (this.props.filters[filterIndexOf(this.props.filters, field)] as OneOfFilter).oneOf :
      schema.domain({field}));
    let selected = itemDetail.selectedCategories;
    if (isColor) {
      newSpec.encoding.color = {
        ...newSpec.encoding.color,
        scale: {
          domain: domainWithFilter,
          range: getRange(selected, domainWithFilter)
        }
      }
    } else {
      newSpec.encoding.shape = {
        ...newSpec.encoding.shape,
        scale: {
          domain: domainWithFilter,
          range: getRange(selected, domainWithFilter)
        }
      }
    }
    return newSpec;
  }
}
