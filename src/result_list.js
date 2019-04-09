import React from 'react';
import ReactDOM from 'react-dom';

import UserResultRow from './components/user_result_row.js';

var Root = React.createClass({
    getInitialState: function() {
        return {resultList: RESULT_LIST};
    },
    render: function() {
        var resultList = this.state.resultList;
        var elemList = [];
        for (var idx = 0; idx < resultList.length; idx++) {
            var datum = resultList[idx];
            var latex = datum.latex;
            var error = datum.error;
            var session_id = datum.session_id;
            elemList.push(
                <UserResultRow
                    key={session_id} session_id={session_id} latex={latex} error={error}
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
})

ReactDOM.render(
  <Root />,
  document.getElementById('main')
);
