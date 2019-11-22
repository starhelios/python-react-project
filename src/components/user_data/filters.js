import React, { Component, PropTypes } from 'react';
import consts from '../../libs/consts';
import Dropdown, { DropdownTrigger, DropdownContent } from 'react-simple-dropdown';
require('react-simple-dropdown/styles/Dropdown.css');
import PropertyFilterCheckbox from './property_filter_checkbox';

export default class UserDataFilters extends Component {

  render() {
    const { annotated, onAnnotatedChange,
      queued, onQueuedChange,
      nullOcr, onNullOcrChange,
      annoList, onAnnoListChange,
      property, onPropertyChange,
      fromDate,
      latex, toDate,
      minConfidence,
      maxConfidence,
      minSeqLen,
      maxSeqLen,
      user, onInputChange,
      group,
      onApplyFiltersAndSearchClick } = this.props;

    let activeFiltersCount = 0;
    Object.keys(property).forEach(propKey => {
      if (property[propKey] !== 0) {
        activeFiltersCount ++;
      }
    });
    activeFiltersCount += (annotated ? 1 : 0) + (queued ? 1 : 0) + (nullOcr ? 1 : 0) + (annoList ? 1 : 0);

    return (
      <div className="filters">
        <div className="row">
          <div className="search-user col-sm-6 col-lg-2">
            <input type="text" name="searchUser" className="form-control" value={user} placeholder="Search user ..." onChange={onInputChange} />
          </div>
          <div className="search-group col-sm-6 col-lg-2">
            <input type="text" name="searchGroup" className="form-control" value={group} placeholder="Search group ..." onChange={onInputChange} />
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
                <PropertyFilterCheckbox name="nullOcr"
                                        label="Null OCR"
                                        checked={nullOcr}
                                        onChange={onNullOcrChange} />
                <PropertyFilterCheckbox name="annoList"
                                        label="V2 (/v3/text)"
                                        checked={annoList}
                                        onChange={onAnnoListChange} />
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
            <input type="date" name="filterFromDate" className="form-control" id="fromDate" value={fromDate} onChange={onInputChange} />
            <label className="control-label" htmlFor="toDate">To</label>
            <input type="date" name="filterToDate" className="form-control" id="toDate" value={toDate} onChange={onInputChange} />
          </div>

          <div className="search-latex col-sm-6 col-lg-2">
            <input type="text" name="searchLatex" className="form-control" value={latex} placeholder="Search latex ..." onChange={onInputChange} />
          </div>
          <div className="min-conf col-sm-6 col-lg-2">
            <input type="number" name="searchMinConfidence" className="form-control" value={minConfidence} placeholder="Min confidence" onChange={onInputChange} />
          </div>
          <div className="max-conf col-sm-6 col-lg-2">
            <input type="number" name="searchMaxConfidence" className="form-control" value={maxConfidence} placeholder="Max confidence" onChange={onInputChange} />
          </div>
          <div className="min-conf col-sm-6 col-lg-2">
            <input type="number" name="searchMinSeqLen" className="form-control" value={minSeqLen} placeholder="Min seq len" onChange={onInputChange} />
          </div>
          <div className="max-conf col-sm-6 col-lg-2">
            <input type="number" name="searchMaxSeqLen" className="form-control" value={maxSeqLen} placeholder="Max seq len" onChange={onInputChange} />
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
  nullOcr: PropTypes.number.isRequired,
  annoList: PropTypes.number.isRequired,
  onQueuedChange: PropTypes.func.isRequired,
  onNullOcrChange: PropTypes.func.isRequired,
  property: PropTypes.object.isRequired,
  onPropertyChange: PropTypes.func.isRequired,
  fromDate: PropTypes.string.isRequired,
  toDate: PropTypes.string.isRequired,
  latex: PropTypes.string.isRequired,
  user: PropTypes.string.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onApplyFiltersAndSearchClick: PropTypes.func.isRequired,
  group: PropTypes.string.isRequired,
};
