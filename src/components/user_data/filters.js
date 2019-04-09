import React, { Component, PropTypes } from 'react';
import consts from '../../libs/consts';
import Dropdown, { DropdownTrigger, DropdownContent } from 'react-simple-dropdown';
require('react-simple-dropdown/styles/Dropdown.css');
import PropertyFilterCheckbox from './property_filter_checkbox';

export default class UserDataFilters extends Component {

  render() {

    const { annotated, onAnnotatedChange,
      queued, onQueuedChange,
      property, onPropertyChange,
      fromDate, onFromDateChange,
      toDate, onToDateChange,
      latex, onLatexChange,
      minConfidence, onMinConfidenceChange,
      maxConfidence, onMaxConfidenceChange,
      minSeqLen, onMinSeqLenChange,
      maxSeqLen, onMaxSeqLenChange,
      user, onUserChange,
      group, onGroupChange,
      onApplyFiltersAndSearchClick } = this.props;

    let activeFiltersCount = 0;
    Object.keys(property).forEach(propKey => {
      if (property[propKey] !== 0) {
        activeFiltersCount ++;
      }
    });
    activeFiltersCount += (annotated ? 1 : 0) + (queued ? 1 : 0);

    return (
      <div className="filters">
        <div className="row">
          <div className="search-user col-sm-6 col-lg-2">
            <input type="text" className="form-control" value={user} placeholder="Search user ..." onChange={onUserChange} />
          </div>
          <div className="search-group col-sm-6 col-lg-2">
            <input type="text" className="form-control" value={group} placeholder="Search group ..." onChange={onGroupChange} />
          </div>

          <div className="property col-sm-6 col-lg-2">
            <Dropdown className="property-dropdown" ref="propertyDropdown">
              <DropdownTrigger className="form-control">
                Equation Filters ({activeFiltersCount})
              </DropdownTrigger>
              <DropdownContent>
                <PropertyFilterCheckbox name="annoated"
                                        label="Already Annotated"
                                        checked={annotated}
                                        onChange={onAnnotatedChange} />
                <PropertyFilterCheckbox name="queued"
                                        label="Is Queued"
                                        checked={queued}
                                        onChange={onQueuedChange} />
                <hr />
              {
                Object.keys(consts.PREDICTED_PROPERTIES).map(propKey => (
                  <PropertyFilterCheckbox key={propKey}
                                          name={propKey}
                                          label={consts.PREDICTED_PROPERTIES[propKey]}
                                          checked={property[propKey]}
                                          onChange={onPropertyChange} />
                ))
              }
              </DropdownContent>
            </Dropdown>
          </div>

          <div className="date col-sm-12 col-lg-5">
            <label className="control-label" htmlFor="fromDate">From</label>
            <input type="date" className="form-control" id="fromDate" value={fromDate} onChange={onFromDateChange} />
            <label className="control-label" htmlFor="toDate">To</label>
            <input type="date" className="form-control" id="toDate" value={toDate} onChange={onToDateChange} />
          </div>

          <div className="search-latex col-sm-6 col-lg-2">
            <input type="text" className="form-control" value={latex} placeholder="Search latex ..." onChange={onLatexChange} />
          </div>
          <div className="min-conf col-sm-6 col-lg-2">
            <input type="number" className="form-control" value={minConfidence} placeholder="Min confidence" onChange={onMinConfidenceChange} />
          </div>
          <div className="max-conf col-sm-6 col-lg-2">
            <input type="number" className="form-control" value={maxConfidence} placeholder="Max confidence" onChange={onMaxConfidenceChange} />
          </div>
          <div className="min-conf col-sm-6 col-lg-2">
            <input type="number" className="form-control" value={minSeqLen} placeholder="Min seq len" onChange={onMinSeqLenChange} />
          </div>
          <div className="max-conf col-sm-6 col-lg-2">
            <input type="number" className="form-control" value={maxSeqLen} placeholder="Max seq len" onChange={onMaxSeqLenChange} />
          </div>
          <div className="apply col-sm-6 col-lg-1 text-center">
            <button className="btn btn-primary" onClick={onApplyFiltersAndSearchClick}>Go</button>
          </div>

        </div>
      </div>
    );

  }

}

UserDataFilters.propTypes = {
  annotated: PropTypes.number.isRequired,
  onAnnotatedChange: PropTypes.func.isRequired,
  queued: PropTypes.number.isRequired,
  onQueuedChange: PropTypes.func.isRequired,
  property: PropTypes.object.isRequired,
  onPropertyChange: PropTypes.func.isRequired,
  fromDate: PropTypes.string.isRequired,
  onFromDateChange: PropTypes.func.isRequired,
  toDate: PropTypes.string.isRequired,
  onToDateChange: PropTypes.func.isRequired,
  latex: PropTypes.string.isRequired,
  onLatexChange: PropTypes.func.isRequired,
  onMinConfidenceChange: PropTypes.func.isRequired,
  onMaxConfidenceChange: PropTypes.func.isRequired,
  user: PropTypes.string.isRequired,
  onUserChange: PropTypes.func.isRequired,
  onApplyFiltersAndSearchClick: PropTypes.func.isRequired,
  group: PropTypes.string.isRequired,
  onGroupChange: PropTypes.func.isRequired
};
