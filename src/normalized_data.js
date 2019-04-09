import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { callApi } from './libs/api';
import consts from './libs/consts';
import moment from 'moment';
import DataFilters from './components/data/filters';
import DataPagination from './components/data/pagination';
import { cloneDeep, isEqual } from 'lodash';
import { Router, Route, browserHistory } from 'react-router';

// import styles
require('./styles/data.scss');

const LOAD_GROUPS_API_URL = '/api/groups';
const LOAD_GROUPS_API_METHOD = 'get';
const LOAD_USERS_API_URL = '/api/users';
const LOAD_USERS_API_METHOD = 'get';
const LOAD_DATA_API_URL = '/api/data';
const LOAD_DATA_API_METHOD = 'get';
const CREATE_QUEUE_API_URL = '/api/queue';
const CREATE_QUEUE_API_METHOD = 'get';
const perPage = 50;
const basePageUrl = '/normalized-data';

class DataRow extends Component {

  static propTypes = {
    annotator: PropTypes.string.isRequired,
    latex: PropTypes.string.isRequired,
    latex_normalized: PropTypes.string.isRequired,
    imagePath: PropTypes.string.isRequired,
    properties: PropTypes.object.isRequired,
    char_size: PropTypes.number,
    datetime: PropTypes.string
  };

  render() {
    const { annotator, latex, latex_normalized, imagePath, properties, char_size, datetime } = this.props;
    const basePath = imagePath.split("/").slice(-1)[0];
    const latexEditURL = "/?sessionID=" + basePath.slice(0, -4);
    const imageURL = consts.S3BUCKET_URL + basePath;

    let propsStr = "";
    for (let key in properties) {
      if (properties[key].value) {
        propsStr += properties[key].description + "\n";
      }
    }
    if (char_size !== null && char_size !== undefined) {
      propsStr += 'char_size: ' + char_size + "\n";
    }

    return (
      <tr>
        <td><img className="equation-img" src={imageURL} /></td>
        <td ref='latex'>{'$$' + latex + '$$'}</td>
        <td ref='latex'>{'$$' + latex_normalized + '$$'}</td>
        <td>{annotator}</td>
        <td>{datetime && moment.utc(datetime).format('MMM D, YYYY')}</td>
        <td className="action-col">
          <a target="_blank" href={latexEditURL}>Link</a>
        </td>
      </tr>
    );
  }
}

class Data extends Component {

  constructor(...args) {
    super(...args);

    this.state = {
      loadUsersApiStatus: consts.API_NOT_LOADED,
      loadUsersApiError: '',
      loadGroupsApiStatus: consts.API_NOT_LOADED,
      loadGroupsApiError: '',
      annotators: [],
      groups: [],
      creatingQueue: false,
      loadDataApiStatus: consts.API_NOT_LOADED,
      loadDataApiError: '',
      loadQueueApiStatus: consts.API_NOT_LOADED,
      loadQueueApiError: '',
      queueUrl: '',
      data: [],
      total: 0,
      filterAnnotator: '',
      filterProperty: {},
      filterFromDate: '',
      filterToDate: '',
      filterGroup: '',
      search: '',
      queue: '',
      sort: '-datetime',
      page: 1
    };

    this.loadUsers = this.loadUsers.bind(this);
    this.loadGroups = this.loadGroups.bind(this);
    this.loadData = this.loadData.bind(this);
    this.onAnnotatorChange = this.onAnnotatorChange.bind(this);
    this.onGroupChange = this.onGroupChange.bind(this);
    this.onPropertyChange = this.onPropertyChange.bind(this);
    this.onFromDateChange = this.onFromDateChange.bind(this);
    this.onToDateChange = this.onToDateChange.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onQueueChange = this.onQueueChange.bind(this);
    this.makeQueryParamsForPageAndApi = this.makeQueryParamsForPageAndApi.bind(this);
    this.onApplyFiltersAndSearchClick = this.onApplyFiltersAndSearchClick.bind(this);
    this.onCreateQueue = this.onCreateQueue.bind(this);
    this.sortByAnnotator = this.onSortClick.bind(this, 'username');
    this.sortByDatetime = this.onSortClick.bind(this, 'datetime');
    this.performSort = this.performSort.bind(this);
    this.onPaging = this.onPaging.bind(this);
    this.setStateByLocationQuery = this.setStateByLocationQuery.bind(this);
    this.bindShortcutKeys = this.bindShortcutKeys.bind(this);
  }

  componentWillMount() {
    this.loadUsers();
    this.loadGroups();
    this.setStateByLocationQuery(this.props.location.query, function() {
      const queryParams = this.makeQueryParamsForPageAndApi(true, true, true);
      this.loadData(queryParams.join('&'));
    }.bind(this));
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
    const propFilters = cloneDeep(consts.DATA_PROPERTIES);
    Object.keys(propFilters).forEach(propKey => propFilters[propKey] = 0);

    if (query.property) {
      const props = query.property.split('*');
      props.forEach(prop => {
        if (prop.startsWith('!')) {
          if (consts.DATA_PROPERTIES[prop.substr(1)]) {
            propFilters[prop.substr(1)] = -1;
          }
        } else {
          if (consts.DATA_PROPERTIES[prop]) {
            propFilters[prop] = 1;
          }
        }
      });
    }

    this.setState({
      filterAnnotator: query.annotator || '',
      filterProperty: propFilters,
      filterFromDate: query.fromDate || '',
      filterToDate: query.toDate || '',
      filterGroup: query.group || '',
      search: query.search || '',
      queue: query.queue || '',
      sort: query.sort || '-datetime',
      page: isNaN(query.page) ? 1 : parseInt(query.page)
    }, callback);
  }

  loadUsers() {
    this.setState({ loadUsersApiStatus: consts.API_LOADING }, () => {
      callApi(LOAD_USERS_API_URL, LOAD_USERS_API_METHOD).then(
        response => {
          console.log('Load Users API success', response);
          if (response.data && Array.isArray(response.data.users)) {
            this.setState({
              loadUsersApiStatus: consts.API_LOADED_SUCCESS,
              annotators: response.data.users.sort()
            });
          } else {
            this.setState({
              loadUsersApiStatus: consts.API_LOADED_ERROR,
              loadUsersApiError: 'Failed to fetch users. Please try again.'
            });
          }
        },
        error => {
          console.log('Load Users API fail', error);
          if (error.error && error.error.message) {
            this.setState({
              loadUsersApiStatus: consts.API_LOADED_ERROR,
              loadUsersApiError: 'Unable to fetch users. ' + error.error.message
            });
          } else {
            this.setState({
              loadUsersApiStatus: consts.API_LOADED_ERROR,
              loadUsersApiError: 'Sorry, Failed to fetch users. Please try again.'
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

  loadData(queryStr = '') {
    this.setState({ loadDataApiStatus: consts.API_LOADING }, () => {
      callApi(LOAD_DATA_API_URL + '?perPage=' + perPage + '&' + queryStr, LOAD_DATA_API_METHOD).then(
        response => {
          console.log('Load Data API success', response);
          if (response.data && response.data.list) {
            this.setState({
              loadDataApiStatus: consts.API_LOADED_SUCCESS,
              data: response.data.list,
              total: response.data.total
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

  onAnnotatorChange(event) {
    this.setState({ filterAnnotator: event.currentTarget.value });
  }

  onGroupChange(event) {
    this.setState({ filterGroup: event.currentTarget.value });
  }

  onPropertyChange(propKey, propValue) {
    const changed = this.state.filterProperty;
    changed[propKey] = propValue;
    this.setState({ filterProperty: changed });
  }

  onFromDateChange(event) {
    this.setState({ filterFromDate: event.currentTarget.value });
  }

  onToDateChange(event) {
    this.setState({ filterToDate: event.currentTarget.value });
  }

  onSearchChange(event) {
    this.setState({ search: event.currentTarget.value });
  }

  onQueueChange(event) {
    this.setState({ queue: event.currentTarget.value });
  }

  makeQueryParamsForPageAndApi(filter_search = true, sort = false, page = false) {
    let queryParams = [];

    if (filter_search) {
      if (this.state.filterAnnotator.length) {
        queryParams.push('annotator=' + encodeURIComponent(this.state.filterAnnotator));
      }
      if (this.state.filterGroup.length) {
        queryParams.push('group=' + encodeURIComponent(this.state.filterGroup));
      }
      const propFilters = [];
      Object.keys(this.state.filterProperty).forEach(propKey => {
        if (this.state.filterProperty[propKey] === 1) {
          propFilters.push(propKey);
        } else if (this.state.filterProperty[propKey] === -1) {
          propFilters.push('!' + propKey);
        }
      });
      if (propFilters.length) {
        queryParams.push('property=' + encodeURIComponent(propFilters.join('*')));
      }
      if (this.state.filterFromDate.length) {
        queryParams.push('fromDate=' + encodeURIComponent(this.state.filterFromDate));
      }
      if (this.state.filterToDate.length) {
        queryParams.push('toDate=' + encodeURIComponent(this.state.filterToDate));
      }
      if (this.state.search.length) {
        queryParams.push('search=' + encodeURIComponent(this.state.search));
      }
      if (this.state.queue.length) {
        queryParams.push('queue=' + encodeURIComponent(this.state.queue));
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

  onCreateQueue() {
    // TODO: implement
    const queryParams = this.makeQueryParamsForPageAndApi(true, false, false);
    const queryStr = '?' + queryParams.join('&');
    console.log(queryParams);
    this.setState({ loadQueueApiStatus: consts.API_LOADING, creatingQueue: true }, () => {
      callApi(CREATE_QUEUE_API_URL + queryStr, CREATE_QUEUE_API_METHOD).then(
        response => {
          console.log('Load Data API success', response);
          if (response.success) {
            this.setState({
              loadQueueApiStatus: consts.API_LOADED_SUCCESS,
              creatingQueue: false,
              queueUrl: response.url
            }, () => {
              MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
            });
          } else {
            this.setState({
              loadQueueApiStatus: consts.API_LOADED_ERROR,
              creatingQueue: false,
              loadQueueApiError: 'Failed to fetch data. ' + response.error
            });
          }
        },
        error => {
          console.log('Create Queue API fail', error);
          if (error.error && error.error.message) {
            this.setState({
              loadQueueApiStatus: consts.API_LOADED_ERROR,
              creatingQueue: false,
              loadQueueApiError: 'Unable to create queue. ' + error.error
            });
          } else {
            this.setState({
              loadQueueApiStatus: consts.API_LOADED_ERROR,
              creatingQueue: false,
              loadQueueApiError: 'Sorry, Failed to create queue. Please try again.'
            });
          }
        }
      );
    });
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

    const { sort, loadDataApiStatus, loadQueueApiStatus } = this.state;
    const pageCount = parseInt(Math.ceil(parseFloat(this.state.total) / perPage));

    return (
      <div id="page-data">
        <DataFilters
          annotators={this.state.annotators} annotator={this.state.filterAnnotator}
          onAnnotatorChange={this.onAnnotatorChange} groups={this.state.groups}
          group={this.state.filterGroup} onGroupChange={this.onGroupChange}
          property={this.state.filterProperty} onPropertyChange={this.onPropertyChange}
          fromDate={this.state.filterFromDate} onFromDateChange={this.onFromDateChange}
          toDate={this.state.filterToDate} onToDateChange={this.onToDateChange}
          search={this.state.search} queue={this.state.queue}
          onSearchChange={this.onSearchChange} onQueueChange={this.onQueueChange}
          onCreateQueue={this.onCreateQueue} queueUrl={this.state.queueUrl} creatingQueue={this.state.creatingQueue}
          onApplyFiltersAndSearchClick={this.onApplyFiltersAndSearchClick} />

        {
          loadDataApiStatus === consts.API_LOADED_SUCCESS ?
            <div className="table-responsive">
              <table className="table data table-hover">
                <thead>
                  <tr>
                    <th colSpan="3" className="pagination-bar">
                      <div className="display-total">{this.state.total} items found</div>
                      <div>
                      <DataPagination count={pageCount} active={this.state.page} pagingFunc={this.onPaging} /></div>
                    </th>
                    <th className="annotator-col">
                      <a href="#" className={'sorter ' + (sort === 'username' ? 'asc' : (sort === '-username' ? 'desc' : ''))}
                         onClick={this.sortByAnnotator}>
                        Annotator {sortIcons}
                      </a>
                    </th>
                    <th className="date-col">
                      <a href="#" className={'sorter ' + (sort === 'datetime' ? 'asc' : (sort === '-datetime' ? 'desc' : ''))}
                         onClick={this.sortByDatetime}>
                        Date (UTC) {sortIcons}
                      </a>
                    </th>
                    <th>Edit</th>
                  </tr>
                </thead>

                <tbody>
                {
                  this.state.data.map((item, index) => (
                    <DataRow key={index}
                      annotator={item.username}
                      latex_normalized={item.latex_normalized || ''}
                      latex={item.latex}
                      imagePath={item.image_path}
                      properties={item.properties}
                      char_size={item.char_size}
                      datetime={item.datetime} />
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
    <Route path="normalized-data" component={Data} />
  </Router>
);

ReactDOM.render(
  routes,
  document.getElementById('main')
);

