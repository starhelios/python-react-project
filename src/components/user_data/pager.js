import React, { PropTypes } from 'react';
import { Pager } from 'react-bootstrap';

export default function UserDataPager({ nextDisabled, prevDisabled, onNextPaging, onPrevPaging, onQueueAll }) {

  return (
    <Pager>
      <Pager.Item href="#" onClick={onPrevPaging} disabled={prevDisabled}>Previous</Pager.Item>
      <Pager.Item href="#" onClick={onNextPaging} disabled={nextDisabled}>Next</Pager.Item>
    </Pager>
  );
}

UserDataPager.propTypes = {
  nextDisabled: PropTypes.bool.isRequired,
  prevDisabled: PropTypes.bool.isRequired,
  onNextPaging: PropTypes.func.isRequired,
  onPrevPaging: PropTypes.func.isRequired,
};
