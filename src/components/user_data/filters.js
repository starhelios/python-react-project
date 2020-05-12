import React, { Component, PropTypes } from 'react';
import consts from '../../libs/consts';
import Dropdown, { DropdownTrigger, DropdownContent } from 'react-simple-dropdown';
require('react-simple-dropdown/styles/Dropdown.css');
import PropertyFilterCheckbox from './property_filter_checkbox';

export default class UserDataFilters extends Component {
  onCopyImageUrlClick =(e) =>{
    const copyOk = this.copyAnnotationToClipboard("image_url")
    if (copyOk)
      this.showAlert( "copy-clipboard-success", "Copied image url to clipboard.");
  }
  copyAnnotationToClipboard = () => {
    const { queueUrl } = this.props;
    let copyTextArea = document.createElement('textarea');
    copyTextArea.innerHTML= queueUrl;
    document.body.appendChild(copyTextArea);
    copyTextArea.select();
    document.execCommand('copy');
    copyTextArea.remove();
    return true;
  }

  render() {
    const { annotated, onAnnotatedChange,
      dataset,
      filterQueue,
      filterLimit, onQueueLimitChange,
      queued, onQueuedChange,
      nullOcr, onNullOcrChange,
      annoList, onAnnoListChange,
      property, onPropertyChange,
      alphabet, onAlphabetChange,
      fromDate,
      latex, toDate,
      minConfidence,
      maxConfidence,
      minSeqLen,
      maxSeqLen,
      user, onInputChange,
      group,
      onApplyFiltersAndSearchClick, onCreateQuery, queueUrl } = this.props;

    let activeFiltersCount = 0;
    Object.keys(property).forEach(propKey => {
      if (property[propKey] !== 0) {
        activeFiltersCount ++;
      }
    });
    activeFiltersCount += (annotated ? 1 : 0) + (queued ? 1 : 0) + (nullOcr ? 1 : 0) + (annoList ? 1 : 0);

    let activeAlphabetsCount = 0;
    Object.keys(alphabet).forEach(propKey => {
      if (alphabet[propKey] !== 0) {
        activeAlphabetsCount ++;
      }
    });
    activeAlphabetsCount += (annotated ? 1 : 0) + (queued ? 1 : 0) + (nullOcr ? 1 : 0) + (annoList ? 1 : 0);

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

          <div className="property col-sm-6 col-lg-2">
            <Dropdown className="property-dropdown" ref="propertyDropdown">
              <DropdownTrigger className="form-control">
                Alphabets ({activeAlphabetsCount})
              </DropdownTrigger>
              <DropdownContent>
                {
                  Object.keys(consts.ALPHABETS).map(propKey => (
                    <PropertyFilterCheckbox key={propKey}
                                            name={propKey}
                                            label={consts.ALPHABETS[propKey]}
                                            checked={alphabet[propKey]}
                                            onChange={onAlphabetChange} />
                  ))
                }
              </DropdownContent>
            </Dropdown>
          </div>
          <div className="date col-sm-12 col-lg-4">
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
        <div className="row">
          <div className="search-latex col-sm-6 col-lg-1">
            <input type="text" name="filterQueue" className="form-control" value={filterQueue} placeholder="Queue name" onChange={onInputChange} />
          </div>
          <div className="search-latex col-sm-6 col-lg-2">
            <div className="group-1">
              <select className="form-control" name="filterDataset" value={dataset} onChange={onInputChange}>
                <option value="">All Datasets</option>
                {
                  this.props.datasets && this.props.datasets.map((_dataset, index) => (
                    <option value={_dataset} key={index}>{_dataset}</option>
                  ))
                }
              </select>
            </div>
          </div>
          <div className="search-latex col-sm-6 col-lg-1">
            <input type="number" name="filterLimit" className="form-control" value={filterLimit} placeholder="Limit (integer)" onChange={onQueueLimitChange} />
          </div>
          <div className="col-sm-6 col-lg-1">
            <button className="btn btn-primary" onClick={onCreateQuery}>
              {
                this.props.creatingQueue ?
                  <img src="/static/img/spinner-sm.gif" width="10" />
                  :
                  'Create queue'
              }
            </button>
          </div>
          {queueUrl ? <div className="search-latex col-sm-6 col-lg-4">
            <span>Queue URL:</span>
            <input type="text" className="form-control" value={queueUrl} readOnly style={{ margin: '0 10px', display: 'inline-block', width: 'auto' }} />
            <a href="javascript:void(0);" onClick={this.copyAnnotationToClipboard}>
              <i className="glyphicon glyphicon-duplicate" style={{fontSize: '1.5em', top: 5, margin: '0 15px'}}> </i>
            </a>
            <a href={queueUrl} target="_blank"><i style={{fontSize: '1.5em', top: 5, margin: '0 15px'}} className="glyphicon glyphicon-new-window"> </i></a>
          </div> : null }
        </div>
      </div>
    );

  }

}

UserDataFilters.propTypes = {
  queueUrl: PropTypes.string,
  filterQueue: PropTypes.string,
  filterLimit: PropTypes.number,
  onQueueLimitChange: PropTypes.func.isRequired,
  dataset: PropTypes.string.isRequired,
  datasets: PropTypes.array.isRequired,
  onCreateQuery: PropTypes.func.isRequired,
  annotated: PropTypes.number.isRequired,
  onAnnotatedChange: PropTypes.func.isRequired,
  queued: PropTypes.number.isRequired,
  nullOcr: PropTypes.number.isRequired,
  annoList: PropTypes.number.isRequired,
  onQueuedChange: PropTypes.func.isRequired,
  onNullOcrChange: PropTypes.func.isRequired,
  property: PropTypes.object.isRequired,
  alphabet: PropTypes.object.isRequired,
  onPropertyChange: PropTypes.func.isRequired,
  onAlphabetChange: PropTypes.func.isRequired,
  fromDate: PropTypes.string.isRequired,
  toDate: PropTypes.string.isRequired,
  latex: PropTypes.string.isRequired,
  user: PropTypes.string.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onApplyFiltersAndSearchClick: PropTypes.func.isRequired,
  group: PropTypes.string.isRequired,
};
