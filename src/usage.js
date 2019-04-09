import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';

var consts = {"LOADING": "Loading...", "DONE": "Done!"}

var StatusBar = React.createClass({
    render: function() {
        return (
            <p>{this.props.curStatus}</p>
        );
    }
})

var CountsTable = React.createClass({
  componentDidMount: function() {
  },

  render: function() {
    var counts = {};
    this.props.data.forEach(function(d) {
      Object.keys(d.data).forEach(function(group) {
        var countsCur = d.data[group];
        if (counts[group]) {
          counts[group] = counts[group] + countsCur;
        } else {
          counts[group] = countsCur;
        }
      });
    });
    var groupsSorted = Object.keys(counts).sort((a,b) => counts[b] - counts[a]);
    var rows = groupsSorted.map(function(group, idx) {
      return (
        <tr key={idx}>
          <td><a href={"user-data?group=" + group} target="_blank">{group}</a></td>
          <td>{counts[group]}</td>
        </tr>
      );
    });
    var values = Object.values(counts);
    if (values.length > 0) {
      var total = values.reduce((a, b) => a + b);
      rows.unshift(
        <tr key={'zzz'}>
          <td><a href={"user-data"} target="_blank">Total</a></td>
          <td>{total}</td>
        </tr>
      );
    }
    return (
      <div>
        <table className="table">
          <thead>
            <tr>
              <th>Group</th>
              <th>Counts</th>
            </tr>
          </thead>
          <tbody>
            { rows }
          </tbody>
        </table>
      </div>
    );
  }

});

var Root = React.createClass({
    componentDidMount: function() {
      this.updateGraph();
    },
    updateGraph: function() {
      let queryStr = "?fromDate=" + this.state.fromDate + "&toDate=" + this.state.toDate;
      this.setState({curStatus: consts.LOADING, data: []});
      $.ajax({
        url: "/api/get-counts" + queryStr,
        type: "GET",
        success: function(data) {
          this.setState({curStatus: consts.DONE, data: data});
        }.bind(this),
        dataType: "json"
      });
    },
    getInitialState: function() {
      const fromDate = moment().subtract(6, 'days').format('YYYY-MM-DD');
      const toDate = moment().add(1, 'days').format('YYYY-MM-DD');
      return {data: [],
              curStatus: consts.LOADING,
              fromDate: fromDate,
              toDate: toDate};
    },
    onFromDateChange: function (event) {
      this.setState({ fromDate: event.currentTarget.value });
    },
    onToDateChange: function (event) {
      this.setState({ toDate: event.currentTarget.value });
    },
    onSearchClick: function() {
      d3.select("svg").remove();
      this.updateGraph();
    },
    render: function() {
      return (
        <div>
          <form className="form-inline">
            <span>
              <label className="control-label" htmlFor="fromDate">From</label>
              <input type="date" className="form-control" id="fromDate" value={this.state.fromDate} onChange={this.onFromDateChange} />
            </span>
            <span style={{margin: 10}}>
              <label className="control-label" htmlFor="toDate">To</label>
              <input type="date" className="form-control" id="toDate" value={this.state.toDate} onChange={this.onToDateChange} />
            </span>
            <span>
              <button type="button" className="btn btn-primary" onClick={this.onSearchClick}>Search!</button>
            </span>
          </form>
          <CountsTable data={this.state.data} />
          {
            this.state.curStatus === consts.LOADING ?
              <div> <StatusBar curStatus={this.state.curStatus} /></div>
            :
              null
          }
        </div>
      );
    }
})

ReactDOM.render(
  <Root />,
  document.getElementById('main')
);

