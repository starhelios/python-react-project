import React, { Component, PropTypes } from 'react';
import Dropdown, { DropdownTrigger, DropdownContent } from 'react-simple-dropdown';
require('react-simple-dropdown/styles/Dropdown.css');

import consts from '../../libs/consts';
import PropertyFilterCheckbox from './property_filter_checkbox';

export default class DataFilters extends Component {
  componentDidUpdate() {
    new Clipboard('#copy-button');
  }

  componentDidMount() {
    new Clipboard('#copy-button');
  }

  render() {

    const { dataset, annotator, onDatasetChange, onAnnotatorChange,
      group, onGroupChange, groups,
      verifier, verifiers,
      property, onPropertyChange,
      fromDate, onFromDateChange,
      toDate, onToDateChange,
      search, onSearchChange,
      searchError, search2Error,
      search2, onSearchChange2,
      searchString, searchID, onSearchIDChange,
      queue, onQueueChange, queueUrl,
      onCreateQueue, viewType, appId,
      onInputChange, IDList, onAppIdChange,
      onApplyFiltersAndSearchClick } = this.props;

    let activeFiltersCount = 0;
    Object.keys(property).forEach(propKey => {
      if (property[propKey] !== 0) {
        activeFiltersCount ++;
      }
    });

    let activeIDFiltersCount = 0;
    Object.keys(appId).forEach(propKey => {
      if (appId[propKey] !== 0) {
        activeIDFiltersCount ++;
      }
    });

    return (
      <div className="main-body">
        <div className="flex-row-1">
          <div className="group-1">
            <select className="form-control" name="filterDataset" value={dataset} onChange={onInputChange}>
            <option value="">All Datasets</option>
            {
              this.props.datasets.map((_dataset, index) => (
                <option value={_dataset} key={index}>{_dataset}</option>
              ))
            }
            </select>
          </div>
          <div className="group-1">
            <select className="form-control" name="filterAnnotator" value={annotator} onChange={onInputChange}>
            <option value="">All Annotators</option>
            {
              this.props.annotators.map((_annotator, index) => (
                <option value={_annotator} key={index}>{_annotator}</option>
              ))
            }
            </select>
          </div>
          <div className="group-1">
            <select className="form-control" name="filterGroup" value={group} onChange={onInputChange}>
            <option value="">All Groups</option>
            {
              this.props.groups.sort(function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
              }).map((_group, index) => (
                <option value={_group} key={index}>{_group}</option>
              ))
            }
            </select>
          </div>
          <div className="property group-1">
            <Dropdown className="property-dropdown" ref="propertyDropdown">
            <DropdownTrigger className="form-control">
              Property Filters ({activeFiltersCount})
              <i className="glyphicon glyphicon-filter"> </i>
            </DropdownTrigger>
            <DropdownContent>
            {
              Object.keys(consts.DATA_PROPERTIES).map(propKey => (
                <PropertyFilterCheckbox key={propKey}
                                        name={propKey}
                                        label={consts.DATA_PROPERTIES[propKey]}
                                        checked={property[propKey]}
                                        onChange={onPropertyChange} />
              ))
            }
            </DropdownContent>
            </Dropdown>
          </div>
          <div className="group-1">
            <select className="form-control" name="filterVerifier" value={verifier} onChange={onInputChange}>
              <option value="">All Verifiers</option>
              {
                this.props.verifiers && this.props.verifiers.sort(function (a, b) {
                  return a.toLowerCase().localeCompare(b.toLowerCase());
                }).map((_verifier, index) => (
                  <option value={_verifier} key={index}>{_verifier}</option>
                ))
              }
            </select>
          </div>
          <div className="property group-1">
            <Dropdown className="property-dropdown" ref="propertyDropdown">
            <DropdownTrigger className="form-control">
              Anno ID filters ({activeIDFiltersCount})
              <i className="glyphicon glyphicon-filter"> </i>
            </DropdownTrigger>
            <DropdownContent>
            {
              IDList.map(propKey => (
                <PropertyFilterCheckbox key={propKey}
                                        name={propKey}
                                        label={propKey}
                                        checked={appId[propKey] || 0}
                                        onChange={onAppIdChange} />
              ))
            }
            </DropdownContent>
            </Dropdown>
          </div>
          <div className="group-2">
            <small className="text-muted"><label className="control-label" htmlFor="fromDate">Start date</label></small>
            <input type="date" className="form-control" name="filterFromDate" id="fromDate" value={fromDate} onChange={onInputChange} />
            <span className="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span>
          </div>
          <div>
            <small className="text-muted"><label className="control-label" htmlFor="toDate">End date</label></small>
            <input type="date" className="form-control" name="filterToDate" id="toDate" value={toDate} onChange={onInputChange} />
          </div>
        </div>
        <div className="flex-row-2">
          <div className="group-1">
            <input type="text" name='searchString' className={`form-control`} value={searchString} placeholder="String" onChange={onInputChange} />
          </div>
          <div className="group-1">
            <input type="text" name='search' className={`form-control ${ searchError ? ' has-error' : ''}`} value={search} placeholder="Regex match ..." onChange={onInputChange} />
            <span>Invalid regex</span>
          </div>
          <div className="group-1">
            <input type="text" name='search2' className={`form-control ${ search2Error ? ' has-error' : ''}`} value={search2} placeholder="Regex match (2)" onChange={onInputChange} />
            <span>Invalid regex</span>
          </div>
          <div className="group-1">
            <input type="text" className="form-control" name="searchID" value={searchID} placeholder="Search equation ID ..." onChange={onInputChange} />
          </div>
          <div className="group-1">
            <button className="btn btn-primary" onClick={onApplyFiltersAndSearchClick}>Go</button>
          </div>
          <div className="group-1">
            <input type="text" className="form-control" name="queue" value={queue} placeholder="My new queue name " onChange={onInputChange} />
          </div>
          <div className="group-1">
            <button className="btn btn-primary" onClick={onCreateQueue}>
              {
                this.props.creatingQueue ?
                  <img src="/static/img/spinner-sm.gif" width="10" />
                :
                  'Create queue!'
              }
            </button>
          </div>
          {
            queueUrl.length > 0 ?
              <div className="input-group">
                <input id="foo" readOnly className="form-control" value={window.location.origin + "/" + queueUrl} />
                <span className="input-group-btn">
              <button data-clipboard-target="#foo" id="copy-button" className="btn btn-primary"><img width="13" src="/static/clippy.svg" alt="Copy to clipboard" /></button>
                </span>
              </div>
            :
              null
          }
        </div>
        <div className="flex-row-3">

            <div className="form-check form-check-inline">
              <span>View:</span>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" name="filterViewType" type="checkbox" id="viewRaw" value="raw" onChange={onInputChange} checked={viewType === 'raw'}/> <label className="form-check-label" htmlFor="viewRaw">Raw</label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" name="filterViewType" type="checkbox" id="viewNormalized" value="normalized" onChange={onInputChange} checked={viewType === 'normalized'}/> <label className="form-check-label" htmlFor="viewNormalized">Normalized</label>
            </div>
        </div>
      </div>
    );
  }
}

DataFilters.propTypes = {
  dataset: PropTypes.string.isRequired,
  datasets: PropTypes.array.isRequired,
  annotators: PropTypes.array.isRequired,
  groups: PropTypes.array.isRequired,
  verifiers: PropTypes.array.isRequired,
  annotator: PropTypes.string.isRequired,
  group: PropTypes.string.isRequired,
  queue: PropTypes.string.isRequired,
  queueUrl: PropTypes.string.isRequired,
  property: PropTypes.object.isRequired,
  onPropertyChange: PropTypes.func.isRequired,
  fromDate: PropTypes.string.isRequired,
  toDate: PropTypes.string.isRequired,
  searchString: PropTypes.string.isRequired,
  search: PropTypes.string.isRequired,
  search2: PropTypes.string.isRequired,
  searchError: PropTypes.bool.isRequired,
  search2Error: PropTypes.bool.isRequired,
  searchID: PropTypes.string.isRequired,
  onCreateQueue: PropTypes.func.isRequired,
  creatingQueue: PropTypes.bool.isRequired,
  onApplyFiltersAndSearchClick: PropTypes.func.isRequired
};

