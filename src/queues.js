import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';

var consts = {"LOADING": "Loading...", "DONE": "Done!"}

var Root = React.createClass({
    componentDidMount: function() {
      this.updateData();
    },
    onClickDelete: function(queue_name) {
      var result = window.confirm("Are you sure you want to delete queue " + queue_name);
      if (result) {
        $.ajax({
          url: "/api/queues/" + queue_name,
          type: "DELETE",
          success: function(data) {
            var queues_new = this.state.queues.filter((queue) => queue.name != queue_name);
            this.setState({curStatus: consts.DONE, queues: queues_new});
          }.bind(this),
          dataType: "json"
        });
      }
    },
    updateData: function() {
      this.setState({curStatus: consts.LOADING, data: []});
      $.ajax({
        url: "/api/queues",
        type: "GET",
        success: function(data) {
          this.setState({curStatus: consts.DONE, queues: data.queues});
        }.bind(this),
        dataType: "json"
      });
    },
    getInitialState: function() {
      return {queues: [],
              curStatus: consts.LOADING};
    },
    render: function() {
      console.log(this.state.queues);
      return (
        <div>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Count</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {
                this.state.queues.map((elem) =>
                  <tr key={elem.name}>
                    <td><a target="_blank" href={window.location.origin + "/" + elem.url}>{elem.name}</a></td>
                    <td>{elem.length}</td>
                    <td><button className="btn btn-danger" onClick={() => this.onClickDelete(elem.name)}>Delete</button></td>
                  </tr>)
              }
            </tbody>
          </table>
          <br />
          <div>
            <h3>Good sources of data</h3>
            <p><a href={window.location.origin + "/user-data?property=!is_printed*is_not_math*!is_blank&fromDate=2019-08-16&sort=-datetime"}>Handwriting data (for triage)</a></p>
            <p><a href={window.location.origin + "/user-data?property=!is_printed&fromDate=2019-03-04&latex=aligned&group=mathpix_snip"}>Aligned handwritten</a></p>
            <p><a href={window.location.origin + "/user-data?fromDate=2019-03-04&latex=aligned&group=mathpix_snip"}>Aligned printed</a></p>
          </div>
        </div>
      );
    }
})

ReactDOM.render(
  <Root />,
  document.getElementById('main')
);


