import React from 'react';
import ReactDOM from 'react-dom';
import ResultRow from './components/result_row.js';

var Root = React.createClass({
  componentDidMount: function() {
    var url = window.location.pathname;
    var url_list = url.split('/');
    console.log(url_list);
    var user = url_list[url_list.length - 1];
    console.log(user);
    $.ajax({
      url: "/api/user-list/" + user,
      type: "GET",
      success: function(data) {
        console.log(data);
        this.setState({
          resultList: data.data.list, 
        });
      }.bind(this),
      dataType: "json"
    });
  },
  getInitialState: function() {
    return {resultList: []};
  },
  render: function() {
    console.log(this.state.resultList);
    var resultList = this.state.resultList;
    var elemList = [];
    for (var idx = 0; idx < resultList.length; idx++) {
      var result = resultList[idx];
      elemList.push(
        <ResultRow
            key={result.session_id}
            result={result}
        />
      );
    }
    return (
      <div>
        <table className="table"> 
          <tbody>
            {elemList}
          </tbody>
        </table>
      </div>
    );
  }
});

ReactDOM.render(
  <Root />,
  document.getElementById('main')
);
