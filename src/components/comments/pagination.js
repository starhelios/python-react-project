import React, { PropTypes } from 'react';
import { Pagination } from 'react-bootstrap';

export default function CommentsPagination({ count, active, pagingFunc }) {

  return (
    <Pagination prev next first last
      ellipsis boundaryLinks maxButtons={3}
      items={count} activePage={active}
      onSelect={pagingFunc} />
  );
}

CommentsPagination.propTypes = {
  count: PropTypes.number.isRequired,
  active: PropTypes.number.isRequired,
  pagingFunc: PropTypes.func.isRequired
};
