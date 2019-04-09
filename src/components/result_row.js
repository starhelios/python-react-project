import React from 'react';

var ResultRow = React.createClass({
  componentDidUpdate() {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
  },
  render: function() {
    var imageURL = "https://s3.amazonaws.com/mpxdata/eqn_images/";
    imageURL = imageURL + this.props.result.session_id + ".jpg";
    var latexURL = "http://mymathpix.com/?sessionID=" + this.props.result.session_id;
    var boxURL = "http://mymathpix.com/box?sessionID=" + this.props.result.session_id;
    var output;
    if (this.props.result.error.length) {
      output = this.props.result.error;
    } else {
      output = '$$' + this.props.result.latex + '$$';
    }
    var error = this.props.result.error;
    var userLink = "/user/" + this.props.result.user_id;
    console.log("output: " + output);
    return (
      <tr>
        <td> <img width="400" src={imageURL} /> </td>
        <td ref='latex'>{output}</td>
        <td>{error}</td>
        <td><a href={latexURL} target="_blank">Latex</a></td>
        <td><a href={userLink} target="_blank">User</a></td>
      </tr>
    );
  }
});

export default ResultRow;
