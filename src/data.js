import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, browserHistory } from 'react-router';
import { cloneDeep, isEqual, get as _get, indexOf } from 'lodash';

import { callApi } from './libs/api';
import consts from './libs/consts';
import DataFilters from './components/data/filters';
import DataPagination from './components/data/pagination';
import DataBody from './components/data/dataBody';

// import styles
require('./styles/data.scss');

const LOAD_ID_LIST_API_URL = '/api/anno-id-list';
const LOAD_DATASETS_API_URL = '/api/datasets';
const LOAD_DATASETS_API_METHOD = 'get';
const LOAD_GROUPS_API_URL = '/api/groups';
const LOAD_GROUPS_API_METHOD = 'get';
const LOAD_VERIFIERS_API_URL = '/api/verifiers';
const LOAD_VERIFIERS_API_METHOD = 'get';
const LOAD_USERS_API_URL = '/api/users';
const LOAD_USERS_API_METHOD = 'get';
const LOAD_DATA_API_URL = '/api/data';
const LOAD_DATA_API_METHOD = 'get';
const CREATE_QUEUE_API_URL = '/api/queue';
const CREATE_QUEUE_API_METHOD = 'get';
const LOAD_QUEUES_API_URL = '/api/data-queues';
const LOAD_QUEUES_API_METHOD = 'get';
const perPage = 50;
const basePageUrl = '/data';

class Data extends Component {

  constructor(...args) {
    super(...args);

    this.state = {
      loadUsersApiStatus: consts.API_NOT_LOADED,
      loadUsersApiError: '',
      loadDatasetsApiStatus: consts.API_NOT_LOADED,
      loadGroupsApiStatus: consts.API_NOT_LOADED,
      loadGroupsApiError: '',
      annotators: [],
      groups: [],
      datasets: [],
      creatingQueue: false,
      loadDataApiStatus: consts.API_NOT_LOADED,
      loadDataApiError: '',
      loadQueueApiStatus: consts.API_NOT_LOADED,
      loadQueueApiError: '',
      queueUrl: '',
      data: [],
      IDList: [],
      total: 0,
      filterViewType: 'raw',
      filterDataset: '',
      filterAnnotator: '',
      filterProperty: {},
      filterAppId: {},
      filterAppCount: {},
      filterFromDate: '',
      filterToDate: '',
      filterGroup: '',
      filterQueue: '',
      filterVerifier: '',
      searchString: '',
      search: '',
      search2: '',
      searchError: false,
      search2Error: false,
      searchID: '',
      queue: '',
      sort: '-datetime',
      page: 1,
      errorMessage: '',
    };

    this.loadUsers = this.loadUsers.bind(this);
    this.loadIDList = this.loadIDList.bind(this);
    this.loadDatasets = this.loadDatasets.bind(this);
    this.loadGroups = this.loadGroups.bind(this);
    this.loadQueues = this.loadQueues.bind(this);
    this.loadVerifiers = this.loadVerifiers.bind(this);
    this.loadData = this.loadData.bind(this);
    this.onPropertyChange = this.onPropertyChange.bind(this);
    this.makeQueryParamsForPageAndApi = this.makeQueryParamsForPageAndApi.bind(this);
    this.onApplyFiltersAndSearchClick = this.onApplyFiltersAndSearchClick.bind(this);
    this.onCreateQueue = this.onCreateQueue.bind(this);
    this.sortByAnnotator = this.onSortClick.bind(this, 'username');
    this.sortByDatetime = this.onSortClick.bind(this, 'datetime');
    this.performSort = this.performSort.bind(this);
    this.onPaging = this.onPaging.bind(this);
    this.setStateByLocationQuery = this.setStateByLocationQuery.bind(this);
    this.bindShortcutKeys = this.bindShortcutKeys.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.onAppIdChange = this.onAppIdChange.bind(this);

    this.onAppCountChange = this.onAppCountChange.bind(this);
  }

  componentWillMount() {
    this.loadIDList(() => {
      this.setStateByLocationQuery(this.props.location.query, function () {
      const queryParams = this.makeQueryParamsForPageAndApi(true, true, true);
      this.loadData(queryParams.join('&'));
    }.bind(this));
    });
    this.loadDatasets();
    this.loadUsers();
    this.loadGroups();
    this.loadQueues();
    this.loadVerifiers();
  }

  componentWillReceiveProps(nextProps) {
    if (!isEqual(this.props.location.query, nextProps.location.query)) {
      this.setStateByLocationQuery(nextProps.location.query, function () {
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
    const filterAppId = {}
    const filterAppCount = {}
    this.state.IDList.forEach(propKey => filterAppId[propKey] = 0);
    this.state.IDList.forEach(propKey => filterAppCount[propKey] = 0);

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

    if (query.boxId) {
      const props = query.boxId.split('*');
      props.forEach(prop => {
        const regexStr = /^(.*)\[([0-9]*)\]$/;
        const regexParam = regexStr.exec(prop);
        let param = prop;
        let paramCount = 0;
        if (regexParam) {
          param = regexParam[1];
          paramCount = regexParam[2];
        }

        if (param.startsWith('!')) {
          if (indexOf(this.state.IDList, param.substr(1) > -1)) {
            filterAppId[param.substr(1)] = -1;
            filterAppCount[param.substr(1)] = paramCount;
          }
        } else {
          if (indexOf(this.state.IDList, param) > -1) {
            filterAppId[param] = 1;
            filterAppCount[param] = paramCount;
          }
        }
      });
    }

    this.setState({
      filterViewType: query.view || 'raw',
      filterDataset: query.dataset || '',
      filterAnnotator: query.annotator || '',
      filterProperty: propFilters,
      filterAppId: filterAppId,
      filterAppCount: filterAppCount,
      filterFromDate: query.fromDate || '',
      filterToDate: query.toDate || '',
      filterGroup: query.group || '',
      filterQueue: query.queues || '',
      filterVerifier: query.verifier || '',
      search: query.search || '',
      search2: query.search2 || '',
      searchString: query.searchString || '',
      searchID: query.searchID || '',
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

  loadIDList(cb) {
    this.setState({ loadDatasetsApiStatus: consts.API_LOADING }, () => {
      callApi(LOAD_ID_LIST_API_URL, LOAD_DATASETS_API_METHOD).then(
        response => {
          console.log('Load IDList API success', response);
          if (response.data && Array.isArray(response.data.anno_id_list)) {
            this.setState({
              loadDatasetsApiStatus: consts.API_LOADED_SUCCESS,
              IDList: response.data.anno_id_list.sort()
            }, () => {
              if (cb && typeof cb === 'function') {
                cb();
              }
            });
          } else {
            this.setState({
              loadDatasetsApiStatus: consts.API_LOADED_ERROR,
              loadGroupsApiError: 'Failed to fetch ID list. Please try again.'
            });
          }
        },
        error => {
          console.log('Load ID List API fail', error);
          if (error.error && error.error.message) {
            this.setState({
              loadDatasetsApiStatus: consts.API_LOADED_ERROR,
              loadGroupsApiError: 'Unable to fetch ID list. ' + error.error.message
            });
          } else {
            this.setState({
              loadDatasetsApiStatus: consts.API_LOADED_ERROR,
              loadGroupsApiError: 'Sorry, Failed to fetch ID list. Please try again.'
            });
          }
        }
      );
    });
  }

  loadDatasets() {
    this.setState({ loadDatasetsApiStatus: consts.API_LOADING }, () => {
      callApi(LOAD_DATASETS_API_URL, LOAD_DATASETS_API_METHOD).then(
        response => {
          console.log('Load Datasets API success', response);
          if (response.data && Array.isArray(response.data.datasets)) {
            this.setState({
              loadDatasetsApiStatus: consts.API_LOADED_SUCCESS,
              datasets: response.data.datasets.sort()
            });
          } else {
            this.setState({
              loadDatasetsApiStatus: consts.API_LOADED_ERROR,
              loadGroupsApiError: 'Failed to fetch groups. Please try again.'
            });
          }
        },
        error => {
          console.log('Load Groups API fail', error);
          if (error.error && error.error.message) {
            this.setState({
              loadDatasetsApiStatus: consts.API_LOADED_ERROR,
              loadGroupsApiError: 'Unable to fetch groups. ' + error.error.message
            });
          } else {
            this.setState({
              loadDatasetsApiStatus: consts.API_LOADED_ERROR,
              loadGroupsApiError: 'Sorry, Failed to fetch groups. Please try again.'
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

  loadQueues() {
    this.setState({ loadQueuesApiStatus: consts.API_LOADING }, () => {
      callApi(LOAD_QUEUES_API_URL, LOAD_QUEUES_API_METHOD).then(
        response => {
          console.log('Load Queues API success', response);
          if (response.data && Array.isArray(response.data.queues)) {
            this.setState({
              loadQueuesApiStatus: consts.API_LOADED_SUCCESS,
              queues: response.data.queues.sort()
            });
          } else {
            this.setState({
              loadQueuesApiStatus: consts.API_LOADED_ERROR,
              loadGroupsApiError: 'Failed to fetch queues. Please try again.'
            });
          }
        },
        error => {
          console.log('Load queues API fail', error);
          if (error.error && error.error.message) {
            this.setState({
              loadQueuesApiStatus: consts.API_LOADED_ERROR,
              loadGroupsApiError: 'Unable to fetch queues. ' + error.error.message
            });
          } else {
            this.setState({
              loadQueuesApiStatus: consts.API_LOADED_ERROR,
              loadGroupsApiError: 'Sorry, Failed to fetch queues. Please try again.'
            });
          }
        }
      );
    });
  }

  loadVerifiers() {
    this.setState({ loadGroupsApiStatus: consts.API_LOADING }, () => {
      callApi(LOAD_VERIFIERS_API_URL, LOAD_VERIFIERS_API_METHOD).then(
        response => {
          console.log('Load Verifiers API success', response);
          if (response.data && Array.isArray(response.data.verifiers)) {
            this.setState({
              loadGroupsApiStatus: consts.API_LOADED_SUCCESS,
              verifiers: response.data.verifiers.sort()
            });
          } else {
            this.setState({
              loadGroupsApiStatus: consts.API_LOADED_ERROR,
              loadGroupsApiError: 'Failed to fetch verifiers. Please try again.'
            });
          }
        },
        error => {
          console.log('Load Verifiers API fail', error);
          if (error.error && error.error.message) {
            this.setState({
              loadGroupsApiStatus: consts.API_LOADED_ERROR,
              loadGroupsApiError: 'Unable to fetch verifiers. ' + error.error.message
            });
          } else {
            this.setState({
              loadGroupsApiStatus: consts.API_LOADED_ERROR,
              loadGroupsApiError: 'Sorry, Failed to fetch verifiers. Please try again.'
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
              total: response.data.total,
              searchError: false,
              search2Error: false,
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
          const errorState = {
            searchError: false,
            search2Error: false
          }
          if (error.error && error.error.type == 'inputError') {
            error.error.fields.forEach(i => {
              errorState[i] = true;
            })
            this.setState({
              loadDataApiStatus: consts.API_NOT_LOADED,
              ...errorState,
              errorMessage: 'Entered invalid data.'
            });
          } else if (error.error && error.error.type == 'dbError') {
            this.setState({
              loadDataApiStatus: consts.API_NOT_LOADED,
              ...errorState,
              errorMessage: `Sorry, Error database: \"${error.error.message}\".`
            })
          } else if (error.error && error.error.message) {
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

    Mousetrap.bind('left', function () {
      if (that.state.loadDataApiStatus === consts.API_LOADED_SUCCESS && that.state.data.length) {
        if (that.state.page > 1) {
          that.onPaging(that.state.page - 1);
        }
      }
    });

    Mousetrap.bind('right', function () {
      if (that.state.loadDataApiStatus === consts.API_LOADED_SUCCESS && that.state.data.length) {
        const pageCount = parseInt(Math.ceil(parseFloat(that.state.total) / perPage));
        if (that.state.page < pageCount) {
          that.onPaging(that.state.page + 1);
        }
      }
    });
  }

  onInputChange(e) {
    this.setState({
      [e.target.name]: e.target.value,
    })
  }

  onPropertyChange(propKey, propValue) {
    const changed = this.state.filterProperty;
    changed[propKey] = propValue;
    this.setState({ filterProperty: changed });
  }

  onAppIdChange(propKey, propValue) {
    const changed = this.state.filterAppId;
    changed[propKey] = propValue;
    this.setState({ filterAppId: changed });
  }

  onAppCountChange(propKey, propValue) {
    const changed = this.state.filterAppCount;
    changed[propKey] = propValue;
    this.setState({ filterAppCount: changed });
  }

  makeQueryParamsForPageAndApi(filter_search = true, sort = false, page = false) {
    let queryParams = [];

    if (filter_search) {
      if (this.state.filterDataset.length) {
        queryParams.push('dataset=' + encodeURIComponent(this.state.filterDataset));
      }
      if (this.state.filterViewType) {
        queryParams.push('view=' + encodeURIComponent(this.state.filterViewType));
      }
      if (this.state.filterAnnotator.length) {
        queryParams.push('annotator=' + encodeURIComponent(this.state.filterAnnotator));
      }
      if (this.state.filterGroup.length) {
        queryParams.push('group=' + encodeURIComponent(this.state.filterGroup));
      }
      if (this.state.filterQueue.length) {
        queryParams.push('queues=' + encodeURIComponent(this.state.filterQueue));
      }
      if (this.state.filterVerifier.length) {
        queryParams.push('verifier=' + encodeURIComponent(this.state.filterVerifier));
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
      const appIdFilters = [];
      Object.keys(this.state.filterAppId).forEach(propKey => {
        if (this.state.filterAppId[propKey] === 1) {
          appIdFilters.push(propKey);
        } else if (this.state.filterAppId[propKey] === -1) {
          appIdFilters.push('!' + propKey);
        }
      });
      if (appIdFilters.length) {
        const filtersWithCount = appIdFilters.map(item => {
          const counter = this.state.filterAppCount[item] ? `[${this.state.filterAppCount[item]}]` : '';
          return `${item}${counter}`;
        });
        queryParams.push('boxId=' + filtersWithCount.join('*'));
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
      if (this.state.search2.length) {
        queryParams.push('search2=' + encodeURIComponent(this.state.search2));
      }
      if (this.state.searchString.length) {
        queryParams.push('searchString=' + encodeURIComponent(this.state.searchString.trim()));
      }
      if (this.state.searchID.length) {
        queryParams.push('searchID=' + encodeURIComponent(this.state.searchID));
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
    const { filterViewType } = this.state;
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
          onInputChange={this.onInputChange}
          datasets={this.state.datasets}
          dataset={this.state.filterDataset}
          IDList={this.state.IDList}
          onDatasetChange={this.onDatasetChange}
          annotators={this.state.annotators} annotator={this.state.filterAnnotator}
          groups={this.state.groups}
          queues={this.state.queues}
          queueFilter={this.state.filterQueue}
          verifiers={this.state.verifiers}
          group={this.state.filterGroup}
          verifier={this.state.filterVerifier}
          property={this.state.filterProperty} onPropertyChange={this.onPropertyChange}
          appId={this.state.filterAppId} onAppIdChange={this.onAppIdChange}
          appCount={this.state.filterAppCount} onAppCountChange={this.onAppCountChange}
          fromDate={this.state.filterFromDate}
          toDate={this.state.filterToDate}
          search={this.state.search}
          search2={this.state.search2}
          searchString={this.state.searchString}
          searchError={this.state.searchError} search2Error={this.state.search2Error}
          searchID={this.state.searchID}
          queue={this.state.queue}
          onCreateQueue={this.onCreateQueue} queueUrl={this.state.queueUrl} creatingQueue={this.state.creatingQueue}
          onApplyFiltersAndSearchClick={this.onApplyFiltersAndSearchClick}
          viewType={filterViewType || "raw"}
        />

        {
          loadDataApiStatus === consts.API_LOADED_SUCCESS ?
            <div className="table-responsive">
              <table className="table data table-hover">
                <thead>
                  <tr>
                    <th colSpan={filterViewType !== 'normalized' ? 3 : 4} className="pagination-bar">
                      <div className="display-total">{this.state.total} items found</div>
                      <div>
                        <DataPagination count={pageCount} active={this.state.page} pagingFunc={this.onPaging}/></div>
                    </th>
                    { filterViewType !== 'normalized' ?
                      <th className="annotator-col">
                        <a href="#"
                           className={'sorter ' + (sort === 'username' ? 'asc' : (sort === '-username' ? 'desc' : ''))}
                           onClick={this.sortByAnnotator}>
                          Annotator {sortIcons}
                        </a>
                      </th>
                      : null
                    }
                    { filterViewType !== 'normalized'
                      ? <th className="date-col">
                        <a href="#"
                           className={'sorter ' + (sort === 'datetime' ? 'asc' : (sort === '-datetime' ? 'desc' : ''))}
                           onClick={this.sortByDatetime}>
                          Date (UTC) {sortIcons}
                        </a>
                      </th>
                      : null
                    }
                    <th>Edit</th>
                  </tr>
                </thead>
                <DataBody data={this.state.data} viewType={filterViewType || "raw"} />
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
        {
          loadDataApiStatus === consts.API_NOT_LOADED ?
            <div className="error">{this.state.errorMessage}</div>
            :
            null
        }
      </div>
    );

  }
}

const routes = (
  <Router history={browserHistory}>
    <Route path="data" component={Data} />
  </Router>
);

ReactDOM.render(
  routes,
  document.getElementById('main')
);

