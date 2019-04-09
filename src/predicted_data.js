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
const LOAD_TAGS_API_URL = '/api/tags';
const LOAD_TAGS_API_METHOD = 'get';
const LOAD_DATA_API_URL = '/api/predicted-data';
const LOAD_DATA_API_METHOD = 'get';
const perPage = 20;
const basePageUrl = '/predicted-data';

class DataFilters extends Component {

  render() {

    const { search, onSearchChange,
      dataType, onDataTypeChange,
      tag, tags, onTagChange,
      group, groups, onGroupChange,
      minAccuracy, onMinAccuracy,
      maxAccuracy, onMaxAccuracy,
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
        </div>
        <div className="flex-row-2">
          <div className="group-1">
            <input type="text" className="form-control" value={search} placeholder="Search truth latex ..." onChange={onSearchChange} />
          </div>
          <div className="group-1">
            <input type="number" className="form-control" value={minAccuracy} placeholder="Min accuracy" onChange={onMinAccuracy} />
          </div>
          <div className="group-1">
            <input type="number" className="form-control" value={maxAccuracy} placeholder="Max accuracy" onChange={onMaxAccuracy} />
          </div>
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
  onDataTypeChange: PropTypes.func.isRequired,
  onGroupChange: PropTypes.func.isRequired,
  onTagChange: PropTypes.func.isRequired,
  onApplyFiltersAndSearchClick: PropTypes.func.isRequired
};

class DataRow extends Component {

  static propTypes = {
    latex_truth: PropTypes.string.isRequired,
    latex_predicted: PropTypes.string.isRequired,
    accuracy: PropTypes.number.isRequired,
    loss: PropTypes.number.isRequired,
    sessionID: PropTypes.string.isRequired,
    imageURL: PropTypes.string.isRequired,
  };

  constructor(...args) {
    super(...args);
    this.state = {
      showRawLatex: false,
    };
    this.onClick = this.onClick.bind(this);
    this.setScores = this.setScores.bind(this);
  }

  onClick() {
    this.svg && this.svg.selectAll("rect").remove();
    this.setState({showRawLatex: !this.state.showRawLatex});
  }

  componentDidMount() {
    // render SVG
    const margin = {top: 10, bottom: 10, left: 10, right:10};
    if (!this.props.attention) {
      return;
    }
    const imageHeight = this.props.attention.image_height;
    const imageWidth = this.props.attention.image_width;
    const gridHeight = this.props.attention.grid_height;
    const gridWidth = this.props.attention.grid_width;
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
            .style("stroke", "black")
            .style("opacity", "0.3");
    }
    for (var i = 0; i <= gridWidth; i++) {
        svg.append("line", ":first-child")
            .attr("y1", yImScale(0))
            .attr("x1", xImScale(i))
            .attr("y2", yImScale(gridHeight))
            .attr("x2", xImScale(i))
            .style("stroke", "black")
            .style("opacity", "0.3")
    }
    // save to attributes
    this.svg = svg;
    this.xImScale = xImScale;
    this.yImScale = yImScale;
  }

  setScores(curScores) {
    const that = this;
    that.svg && that.svg.selectAll("rect").remove();
    var b = that.svg.selectAll("rect")
      .data(curScores)
      .enter()
      .append('rect')
      .attr("width", that.xImScale(1) - that.xImScale(0))
      .attr("height", that.yImScale(1) - that.yImScale(0))
      .attr('x', function(d) { return that.xImScale(d.x) })
      .attr('y', function(d) { return that.yImScale(d.y) });
    b.style("fill", "red")
        .style("opacity", function(d) {return d.score;} );
  }

  componentDidUpdate() {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
  }

  render() {
    const { latex_predicted, latex_truth, accuracy, loss, sessionID, tag, imageURL, attention } = this.props;
    console.log(this.props.imageURL);
    const latexEditURL = "/?sessionID=" + sessionID;
    const latex_truth_split = latex_truth.split(" ");
    const latex_predicted_split = latex_predicted.split(" ");
    const latexPredictedElem = this.state.showRawLatex === true ?
      <div>
        {
          latex_predicted_split.map((elem, idx) => {
            const curColor =  latex_truth_split[idx] === elem ? "blue" : "red";
            return <code style={{color: curColor}}>{elem}</code>
          })
        }
      </div>
      : '$$' + latex_predicted + '$$';
    const latexTruthElem = this.state.showRawLatex === true ?
      <div>
        {
          latex_truth_split.map((elem, idx) => {
            const curColor =  latex_predicted_split[idx] === elem ? "blue" : "red";
            return <code style={{color: curColor}}>{elem}</code>
          })
        }
      </div>
      : '$$' + latex_truth + '$$';
    return (
      <tr>
        <td></td>
        <td ref='image'><img className="equation-img" src={imageURL} /></td>
        <td ref='latex_predicted'>{latexPredictedElem}</td>
        <td ref='latex_truth'>{latexTruthElem}</td>
        <td ref='accuracy'>{accuracy.toFixed(3)}</td>
        <td ref='loss'>{loss.toFixed(3)}</td>
        <td ref='show-raw'><button className="btn btn-primary" onClick={this.onClick}>Tex</button></td>
        <td className="action-col">
          <a target="_blank" href={latexEditURL}>Link</a>
        </td>
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
      minAccuracy: '',
      maxAccuracy: '',
      total: 0,
      search: '',
      filterDataType: '',
      page: 1
    };

    this.loadData = this.loadData.bind(this);
    this.loadTags = this.loadTags.bind(this);
    this.loadGroups = this.loadGroups.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onDataTypeChange = this.onDataTypeChange.bind(this);
    this.onTagChange = this.onTagChange.bind(this);
    this.onGroupChange = this.onGroupChange.bind(this)
    this.makeQueryParamsForPageAndApi = this.makeQueryParamsForPageAndApi.bind(this);
    this.onApplyFiltersAndSearchClick = this.onApplyFiltersAndSearchClick.bind(this);
    this.sortByAccuracy = this.onSortClick.bind(this, 'accuracy');
    this.sortByLoss = this.onSortClick.bind(this, 'loss');
    this.performSort = this.performSort.bind(this);
    this.onPaging = this.onPaging.bind(this);
    this.setStateByLocationQuery = this.setStateByLocationQuery.bind(this);
    this.bindShortcutKeys = this.bindShortcutKeys.bind(this);
    this.onMinAccuracy = this.onMinAccuracy.bind(this);
    this.onMaxAccuracy = this.onMaxAccuracy.bind(this);
  }

  onMinAccuracy(event) {
    this.setState({ minAccuracy: event.currentTarget.value });
  }

  onMaxAccuracy(event) {
    this.setState({ maxAccuracy: event.currentTarget.value });
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
      filterDataType: query.isValidation || '',
      sort: query.sort || '',
      page: isNaN(query.page) ? 1 : parseInt(query.page),
      minAccuracy: query.minAccuracy || '',
      maxAccuracy: query.maxAccuracy || '',
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
              averageAccuracy: response.data.average_accuracy || 0.
            }, () => {
              MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
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
      if (this.state.minAccuracy.length) {
        queryParams.push('minAccuracy=' + encodeURIComponent(this.state.minAccuracy));
      }
      if (this.state.maxAccuracy.length) {
        queryParams.push('maxAccuracy=' + encodeURIComponent(this.state.maxAccuracy));
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
          minAccuracy={this.state.minAccuracy} onMinAccuracy={this.onMinAccuracy}
          maxAccuracy={this.state.maxAccuracy} onMaxAccuracy={this.onMaxAccuracy}
          search={this.state.search} onSearchChange={this.onSearchChange}
          tag={this.state.tag} tags={this.state.tags} onTagChange={this.onTagChange}
          groups={this.state.groups} group={this.state.filterGroup} onGroupChange={this.onGroupChange}
          dataType={this.state.filterDataType} onDataTypeChange={this.onDataTypeChange}
          onApplyFiltersAndSearchClick={this.onApplyFiltersAndSearchClick} />

        {
          loadDataApiStatus === consts.API_LOADED_SUCCESS ?
            <div className="table-responsive">
              <div className="above-table">
                <div className="display-total">{this.state.total} items found</div>
                <DataPagination count={pageCount} active={this.state.page} pagingFunc={this.onPaging} />
              </div>
              <table className="table data table-hover">
                <thead>
                  <tr>
                    <th className="spacing"></th>
                    <th>Image</th>
                    <th>Predicted</th>
                    <th>Truth</th>
                    <th className="accuracy-col">
                      <a href="#" className={'sorter ' + (sort === 'accuracy' ? 'asc' : (sort === '-accuracy' ? 'desc' : ''))}
                         onClick={this.sortByAccuracy}>
                        Accuracy {sortIcons}
                      </a>
                    </th>
                    <th className="loss-col">
                      <a href="#" className={'sorter ' + (sort === 'loss' ? 'asc' : (sort === '-loss' ? 'desc' : ''))}
                         onClick={this.sortByLoss}>
                        Loss {sortIcons}
                      </a>
                    </th>
                    <th>Raw TeX</th>
                    <th>Edit</th>
                  </tr>
                </thead>

                <tbody>
                {
                  this.state.data.map((item, index) => (
                    <DataRow key={index}
                      attention={item.attention}
                      group={item.group}
                      latex_truth={item.latex_truth}
                      latex_predicted={item.latex_predicted}
                      sessionID={item.session_id}
                      tag={item.tag}
                      imageURL={item.image_url}
                      loss={item.loss}
                      accuracy={item.accuracy} />
                  ))
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
    <Route path="predicted-data" component={PredictedData} />
  </Router>
);

ReactDOM.render(
  routes,
  document.getElementById('main')
);
