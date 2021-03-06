import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { callApi } from './libs/api';
import consts from './libs/consts';
import UserDataFilters from './components/user_data/filters';
import UserDataPager from './components/user_data/pager';
import { cloneDeep, isEqual, get } from 'lodash';
import { Router, Route, browserHistory } from 'react-router';
import UserDataBody from "./components/user_data/userDataBody";

// import styles
require('./styles/user_data.scss');

const LOAD_DATASETS_API_URL = '/api/datasets';
const LOAD_DATASETS_API_METHOD = 'get';
const LOAD_USER_DATA_API_URL = '/api/user-data';
const LOAD_USER_DATA_API_METHOD = 'get';
const CREATE_QUEUE_API_URL = '/api/user-data/queue';
const CREATE_QUEUE_API_METHOD = 'get';
const QUEUE_IMAGE_API_URL = '/api/queue-image';
const QUEUE_IMAGE_API_METHOD = 'post';
const perPage = 100;
const basePageUrl = '/user-data';

class UserData extends Component {

  constructor(...args) {
    super(...args);

    this.state = {
      loadDatasetsApiStatus: consts.API_NOT_LOADED,
      loadGroupsApiError: '',
      loadUserDataApiStatus: consts.API_NOT_LOADED,
      loadUserDataApiError: '',
      queueEquationApiStatus: consts.API_NOT_LOADED,
      queueEquationApiError: '',
      userData: [],
      datasets: [],
      filterAnnotated: 0,
      filterQueued: 0,
      filterNullOcr: 0,
      filterAnnoList: 0,
      filterProperty: {},
      alphabetProperty: {},
      filterFromDate: '',
      filterToDate: '',
      filterDataset: '',
      filterLimit: 0,
      filterQueue: '',
      searchLatex: '',
      searchMinConfidence: '',
      searchMaxConfidence: '',
      searchMinSeqLen: '',
      searchMaxSeqLen: '',
      searchUser: '',
      sort: '-datetime',
      page: 1,
      queueUrl: ''
    };

    this.loadUserData = this.loadUserData.bind(this);
    this.queueImage = this.queueImage.bind(this);
    this.loadDatasets = this.loadDatasets.bind(this);
    this.onQueueLimitFilterChange = this.onQueueLimitFilterChange.bind(this);
    this.onAnnotatedFilterChange = this.onAnnotatedFilterChange.bind(this);
    this.onQueuedFilterChange = this.onQueuedFilterChange.bind(this);
    this.onNullOcrFilterChange = this.onNullOcrFilterChange.bind(this);
    this.onAnnoListFilterChange = this.onAnnoListFilterChange.bind(this);
    this.onPropertyFilterChange = this.onPropertyFilterChange.bind(this);
    this.onAlphabetFilterChange = this.onAlphabetFilterChange.bind(this);
    this.makeQueryParamsForPageAndApi = this.makeQueryParamsForPageAndApi.bind(this);
    this.onApplyFiltersAndSearchClick = this.onApplyFiltersAndSearchClick.bind(this);
    this.sortByDatetime = this.onSortClick.bind(this, 'datetime');
    this.sortByUser = this.onSortClick.bind(this, 'user');
    this.sortByGroup = this.onSortClick.bind(this, 'group');
    this.sortByQueued = this.onSortClick.bind(this, 'is_queued');
    this.performSort = this.performSort.bind(this);
    this.onNextPaging = this.onPaging.bind(this, +1);
    this.onPrevPaging = this.onPaging.bind(this, -1);
    this.setStateByLocationQuery = this.setStateByLocationQuery.bind(this);
    this.bindShortcutKeys = this.bindShortcutKeys.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.onCreateQuery = this.onCreateQuery.bind(this);
  }

  componentWillMount() {
    this.setStateByLocationQuery(this.props.location.query, function() {
      const queryParams = this.makeQueryParamsForPageAndApi(true, true, true);
      this.loadUserData(queryParams.join('&'));
    }.bind(this));
    this.loadDatasets();
  }

  componentWillReceiveProps(nextProps) {
    if (!isEqual(this.props.location.query, nextProps.location.query)) {
      this.setStateByLocationQuery(nextProps.location.query, function() {
        const queryParams = this.makeQueryParamsForPageAndApi(true, true, true);
        this.loadUserData(queryParams.join('&'));
      }.bind(this));
    }
  }


  componentDidMount() {
    this.bindShortcutKeys();
  }

  setStateByLocationQuery(query, callback) {
    const propFilters = cloneDeep(consts.PREDICTED_PROPERTIES);
    Object.keys(propFilters).forEach(propKey => propFilters[propKey] = 0);

    if (query.property) {
      const props = query.property.split('*');
      props.forEach(prop => {
        if (prop.startsWith('!')) {
          if (consts.PREDICTED_PROPERTIES[prop.substr(1)]) {
            propFilters[prop.substr(1)] = -1;
          }
        } else {
          if (consts.PREDICTED_PROPERTIES[prop]) {
            propFilters[prop] = 1;
          }
        }
      });
    }

    const alphabetFilters = cloneDeep(consts.ALPHABETS);
    Object.keys(alphabetFilters).forEach(propKey => alphabetFilters[propKey] = 0);

    if (query.alphabets) {
      const alphabets = query.alphabets.split('*');
      alphabets.forEach(prop => {
        if (prop.startsWith('!')) {
          if (consts.ALPHABETS[prop.substr(1)]) {
            alphabetFilters[prop.substr(1)] = -1;
          }
        } else {
          if (consts.ALPHABETS[prop]) {
            alphabetFilters[prop] = 1;
          }
        }
      });
    }

		var d = new Date();
    d.setDate(d.getDate() - 10);
		var dd = d.getDate();
		var mm = d.getMonth()+1; //January is 0!
		var yyyy = d.getFullYear();
		if(dd<10) {
				dd = '0'+dd
		}
		if(mm<10) {
				mm = '0'+mm
		}
		d = yyyy + '-' + mm + '-' + dd;

    this.setState({
      filterAnnotated: parseInt(query.annotated) || 0,
      filterQueued: parseInt(query.queued) || 0,
      filterNullOcr: parseInt(query.nullOcr) || 0,
      filterAnnoList: parseInt(query.annoList) || 0,
      filterProperty: propFilters,
      filterAlphabet: alphabetFilters,
      filterFromDate: query.fromDate || d,
      filterToDate: query.toDate || '',
      searchMinConfidence: query.minConfidence || '',
      searchMaxConfidence: query.maxConfidence || '',
      searchMinSeqLen: query.minSeqLen || '',
      searchMaxSeqLen: query.maxSeqLen || '',
      searchLatex: query.latex || '',
      searchUser: query.user || '',
      searchGroup: query.group || '',
      sort: query.sort || '-datetime',
      page: isNaN(query.page) ? 1 : parseInt(query.page)
    }, callback);
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

  loadUserData(queryStr = '') {
    this.setState({ loadUserDataApiStatus: consts.API_LOADING }, () => {
      callApi(LOAD_USER_DATA_API_URL + '?perPage=' + perPage + '&' + queryStr, LOAD_USER_DATA_API_METHOD).then(
        response => {
          console.log('Load User Data API success', response);
          if (response.data && response.data.list) {
            this.setState({
              loadUserDataApiStatus: consts.API_LOADED_SUCCESS,
              userData: response.data.list
            });
          } else {
            this.setState({
              loadUserDataApiStatus: consts.API_LOADED_ERROR,
              loadUserDataApiError: 'Failed to fetch user data. Please try again.'
            });
          }
        },
        error => {
          console.log('Load User Data API fail', error);
          if (error.error && error.error.message) {
            this.setState({
              loadUserDataApiStatus: consts.API_LOADED_ERROR,
              loadUserDataApiError: 'Unable to fetch user data. ' + error.error.message
            });
          } else {
            this.setState({
              loadUserDataApiStatus: consts.API_LOADED_ERROR,
              loadUserDataApiError: 'Sorry, Failed to fetch user data. Please try again.'
            });
          }
        }
      );
    });
  }

  queueImage(image, dataset, callback) {
    this.setState({ queueEquationApiStatus: consts.API_LOADING }, () => {
      const { image_id } = image;
      // hack: use dataset as default queue name
      const update_log = window.location.hostname.indexOf("localhost") == -1;
      const data = { image, update_log, dataset, queue: dataset};
      callApi(QUEUE_IMAGE_API_URL, QUEUE_IMAGE_API_METHOD, data).then(
        response => {
          console.log('Queue Equation API success', response);
          if (response.success) {
            this.setState({
              queueEquationApiStatus: consts.API_LOADED_SUCCESS
            });
            this.setState({
              userData: this.state.userData.map(item => {
                if (item.image_id === image_id) {
                  item.is_queued = true;
                }
                return item;
              })
            });
            callback && callback(null, response);
          } else {
            this.setState({
              queueEquationApiStatus: consts.API_LOADED_ERROR,
              queueEquationApiError: 'Failed to queue equation. Equation does not exist or already queued'
            });
            callback && callback(null, response);
          }
        },
        error => {
          console.log('Queue Equation API fail', error);
          this.setState({
            queueEquationApiStatus: consts.API_LOADED_ERROR,
            queueEquationApiError: 'Unable to queue equation.'
          });
          callback && callback(error);
        }
      );
    });
  }

  createQueue(queryStr = '', callback) {
    this.setState({ queueEquationApiStatus: consts.API_LOADING }, () => {
      callApi(CREATE_QUEUE_API_URL + '?' + queryStr, CREATE_QUEUE_API_METHOD).then(
        response => {
          console.log('Create Queue API success', response);
          if (response.success) {
            this.setState({
              queueEquationApiStatus: consts.API_LOADED_SUCCESS,
              queueUrl: response.url
            });
            callback && callback(null, response);
          } else {
            this.setState({
              queueEquationApiStatus: consts.API_LOADED_ERROR,
              queueEquationApiError: 'Failed to create queue.'
            });
            callback && callback(null, response);
          }
        },
        error => {
          console.log('Create Queue API fail', error);
          this.setState({
            queueEquationApiStatus: consts.API_LOADED_ERROR,
            queueEquationApiError: 'Unable to create queue.'
          });
          callback && callback(error);
        }
      );
    });
  }

  bindShortcutKeys() {
    const that = this;

    Mousetrap.bind('left', function() {
      if (that.state.loadUserDataApiStatus === consts.API_LOADED_SUCCESS && that.state.page > 1)  {
        that.onPrevPaging();
      }
    });

    Mousetrap.bind('right', function() {
      if (that.state.loadUserDataApiStatus === consts.API_LOADED_SUCCESS && that.state.userData.length === perPage)  {
        that.onNextPaging();
      }
    });
  }

  onInputChange(e) {
    console.log('handler')
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  onCreateQuery() {
    const { filterQueue, filterLimit, filterDataset } = this.state;
    const queryParams = this.makeQueryParamsForPageAndApi(true, false, false);
    queryParams.push(`limit=${filterLimit}`);
    queryParams.push(`dataset=${filterDataset}`);
    queryParams.push(`queue=${filterQueue}`);
    this.createQueue(queryParams.join('&'));
  }

  onQueueLimitFilterChange(e) {
    this.setState({ filterLimit: parseInt(e.target.value) });
  }

  onAnnotatedFilterChange(name, value) {
    this.setState({ filterAnnotated: value });
  }

  onQueuedFilterChange(name, value) {
    this.setState({ filterQueued: value });
  }

  onNullOcrFilterChange(name, value) {
    this.setState({ filterNullOcr: value });
  }

  onAnnoListFilterChange(name, value) {
    this.setState({ filterAnnoList: value });
  }

  onPropertyFilterChange(propKey, propValue) {
    const changed = this.state.filterProperty;
    changed[propKey] = propValue;
    this.setState({ filterProperty: changed });
  }

  onAlphabetFilterChange(propKey, propValue) {
    const changed = this.state.filterAlphabet;
    Object.keys(changed).forEach(key => {
      changed[key] = 0;
    });
    changed[propKey] = propValue > 0 ? 1 : 0;
    this.setState({ filterAlphabet: changed });
  }

  makeQueryParamsForPageAndApi(filter_search = true, sort = false, page = false) {
    let queryParams = [];

    if (filter_search) {
      if (this.state.filterAnnotated !== 0) {
        queryParams.push('annotated=' + this.state.filterAnnotated);
      }
      if (this.state.filterQueued !== 0) {
        queryParams.push('queued=' + this.state.filterQueued);
      }
      if (this.state.filterNullOcr !== 0) {
        queryParams.push('nullOcr=' + this.state.filterNullOcr);
      }
      if (this.state.filterAnnoList !== 0) {
        queryParams.push('annoList=' + this.state.filterAnnoList);
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
      const alphabetFilters = [];
      Object.keys(this.state.filterAlphabet).forEach(propKey => {
        if (this.state.filterAlphabet[propKey] === 1) {
          alphabetFilters.push(propKey);
        } else if (this.state.filterAlphabet[propKey] === -1) {
          alphabetFilters.push('!' + propKey);
        }
      });
      if (alphabetFilters.length) {
        queryParams.push('alphabets=' + encodeURIComponent(alphabetFilters.join('*')));
      }
      if (this.state.filterFromDate.length) {
        queryParams.push('fromDate=' + encodeURIComponent(this.state.filterFromDate));
      }
      if (this.state.filterToDate.length) {
        queryParams.push('toDate=' + encodeURIComponent(this.state.filterToDate));
      }
      if (this.state.searchLatex.length) {
        queryParams.push('latex=' + encodeURIComponent(this.state.searchLatex));
      }
      if (this.state.searchMinConfidence.length) {
        queryParams.push('minConfidence=' + encodeURIComponent(this.state.searchMinConfidence));
      }
      if (this.state.searchMaxConfidence.length) {
        queryParams.push('maxConfidence=' + encodeURIComponent(this.state.searchMaxConfidence));
      }
      if (this.state.searchMaxSeqLen.length) {
        queryParams.push('maxSeqLen=' + encodeURIComponent(this.state.searchMaxSeqLen));
      }
      if (this.state.searchMinSeqLen.length) {
        queryParams.push('minSeqLen=' + encodeURIComponent(this.state.searchMinSeqLen));
      }
      if (this.state.searchUser.length) {
        queryParams.push('user=' + encodeURIComponent(this.state.searchUser));
      }
      if (this.state.searchGroup.length) {
        queryParams.push('group=' + encodeURIComponent(this.state.searchGroup));
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

  onPaging(offset) {
    if (offset === 0) {
      return;
    }
    this.setState({ page: this.state.page + offset }, () => {
      const queryParams = this.makeQueryParamsForPageAndApi(true, true, true);
      browserHistory.push(basePageUrl + '?' + queryParams.join('&'));
    });
  }

  render() {

    const { sort, loadUserDataApiStatus } = this.state;

    if (loadUserDataApiStatus === consts.API_LOADED_ERROR) {
      return (
        <div id="page-user-data">
          <div className="error">{this.state.loadUserDataApiError}</div>
        </div>
      );
    }

    const sortIcons = (
      <span>
        <i className="fa fa-sort" /><i className="fa fa-sort-asc" /><i className="fa fa-sort-desc" />
      </span>
    );
    return (
      <div id="page-user-data">
        <UserDataFilters
          datasets={this.state.datasets}
          filterQueue={this.state.filterQueue}
          filterLimit={this.state.filterLimit} onQueueLimitChange={this.onQueueLimitFilterChange}
          dataset={this.state.filterDataset}
          annotated={this.state.filterAnnotated} onAnnotatedChange={this.onAnnotatedFilterChange}
          queued={this.state.filterQueued} onQueuedChange={this.onQueuedFilterChange}
          nullOcr={this.state.filterNullOcr} onNullOcrChange={this.onNullOcrFilterChange}
          annoList={this.state.filterAnnoList} onAnnoListChange={this.onAnnoListFilterChange}
          property={this.state.filterProperty} onPropertyChange={this.onPropertyFilterChange}
          alphabet={this.state.filterAlphabet} onAlphabetChange={this.onAlphabetFilterChange}
          fromDate={this.state.filterFromDate} onFromDateChange={this.onFromDateChange}
          toDate={this.state.filterToDate} onToDateChange={this.onToDateChange}
          latex={this.state.searchLatex}
          minConfidence={this.state.searchMinConfidence}
          maxConfidence={this.state.searchMaxConfidence}
          minSeqLen={this.state.searchMinSeqLen} maxSeqLen={this.state.searchMaxSeqLen}
          user={this.state.searchUser}
          group={this.state.searchGroup}
          onApplyFiltersAndSearchClick={this.onApplyFiltersAndSearchClick}
          onInputChange={this.onInputChange}
          onCreateQuery={this.onCreateQuery}
          queueUrl={this.state.queueUrl}
          />
        {
          loadUserDataApiStatus === consts.API_LOADED_SUCCESS ?
            <div className="table-responsive" style={{width: 'fit-content'}}>
              <table className="table user-data table-hover">
                <thead>
                <tr>
                  <th colSpan="3">
                    <UserDataPager nextDisabled={this.state.userData.length < perPage} prevDisabled={this.state.page <= 1}
                                   onNextPaging={this.onNextPaging} onPrevPaging={this.onPrevPaging} />
                  </th>
                  <th className="spacing">Conf</th>
                  <th className="spacing">Request</th>
                  <th className="spacing">Result</th>
                  <th className="spacing">Internal</th>
                  <th className="user-col">
                    <a href="#" className={'sorter ' + (sort === 'user' ? 'asc' : (sort === '-user' ? 'desc' : ''))}
                       onClick={this.sortByUser}>
                      User {sortIcons}
                    </a>
                  </th>
                  <th className="group-col">
                    <a href="#" className={'sorter ' + (sort === 'group' ? 'asc' : (sort === '-group' ? 'desc' : ''))}
                       onClick={this.sortByGroup}>
                      Group {sortIcons}
                    </a>
                  </th>
                  <th className="date-col">
                    <a href="#" className={'sorter ' + (sort === 'datetime' ? 'asc' : (sort === '-datetime' ? 'desc' : ''))}
                       onClick={this.sortByDatetime}>
                      Date (UTC) {sortIcons}
                    </a>
                  </th>
                </tr>
                </thead>

                <UserDataBody data={this.state.userData} queueImage={this.queueImage} />

                <tfoot>
                <tr>
                  <td colSpan="6">
                    <UserDataPager nextDisabled={this.state.userData.length < perPage} prevDisabled={this.state.page <= 1}
                                   onNextPaging={this.onNextPaging} onPrevPaging={this.onPrevPaging} />
                  </td>
                </tr>
                </tfoot>
              </table>
            </div>
          :
            null
        }

        {
          loadUserDataApiStatus === consts.API_LOADING ?
            <div className="spinner"><img src="/static/img/spinner-lg.gif" /></div>
          :
            null
        }
        {
          loadUserDataApiStatus === consts.API_LOADED_SUCCESS && !this.state.userData.length ?
            <div className="error">No equations matching the criteria or you are at the last page.</div>
          :
            null
        }
      </div>
    );

  }
}

const routes = (
  <Router history={browserHistory}>
    <Route path="user-data" component={UserData} />
  </Router>
);

ReactDOM.render(
  routes,
  document.getElementById('main')
);

