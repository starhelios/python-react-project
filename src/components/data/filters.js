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
      property, onPropertyChange,
      fromDate, onFromDateChange,
      toDate, onToDateChange,
      search, onSearchChange,
      search2, onSearchChange2,
      searchID, onSearchIDChange,
      queue, onQueueChange, queueUrl,
      onCreateQueue,
      onApplyFiltersAndSearchClick } = this.props;

    let activeFiltersCount = 0;
    Object.keys(property).forEach(propKey => {
      if (property[propKey] !== 0) {
        activeFiltersCount ++;
      }
    });

    return (
      <div className="main-body">
        <div className="flex-row-1">
          <div className="group-1">
            <select className="form-control" value={dataset} onChange={onDatasetChange}>
            <option value="">All Datasets</option>
            {
              this.props.datasets.map((_dataset, index) => (
                <option value={_dataset} key={index}>{_dataset}</option>
              ))
            }
            </select>
          </div>
          <div className="group-1">
            <select className="form-control" value={annotator} onChange={onAnnotatorChange}>
            <option value="">All Annotators</option>
            {
              this.props.annotators.map((_annotator, index) => (
                <option value={_annotator} key={index}>{_annotator}</option>
              ))
            }
            </select>
          </div>
          <div className="group-1">
            <select className="form-control" value={group} onChange={onGroupChange}>
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
          <div className="group-2">
            <small className="text-muted"><label className="control-label" htmlFor="fromDate">Start date</label></small>
            <input type="date" className="form-control" id="fromDate" value={fromDate} onChange={onFromDateChange} />
            <span className="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span>
          </div>
          <div>
            <small className="text-muted"><label className="control-label" htmlFor="toDate">End date</label></small>
            <input type="date" className="form-control" id="toDate" value={toDate} onChange={onToDateChange} />
          </div>
        </div>
        <div className="flex-row-2">
          <div className="group-1">
            <input type="text" className="form-control" value={search} placeholder="Regex match ..." onChange={onSearchChange} />
          </div>
          <div className="group-1">
            <input type="text" className="form-control" value={search2} placeholder="Regex match (2)" onChange={onSearchChange2} />
          </div>
          <div className="group-1">
            <input type="text" className="form-control" value={searchID} placeholder="Search equation ID ..." onChange={onSearchIDChange} />
          </div>
          <div className="group-1">
            <button className="btn btn-primary" onClick={onApplyFiltersAndSearchClick}>Go</button>
          </div>
          <div className="group-1">
            <input type="text" className="form-control" value={queue} placeholder="My new queue name " onChange={onQueueChange} />
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
      </div>
    );

  }

}

DataFilters.propTypes = {
  dataset: PropTypes.string.isRequired,
  datasets: PropTypes.array.isRequired,
  annotators: PropTypes.array.isRequired,
  groups: PropTypes.array.isRequired,
  annotator: PropTypes.string.isRequired,
  group: PropTypes.string.isRequired,
  queue: PropTypes.string.isRequired,
  queueUrl: PropTypes.string.isRequired,
  onDatasetChange: PropTypes.func.isRequired,
  onAnnotatorChange: PropTypes.func.isRequired,
  onGroupChange: PropTypes.func.isRequired,
  property: PropTypes.object.isRequired,
  onPropertyChange: PropTypes.func.isRequired,
  fromDate: PropTypes.string.isRequired,
  onFromDateChange: PropTypes.func.isRequired,
  toDate: PropTypes.string.isRequired,
  onToDateChange: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
  search2: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onSearchChange2: PropTypes.func.isRequired,
  searchID: PropTypes.string.isRequired,
  onSearchIDChange: PropTypes.func.isRequired,
  onQueueChange: PropTypes.func.isRequired,
  onCreateQueue: PropTypes.func.isRequired,
  creatingQueue: PropTypes.bool.isRequired,
  onApplyFiltersAndSearchClick: PropTypes.func.isRequired
};

