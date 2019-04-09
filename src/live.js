import React from 'react';
import ReactDOM from 'react-dom';
import ResultRow from './components/result_row.js';
const Firebase = require("firebase");
import ToggleButton from 'react-toggle-button';

var Root = React.createClass({
  componentDidMount: function() {
    this.firebaseRef = new Firebase("https://mathpix.firebaseio.com/allResults/");
    this.firebaseRef.limitToLast(20).on("child_added",function(snapshot, prevChildKey) {
      var resultNew = snapshot.val();
      this.setState({resultList: this.state.resultList.concat([resultNew])});
      console.log(resultNew);
    }.bind(this));
    console.log(this.state);
  },
  getInitialState: function() {
    return {resultList: [], reverse: false};
  },
  render: function() {
    var resultList = this.state.resultList;
    var elemList = [];
    for (var idx = 0; idx < resultList.length; idx++) {
      var result = resultList[idx];
      if (result.session_id != "test") {
        elemList.push(
          <ResultRow
              key={result.session_id}
              result={result}
          />
        );
      }
    }
    if (this.state.reverse) {
      elemList.reverse();
    }
    return (
      <div>
        Reverse: <ToggleButton
          value={ this.state.reverse || false }
          onToggle={(reverse) => {
          this.setState({
            reverse: !reverse,
          })
        }}/>
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
