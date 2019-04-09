import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { callApi } from './libs/api';
import consts from './libs/consts';
import moment from 'moment';
import DataPagination from './components/data/pagination';
import { cloneDeep, isEqual } from 'lodash';
import { Router, Route, browserHistory } from 'react-router';
import PropertyFilterCheckbox from './components/data/property_filter_checkbox';

// import styles
require('./styles/data.scss');

const LOAD_GROUPS_API_URL = '/api/groups';
const LOAD_GROUPS_API_METHOD = 'get';
const LOAD_TAGS_API_URL = '/api/triage-tags';
const LOAD_TAGS_API_METHOD = 'get';
const LOAD_DATA_API_URL = '/api/predicted-triage';
const LOAD_DATA_API_METHOD = 'get';
const QUEUE_EQUATION_API_URL = '/api/queue-triage-equation/';
const QUEUE_EQUATION_API_METHOD = 'get';
const perPage = 20;
const basePageUrl = '/predicted-triage';

class DataFilters extends Component {

  render() {

    const { search, onSearchChange,
      dataType, onDataTypeChange,
      tag, tags, onTagChange,
      group, groups, onGroupChange,
      segmentationType, onSegmentationTypeChange,
      segmentationMask, onSegmentationMaskChange,
      onApplyFiltersAndSearchClick } = this.props;

    return (
      <div className="main-body">
        <div className="flex-row-1">
          <div className="group-1">
            <select className="form-control" value={dataType} onChange={onDataTypeChange}>
              <option value="">All data</option>
              {
                ["train", "test"].map((_data_type, index) => (
                  <option value={index} key={index}>{_data_type}</option>
                ))
              }
            </select>
          </div>
          <div className="group-1">
            <select className="form-control" value={tag} onChange={onTagChange}>
              <option value="">All tags</option>
              {
                this.props.tags.map((_tag, index) => (
                  <option value={_tag} key={index}>{_tag}</option>
                ))
              }
            </select>
          </div>
          <div className="group-1">
            <select className="form-control" value={group} onChange={onGroupChange}>
              <option value="">All groups</option>
              {
                this.props.groups.map((_group, index) => (
                  <option value={_group} key={index}>{_group}</option>
                ))
              }
            </select>
          </div>
          <div className="group-1">
            <select className="form-control" value={segmentationType} onChange={onSegmentationTypeChange}>
              <option value="truth">Truth</option>
              <option value="predicted">Predicted</option>
            </select>
          </div>
          <div className="group-1">
            <select className="form-control" value={segmentationMask} onChange={onSegmentationMaskChange}>
              <option value="math">Show math mask</option>
              <option value="text">Show text mask</option>
              <option value="anything">Show anything mask</option>
              <option value="char_size">Show character sizes</option>
              <option value="text_region">Show text only region</option>
              <option value="math_region">Show math only region</option>
            </select>
          </div>
        </div>
        <div className="flex-row-2">
          <div className="group-1">
            <button className="btn btn-primary" onClick={onApplyFiltersAndSearchClick}>Go</button>
          </div>
        </div>
      </div>
    );
  }
}

DataFilters.propTypes = {
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  segmentationMask: PropTypes.string.isRequired,
  onSegmentationMaskChange: PropTypes.func.isRequired,
  segmentationType: PropTypes.string.isRequired,
  onSegmentationTypeChange: PropTypes.func.isRequired,
  onDataTypeChange: PropTypes.func.isRequired,
  onGroupChange: PropTypes.func.isRequired,
  onTagChange: PropTypes.func.isRequired,
  onApplyFiltersAndSearchClick: PropTypes.func.isRequired
};

const loss_type_list = [
    "location_class_loss",
    "location_binary_loss",
    "char_size_loss",
    "is_inverted_loss",
    "is_printed_loss",
    "is_not_math_loss",
    "contains_geometry_loss",
    "contains_chart_loss",
    "contains_table_loss",
    "contains_graph_loss",
    "contains_diagram_loss",
    "contains_foreign_alphabet_loss",
];

class DataRow extends Component {

  static propTypes = {
    sessionID: PropTypes.string.isRequired,
    isQueued: PropTypes.bool.isRequired,
    tag: PropTypes.string.isRequired,
    imageURL: PropTypes.string.isRequired,
    segmentation: PropTypes.object.isRequired,
    lossMap: PropTypes.object.isRequired,
    resultsPredicted: PropTypes.array.isRequired,
    resultsTruth: PropTypes.array.isRequired,
    segmentationType: PropTypes.string.isRequired,
    segmentationMask: PropTypes.string.isRequired,
  };

  constructor(...args) {
    super(...args);
    this.setScores = this.setScores.bind(this);
    this.state = {
      queuing: false,
      isQueued: this.props.isQueued,
    };
    this.onQueueClick = this.onQueueClick.bind(this);
  }

  onQueueClick() {
    this.setState({ queuing: true });
    this.setState({ queueEquationApiStatus: consts.API_LOADING }, () => {
      callApi(QUEUE_EQUATION_API_URL + this.props.sessionID, QUEUE_EQUATION_API_METHOD).then(
        response => {
          console.log('Queue Equation API success', response);
          if (response.success) {
            this.setState({
              queueEquationApiStatus: consts.API_LOADED_SUCCESS,
              isQueued: false
            });
          } else {
            this.setState({
              queueEquationApiStatus: consts.API_LOADED_ERROR,
              queueEquationApiError: 'Failed to queue equation. Equation does not exist or already queued'
            });
          }
          this.setState({
            queuing: false,
            isQueued: true
          });
        },
        error => {
          console.log('Queue Equation API fail', error);
          this.setState({
            queueEquationApiStatus: consts.API_LOADED_ERROR,
            queueEquationApiError: 'Unable to queue equation.',
            queuing: false,
            isQueued: false
          });
        }
      );
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.segmentationMask !== this.props.segmentationMask) {
      this.setScores();
      return;
    }
    if (prevProps.segmentationType !== this.props.segmentationType) {
      this.setScores();
      return;
    }
  }

  componentDidMount() {
    // render SVG and draw segmentation data
    const margin = {top: 10, bottom: 10, left: 10, right:10};
    const imageHeight = this.props.segmentation.image_height;
    const imageWidth = this.props.segmentation.image_width;
    const gridHeight = this.props.segmentation.grid_height;
    const gridWidth = this.props.segmentation.grid_width;
    const imageURL = this.props.imageURL;
    var xImScale = d3.scaleLinear().domain([0, gridWidth]).range([0, imageWidth]);
    var yImScale = d3.scaleLinear().domain([0, gridHeight]).range([0, imageHeight]);
    var domNode = ReactDOM.findDOMNode(this.refs.image);
    var svg = d3.select(domNode).append("svg")
      .attr("width", imageWidth + margin.left + margin.right)
      .attr("height", imageHeight + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    var elem = svg.append("image", ":first-child")
      .attr("xlink:href", (d) => { return imageURL; })
      .attr("width", imageWidth)
      .attr("height", imageHeight);
    // draw lines
    for (var i = 0; i <= gridHeight; i++) {
        svg.append("line", ":first-child")
            .attr("x1", xImScale(0))
            .attr("y1", yImScale(i))
            .attr("x2", xImScale(gridWidth))
            .attr("y2", yImScale(i))
            .style("stroke", "white")
            .style("opacity", "0.3");
    }
    for (var i = 0; i <= gridWidth; i++) {
        svg.append("line", ":first-child")
            .attr("y1", yImScale(0))
            .attr("x1", xImScale(i))
            .attr("y2", yImScale(gridHeight))
            .attr("x2", xImScale(i))
            .style("stroke", "white")
            .style("opacity", "0.3")
    }
    // save to attributes
    this.svg = svg;
    this.xImScale = xImScale;
    this.yImScale = yImScale;
    this.gridHeight = gridHeight;
    this.gridWidth = gridWidth;
    this.setScores();
  }

  setScores() {
    const color = this.props.segmentationType == 'predicted' ? 'red' : 'blue';
    const that = this;
    switch (this.props.segmentationMask) {
      case 'anything':
      case 'text':
      case 'math':
        const curScores = this.props.segmentation.scores[this.props.segmentationMask][this.props.segmentationType];
        if (curScores === null) {
          return;
        }
        that.svg.selectAll("rect").remove();
        var b = that.svg.selectAll("rect")
          .data(curScores)
          .enter()
          .append('rect')
          .attr("width", that.xImScale(1) - that.xImScale(0))
          .attr("height", that.yImScale(1) - that.yImScale(0))
          .attr('x', function(d) { return that.xImScale(d.x) })
          .attr('y', function(d) { return that.yImScale(d.y) })
          .style("fill", color)
          .style("opacity", function(d) {return d.score / 2;} );
        break;
      case 'char_size':
        const charSizeTruth = this.props.charSizeTruth;
        const charSizePredicted = this.props.charSizePredicted;
        const charSize = this.props.segmentationType == 'predicted' ? this.props.charSizePredicted : this.props.charSizeTruth;
        that.svg.selectAll("rect").remove();
        var b = that.svg.selectAll("rect")
          .data([charSize])
          .enter()
          .append('rect')
          .attr('width', function(s) { return s })
          .attr('height', function(s) { return s })
          .attr('x', that.xImScale(that.gridWidth / 2) - charSize / 2)
          .attr('y', that.yImScale(that.gridHeight / 2) - charSize / 2)
          .style("fill", "none")
          .style("stroke", color)
          .style('stroke-width', 2);
        break;
      case 'math_region':
      case 'text_region':
        const type = this.props.segmentationMask.split("_")[0];
        const region = this.props.segmentation.boxes[type].region;
        that.svg.selectAll("rect").remove();
        if (!region) {
          return;
        }
        if (this.props.segmentationType != 'predicted') {
          return;
        }
        var b = that.svg.selectAll("rect")
          .data([region])
          .enter()
          .append('rect')
          .attr('width', function(s) { return that.xImScale(s.width) })
          .attr('height', function(s) { return that.yImScale(s.height) })
          .attr('x', function(s) { return that.xImScale(s.top_left_x) })
          .attr('y', function(s) { return that.yImScale(s.top_left_y) })
          .style("fill", "none")
          .style("stroke", color)
          .style('stroke-width', 2);
        break;
    }
  }


  render() {
    // create first column entry of predicted vs true things
    let propsStr = "Predicted:\n";
    for (let detection in this.props.resultsPredicted) {
      propsStr += this.props.resultsPredicted[detection] + "\n";
    }
    propsStr += "\nTruth:\n";
    for (let detection in this.props.resultsTruth) {
      propsStr += this.props.resultsTruth[detection] + "\n";
    }
    // create remaining column entries
    const latexEditURL = "/?sessionID=" + this.props.sessionID;
    const lossEntryList = loss_type_list.map((loss_type, idx) => (
      <td key={idx} ref={loss_type}>{this.props.lossMap[loss_type] && this.props.lossMap[loss_type].toFixed(4)} ({loss_type})</td>
    ));
    const isQueued = this.state.isQueued;
    return (
      <tr>
        <td ref='image'></td>
        <td className="prop-col"><pre>{propsStr}</pre></td>
        <td>
          {
            isQueued ?
              <div className="equation-queued">Queued</div>
            :
              <button type="button" className="btn btn-info btn-queue" onClick={this.onQueueClick} disabled={this.state.queuing}>
                {
                  this.state.queuing ?
                    <img src="/static/img/spinner-sm.gif" />
                  :
                    'Queue'
                }
              </button>
          }
        </td>
        <td className="action-col">
          <a target="_blank" href={latexEditURL}>Link</a>
        </td>
        <td ref="accuracy">{this.props.accuracy.toFixed(4)}</td>
        <td ref="total_loss">{this.props.total_loss.toFixed(4)}</td>
        { lossEntryList }
      </tr>
    );
  }
}

class PredictedData extends Component {

  constructor(...args) {
    super(...args);

    this.state = {
      loadTagsApiStatus: consts.API_NOT_LOADED,
      loadTagsApiError: '',
      loadDataApiStatus: consts.API_NOT_LOADED,
      loadDataApiError: '',
      filterTag: '',
      filterGroup: '',
      tags: [],
      groups: [],
      data: [],
      total: 0,
      search: '',
      segmentationType: '',
      segmentationMask: '',
      filterDataType: '',
      page: 1
    };

    this.loadData = this.loadData.bind(this);
    this.loadTags = this.loadTags.bind(this);
    this.loadGroups = this.loadGroups.bind(this);
    this.onSegmentationTypeChange = this.onSegmentationTypeChange.bind(this);
    this.onSegmentationMaskChange = this.onSegmentationMaskChange.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onDataTypeChange = this.onDataTypeChange.bind(this);
    this.onTagChange = this.onTagChange.bind(this);
    this.onGroupChange = this.onGroupChange.bind(this)
    this.makeQueryParamsForPageAndApi = this.makeQueryParamsForPageAndApi.bind(this);
    this.onApplyFiltersAndSearchClick = this.onApplyFiltersAndSearchClick.bind(this);
    this.performSort = this.performSort.bind(this);
    this.onPaging = this.onPaging.bind(this);
    this.setStateByLocationQuery = this.setStateByLocationQuery.bind(this);
    this.bindShortcutKeys = this.bindShortcutKeys.bind(this);
  }

  componentWillMount() {
    this.loadTags();
    this.loadGroups();
    this.setStateByLocationQuery(this.props.location.query, function() {
      const queryParams = this.makeQueryParamsForPageAndApi(true, true, true);
      this.loadData(queryParams.join('&'));
    }.bind(this));
  }

  loadTags() {
    this.setState({ loadUsersApiStatus: consts.API_LOADING }, () => {
      callApi(LOAD_TAGS_API_URL, LOAD_TAGS_API_METHOD).then(
        response => {
          console.log('Load Users API success', response);
          if (response.data && Array.isArray(response.data.tags)) {
            this.setState({
              loadTagsApiStatus: consts.API_LOADED_SUCCESS,
              tags: response.data.tags.sort()
            });
          } else {
            this.setState({
              loadTagsApiStatus: consts.API_LOADED_ERROR,
              loadUsersApiError: 'Failed to fetch tags. Please try again.'
            });
          }
        },
        error => {
          console.log('Load tags API fail', error);
          if (error.error && error.error.message) {
            this.setState({
              loadTagsApiStatus: consts.API_LOADED_ERROR,
              loadUsersApiError: 'Unable to fetch tags. ' + error.error.message
            });
          } else {
            this.setState({
              loadTagsApiStatus: consts.API_LOADED_ERROR,
              loadUsersApiError: 'Sorry, Failed to fetch tags. Please try again.'
            });
          }
        }
      );
    });
  }

  loadGroups() {
    this.setState({ loadGroupsApiStatus: consts.API_LOADING }, () => {
      callApi(LOAD_GROUPS_API_URL, LOAD_GROUPS_API_METHOD).then(
        response => {
          console.log('Load Groups API success', response);
          if (response.data && Array.isArray(response.data.groups)) {
            this.setState({
              loadGroupsApiStatus: consts.API_LOADED_SUCCESS,
              groups: response.data.groups.sort()
            });
          } else {
            this.setState({
              loadGroupsApiStatus: consts.API_LOADED_ERROR,
              loadGroupsApiError: 'Failed to fetch groups. Please try again.'
            });
          }
        },
        error => {
          console.log('Load Groups API fail', error);
          if (error.error && error.error.message) {
            this.setState({
              loadGroupsApiStatus: consts.API_LOADED_ERROR,
              loadGroupsApiError: 'Unable to fetch groups. ' + error.error.message
            });
          } else {
            this.setState({
              loadGroupsApiStatus: consts.API_LOADED_ERROR,
              loadGroupsApiError: 'Sorry, Failed to fetch groups. Please try again.'
            });
          }
        }
      );
    });
  }

  componentWillReceiveProps(nextProps) {
    if (!isEqual(this.props.location.query, nextProps.location.query)) {
      this.setStateByLocationQuery(nextProps.location.query, function() {
        const queryParams = this.makeQueryParamsForPageAndApi(true, true, true);
        this.loadData(queryParams.join('&'));
      }.bind(this));
    }
  }

  componentDidMount() {
    this.bindShortcutKeys();
  }

  setStateByLocationQuery(query, callback) {
    this.setState({
      search: query.search || '',
      segmentationType: query.segmentationType || 'predicted',
      segmentationMask: query.segmentationMask || 'math',
      sort: query.sort || '',
      page: isNaN(query.page) ? 1 : parseInt(query.page),
      filterDataType: query.isValidation || '',
      filterTag: query.tag || '',
      filterGroup: query.group || '',
    }, callback);
  }

  loadData(queryStr = '') {
    this.setState({ loadDataApiStatus: consts.API_LOADING }, () => {
      callApi(LOAD_DATA_API_URL + '?perPage=' + perPage + '&' + queryStr, LOAD_DATA_API_METHOD).then(
        response => {
          console.log('Load Data API success', response);
          if (response.data && response.data.list) {
            this.setState({
              loadDataApiStatus: consts.API_LOADED_SUCCESS,
              data: response.data.list,
              total: response.data.total,
            }, () => {
            });
          } else {
            this.setState({
              loadDataApiStatus: consts.API_LOADED_ERROR,
              loadDataApiError: 'Failed to fetch data. Please try again.'
            });
          }
        },
        error => {
          console.log('Load Data API fail', error);
          if (error.error && error.error.message) {
            this.setState({
              loadDataApiStatus: consts.API_LOADED_ERROR,
              loadDataApiError: 'Unable to fetch data. ' + error.error.message
            });
          } else {
            this.setState({
              loadDataApiStatus: consts.API_LOADED_ERROR,
              loadDataApiError: 'Sorry, Failed to fetch data. Please try again.'
            });
          }
        }
      );
    });
  }

  bindShortcutKeys() {
    const that = this;

    Mousetrap.bind('left', function() {
      if (that.state.loadDataApiStatus === consts.API_LOADED_SUCCESS && that.state.data.length)  {
        if (that.state.page > 1) {
          that.onPaging(that.state.page - 1);
        }
      }
    });

    Mousetrap.bind('right', function() {
      if (that.state.loadDataApiStatus === consts.API_LOADED_SUCCESS && that.state.data.length)  {
        const pageCount = parseInt(Math.ceil(parseFloat(that.state.total) / perPage));
        if (that.state.page < pageCount) {
          that.onPaging(that.state.page + 1);
        }
      }
    });
  }

  onSearchChange(event) {
    this.setState({ search: event.currentTarget.value });
  }

  onDataTypeChange(event) {
    this.setState({ filterDataType: event.currentTarget.value });
  }

  onTagChange(event) {
    this.setState({ filterTag: event.currentTarget.value });
  }

  onGroupChange(event) {
    this.setState({ filterGroup: event.currentTarget.value });
  }

  onSegmentationTypeChange(event) {
    this.setState({ segmentationType: event.currentTarget.value });
  }

  onSegmentationMaskChange(event) {
    this.setState({ segmentationMask: event.currentTarget.value });
  }

  makeQueryParamsForPageAndApi(filter_search = true, sort = false, page = false) {
    let queryParams = [];

    if (filter_search) {
      if (this.state.filterDataType.length) {
        queryParams.push('isValidation=' + encodeURIComponent(this.state.filterDataType));
      }
      if (this.state.search.length) {
        queryParams.push('search=' + encodeURIComponent(this.state.search));
      }
      if (this.state.filterTag.length) {
        queryParams.push('tag=' + encodeURIComponent(this.state.filterTag));
      }
      if (this.state.filterGroup.length) {
        queryParams.push('group=' + encodeURIComponent(this.state.filterGroup));
      }
      if (this.state.segmentationType.length) {
        queryParams.push('segmentationType=' + encodeURIComponent(this.state.segmentationType));
      }
      if (this.state.segmentationMask.length) {
        queryParams.push('segmentationMask=' + encodeURIComponent(this.state.segmentationMask));
      }
    }
    if (sort) {
      if (this.state.sort.length) {
        queryParams.push('sort=' + encodeURIComponent(this.state.sort));
      }
    }
    if (page) {
      if (this.state.page) {
        queryParams.push('page=' + this.state.page);
      }
    }

    return queryParams;
  }

  onApplyFiltersAndSearchClick() {
    const queryParams = this.makeQueryParamsForPageAndApi(true, false, false);
    browserHistory.push(basePageUrl + '?' + queryParams.join('&'));
  }

  performSort() {
    const queryParams = this.makeQueryParamsForPageAndApi(true, true, false);
    browserHistory.push(basePageUrl + '?' + queryParams.join('&'));
  }

  onSortClick(field, event) {
    event.preventDefault();

    if (this.state.sort === field) {
      this.setState({ sort: '-' + field, page: 1 }, this.performSort);
    } else {
      this.setState({ sort: field, page: 1 }, this.performSort);
    }
  }

  onPaging(newPage) {
    if (this.state.page == newPage) {
      return;
    }
    this.setState({ page: newPage }, () => {
      const queryParams = this.makeQueryParamsForPageAndApi(true, true, true);
      browserHistory.push(basePageUrl + '?' + queryParams.join('&'));
    });
  }
  render() {

    if (this.state.loadDataApiStatus === consts.API_LOADED_ERROR) {
      return (
        <div id="page-data">
          <div className="error">{this.state.loadDataApiError}</div>
        </div>
      );
    }

    const sortIcons = (
      <span>
        <i className="fa fa-sort" /><i className="fa fa-sort-asc" /><i className="fa fa-sort-desc" />
      </span>
    );

    const { sort, loadDataApiStatus } = this.state;
    const pageCount = parseInt(Math.ceil(parseFloat(this.state.total) / perPage));

    return (
      <div id="page-data">
        <DataFilters
          search={this.state.search} onSearchChange={this.onSearchChange}
          tag={this.state.filterTag} tags={this.state.tags} onTagChange={this.onTagChange}
          groups={this.state.groups} group={this.state.filterGroup} onGroupChange={this.onGroupChange}
          dataType={this.state.filterDataType} onDataTypeChange={this.onDataTypeChange}
          segmentationType={this.state.segmentationType} onSegmentationTypeChange={this.onSegmentationTypeChange}
          segmentationMask={this.state.segmentationMask} onSegmentationMaskChange={this.onSegmentationMaskChange}
          onApplyFiltersAndSearchClick={this.onApplyFiltersAndSearchClick} />

        {
          loadDataApiStatus === consts.API_LOADED_SUCCESS ?
            <div className="table-responsive">

              <table className="table data table-hover">
                <thead>
                  <tr>
                    <th colSpan="2" className="pagination-bar">
                      <div className="display-total">{this.state.total} items found</div>
                      <div>
                        <DataPagination count={pageCount} active={this.state.page} pagingFunc={this.onPaging} />
                      </div>
                    </th>
                    <th>Queuing</th>
                    <th>Edit</th>
                    <th className={'accuracy-col'}>
                      <a href="#" className={'sorter ' + (sort === 'accuracy' ? 'asc' : (sort === '-accuracy' ? 'desc' : ''))}
                         onClick={this.onSortClick.bind(this, 'accuracy')}>
                        Accuracy {sortIcons}
                      </a>
                    </th>
                    <th className={'loss-total-col'}>
                      <a href="#" className={'sorter ' + (sort === 'total_loss' ? 'asc' : (sort === '-total_loss' ? 'desc' : ''))}
                         onClick={this.onSortClick.bind(this, 'total_loss')}>
                        Loss (total) {sortIcons}
                      </a>
                    </th>
                    {
                      loss_type_list.map((loss_type, idx) => (
                        <th key={idx} className={loss_type + '-col'}>
                          <a href="#" className={'sorter ' + (sort === loss_type ? 'asc' : (sort === '-' + loss_type ? 'desc' : ''))}
                             onClick={this.onSortClick.bind(this, loss_type)}>
                            {loss_type} {sortIcons}
                          </a>
                        </th>
                      ))
                    }
                  </tr>
                </thead>

                <tbody>
                {
                  this.state.data.map(function(item, index) {
                    const lossMap = {};
                    loss_type_list.map(key => lossMap[key] = item[key]);
                    return (
                    <DataRow key={index}
                      isQueued={item.is_queued}
                      resultsPredicted={item.results_predicted}
                      resultsTruth={item.results_truth}
                      group={item.group}
                      lossMap={lossMap}
                      accuracy={item.accuracy}
                      total_loss={item.total_loss}
                      sessionID={item.session_id}
                      tag={item.tag}
                      imageURL={item.image_url}
                      segmentationType={this.state.segmentationType}
                      segmentationMask={this.state.segmentationMask}
                      segmentation={item.segmentation}
                      charSizePredicted={item.char_size_predicted_normalized}
                      charSizeTruth={item.char_size_truth_normalized}
                      />
                    )}.bind(this))
                }
                </tbody>

                <tfoot>
                  <tr>
                    <td colSpan="6">
                      <DataPagination count={pageCount} active={this.state.page} pagingFunc={this.onPaging} />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          :
            null
        }

        {
          loadDataApiStatus === consts.API_LOADING ?
            <div className="spinner"><img src="/static/img/spinner-lg.gif" /></div>
          :
            null
        }
        {
          loadDataApiStatus === consts.API_LOADED_SUCCESS && !this.state.data.length ?
            <div className="error">No data matching the criteria</div>
          :
            null
        }
      </div>
    );

  }
}

const routes = (
  <Router history={browserHistory}>
    <Route path="predicted-triage" component={PredictedData} />
  </Router>
);

ReactDOM.render(
  routes,
  document.getElementById('main')
);
