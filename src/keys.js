import React from 'react';
import ReactDOM from 'react-dom';

var KeysRow = React.createClass({
    render: function() {
        return (
            <tr>
                <td> {this.props.app_id} </td>
                <td> {this.props.app_key} </td>
                <td> {this.props.priority} </td>
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

var NewKeysForm = React.createClass({
    onSubmit: function() {
        console.log(this.state);
        this.props.handleSubmit(this.state);
    },
    getInitialState: function() {
        return {email: '', priority: '', group_id: ''}
    },
    onGroupChange: function(e) {
        this.setState({group_id: e.target.value});
    },
    onEmailChange: function(e) {
        this.setState({email: e.target.value});
    },
    onPriorityChange: function(e) {
        this.setState({priority: e.target.value});
    },
    render: function() {
        return (
            <div>
                <input type="text" placeholder="App id (lowercase, no spaces)" className="form-control" id="goup_id" value={this.state.group_id} onChange={this.onGroupChange} />
                <input type="number" placeholder="Priority (use 1 unless high volume)" className="form-control" id="priority" value={this.state.priority} onChange={this.onPriorityChange} />
                <input type="email" placeholder="Email address" className="form-control" id="email" value={this.state.email} onChange={this.onEmailChange} />
                <span className="input-group-btn">
                  <button className="btn btn-primary" onClick={this.onSubmit}>Go</button>
                </span>
            </div>
        );
    }
})

var Root = React.createClass({
    fetchKeys: function() {
        this.setState({curStatus: "updating..."});
        $.ajax({
          url: "/api/keys",
          type: "GET",
          success: function(data) {
            console.log(data);
            this.setState({
              keysData: data,
              curStatus: "",
            });
          }.bind(this),
          dataType: "json"
        });
    },
    componentDidMount: function() {
        this.fetchKeys();
    },
    getInitialState: function() {
        return {keysData: [],
                curStatus: "Loading..."};
    },
    handleSubmit: function(formData) {
        this.setState({curStatus: "Adding new keys..."});
        $.ajax({
            url: "/api/add-keys",
            type: "POST",
            data: JSON.stringify(formData),
            contentType: "application/json; charset=utf-8",
            success: function(data) {
              console.log(data);
              if (data.success) {
                  this.fetchKeys();
              } else {
                  this.setState({curStatus: "Adding keys failed!"});
              }
            }.bind(this),
            dataType: "json"
        });
    },
    render: function() {
        var keysData = this.state.keysData;
        var rowList = keysData.map(function(elem, idx) {
            return (<KeysRow
                key={idx}
                app_id={elem.app_id}
                app_key={elem.app_key}
                priority={elem.priority} />);
        });
        return (
            <div>
                <StatusBar curStatus={this.state.curStatus} />
                <NewKeysForm handleSubmit={this.handleSubmit} />
                <br />
                <table className="table">
                    <thead>
                        <tr>
                            <th> app_id </th>
                            <th> app_key </th>
                            <th> priority </th>
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

