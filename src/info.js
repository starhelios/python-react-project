import React from 'react';
import ReactDOM from 'react-dom';

function getParam(name, defaultValue) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return defaultValue;
    if (!results[2]) return defaultValue;
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function getSessionID() {
    var url = window.location.href;
    var splits = url.split("/");
    var sessionID = splits[splits.length - 1];
    return sessionID;
}

var RowData = React.createClass({
    componentDidMount() {
        MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
    },
    render: function() {
        var basePath = this.props.data.ImagePath.split("/").slice(-1)[0];
        var link = "/?image=" + basePath;
        return (
            <div>
                <h1> {this.props.data.Tag} </h1>
                <a target='_blank' href={link} > {basePath} </a>
                <div>{"$$" + this.props.data.Latex + "$$"}</div>
                <br />
                <img align="middle" src={"/static/debug/" + this.props.data.BoxesPath} />
                <br />
                <br />
                <img align="middle" src={"/static/debug/" + this.props.data.RawBoxesPath} />
                <br />
                <br />
                <pre>{this.props.data.Log}</pre>
            </div>
        );
    }
});

var Root = React.createClass({
    getInitialState: function(){
        return {list: []};
    },
    componentDidMount: function() {
        var sessionID = getSessionID();
        $.ajax({
            url: "/parsingInfo/" + sessionID,
            data: {tag: getParam("tag", "test")},
            type: "GET",
            dataType: "json",
            success: function(data){
                console.log(data);
                this.setState({list: data});
            }.bind(this)
        })
    },
    render: function() {
        if (this.state.list.length == 0) {
            return false;
        } else {
            var items = [];
            for (var key in this.state.list) {
                items.push(<RowData data={this.state.list[key]} key={key} />);
            }
            return (
                <div>
                    {items}
                </div>
            );
        }
    }
})

ReactDOM.render(
    <Root />,
    document.getElementById('main')
);
