import React from 'react';
import ReactDOM from 'react-dom';

var CountsRow = React.createClass({
    render: function() {
        var userURL = "/user/" + this.props.user_id;
        return (
            <tr>
                <td> <a href={userURL}>{this.props.user_id} </a> </td>
                <td> {this.props.count} </td>
            </tr>
        );
    }
})

var StatusBar = React.createClass({
    render: function() {
        return (
            <p>{this.props.curStatus}</p>
        );
    }
})

var Root = React.createClass({
    componentDidMount: function() {
        this.setState({curStatus: "updating..."});
        $.ajax({
          url: "/userCountsJson",
          type: "GET",
          success: function(data) {
            this.setState({
              userCounts: data,
              curStatus: "",
            });
          }.bind(this),
          dataType: "json"
        });
    },
    getInitialState: function() {
        return {userCounts: [],
                curStatus: "Loading..."};
    },
    render: function() {
        var userCounts = this.state.userCounts;
        userCounts.sort(function(a,b) {return b.count - a.count;});
        var rowList = userCounts.map(function(elem) {
            return (
                <CountsRow
                    user_id={elem.user_id}
                    count={elem.count}
                    key={elem.user_id}
                />
            );
        });
        var totalCount = userCounts.reduce(function(acc, obj) {return acc + obj.count;}, 0);
        console.log(totalCount);
        rowList.push(
            <CountsRow
                user_id="All" 
                count={totalCount}
                key={"countTotal"} 
            />
        );
        return (
            <div>
                <StatusBar curStatus={this.state.curStatus} />
                <div id="results"></div>
                <table className="table"> 
                    <thead>
                        <tr>
                            <th> Username </th>
                            <th> Count </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rowList}
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
