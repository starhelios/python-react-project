import React, { Component, PropTypes } from 'react';
import { MathpixMarkdown, MathpixLoader } from 'mathpix-markdown';
import moment from 'moment';
import * as d3 from 'd3';

import consts from '../../libs/consts';

export default class DataRow extends Component {

  static propTypes = {
    annotator: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    dataset: PropTypes.string.isRequired,
    imagePath: PropTypes.string.isRequired,
    properties: PropTypes.object.isRequired,
    char_size: PropTypes.number,
    datetime: PropTypes.string,
    is_verified: PropTypes.bool
  };

  constructor(props) {
    super(props)
    this.state = {
      imageWidth: 0,
      imageHeight: 0
    }

    this.update = this.update.bind(this);
    this.updateChart = this.updateChart.bind(this);
  }

  componentDidMount() {
    this.updateChart()
  }

  componentDidUpdate() {
    this.updateChart()
  }

  updateChart() {
    const { imageWidth, imageHeight } = this.state;

    if (!imageWidth || !imageHeight) return;

    let u = d3.select(this.svgEl)

    this.props.annoList.forEach(box => {
      const shape = box.shapes && box.shapes[0]
      if (shape) {
        if (shape.type === 'rect') {
          u.append(shape.type)
            .attr("x", shape.geometry.x * imageWidth)
            .attr("y", shape.geometry.y * imageHeight)
            .attr("width", shape.geometry.width * imageWidth)
            .attr("height", shape.geometry.height * imageHeight)
            .style("stroke", shape.style.outline)
            .style("fill", "none")
            .style("stroke-width", shape.style.outline_width);
        } else if (shape.type === 'polygon') {
          u.append("polygon")
            .attr("points", [shape.geometry && shape.geometry.points].map(function (d) {
              return d.map(function (d) {
                return [imageWidth * (d.x), imageHeight * (d.y)].join(",");
              }).join(" ");
            }))
            .style("stroke", shape.style.outline)
            .style("fill", "none")
            .style("stroke-width", shape.style.outline_width);
        }
      }
    });
  }

  update() {
    var img = this.refs.img;
    var imageWidth = img.clientWidth;
    var imageHeight = img.clientHeight;
    this.setState({ imageWidth, imageHeight })
  }

  render() {
    const { annotator, text, imagePath, properties,
      char_size, datetime, is_verified, dataset, annoList } = this.props;
    const basePath = imagePath.split("/").slice(-1)[0];
    const textEditURL = "/annotate/" + dataset + "?sessionID=" + basePath.slice(0, -4);
    const imageURL = consts.S3BUCKET_URL + basePath;

    let propsStr = "";
    for (let key in properties) {
      if (properties[key].value) {
        propsStr += properties[key].description + "\n";
      }
    }
    if (char_size !== null && char_size !== undefined) {
      propsStr += 'char_size: ' + char_size + "\n";
    }
    if (dataset !== null && dataset !== undefined) {
      propsStr += 'dataset: ' + dataset + "\n";
    }
    if (text.length) {
      propsStr += "----------\n";
      propsStr += text;
    }
    const textList = text.split("\n") || [];
    const annoColor = is_verified == true ? "green" : "red";

    return (
      <tr>
        <td className="text-center anno-board">
          <div style={{ position: 'relative' }}>
            <img id="mainImage" ref="img" src={imageURL}
              width={this.props.imageWidth} height={this.props.imageHeight}
              onLoad={this.update} />
            <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, right: 0, bottom: 0 }}>
              <svg
                width={this.state.imageWidth}
                height={this.state.imageHeight}
                ref={el => this.svgEl = el} >
              </svg>
            </div>
          </div>
        </td>
        <td style={{ textAlign: "left" }}>
          <MathpixLoader>
            <MathpixMarkdown text={text} isDisableFancy={true} />
          </MathpixLoader>
        </td>
        <td className="prop-col" style={{ textAlign: "left" }}>
          <div className="code-wrap">
            <pre>{propsStr}</pre>
          </div>
        </td>
        <td style={{ color: annoColor }}>{annotator}</td>
        <td>{datetime && moment.utc(datetime).format('MMM D, YYYY')}</td>
        <td className="action-col">
          <a target="_blank" href={textEditURL}>Link</a>
        </td>
      </tr>
    );
  }
}
