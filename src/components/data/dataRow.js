import React, { Component, PropTypes } from 'react';
import { MathpixMarkdown, MathpixLoader } from 'mathpix-markdown-it';
import { forEach } from 'lodash';
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
    is_printed: PropTypes.bool,
    is_handwritten: PropTypes.bool,
    is_inverted: PropTypes.bool,
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

    forEach(this.props.annoList, box => {
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
    const { viewType, annotator, text, imagePath, properties,
            datetime, is_good, is_verified, dataset, annoList, latex_normalized,
            text_normalized, latex, session_id, is_printed,
            is_handwritten, is_inverted, queue, verified_by, group_id } = this.props;
    const basePath = imagePath.split("/").slice(-1)[0];
    const textEditURL = "/annotate/" + dataset + "?sessionID=" + session_id;
    const imageURL = consts.S3BUCKET_URL + basePath;

    let propsStr = "";

    if (viewType === 'raw') {
      for (let key in properties) {
        if (properties[key].value) {
          propsStr += properties[key].description + "\n";
        }
      }
      if (group_id !== null && group_id !== undefined) {
        propsStr += 'group_id: ' + group_id + "\n";
      }
      if (is_printed !== null && is_printed !== undefined) {
        propsStr += 'is_printed: ' + is_printed + "\n";
      }
      if (is_handwritten !== null && is_handwritten !== undefined) {
        propsStr += 'is_handwritten: ' + is_handwritten + "\n";
      }
      if (is_inverted !== null && is_inverted !== undefined) {
        propsStr += 'is_inverted: ' + is_inverted + "\n";
      }
      if (dataset !== null && dataset !== undefined) {
        propsStr += 'dataset: ' + dataset + "\n";
      }
      if (queue !== null && queue !== undefined) {
        propsStr += 'queue: ' + queue + "\n";
      }
      if (text.length) {
        propsStr += "----------\n";
        propsStr += text;
      }
    } else {
      propsStr = text;
    }

    const textList = text.split("\n") || [];
    const annoColor = (is_good == true && is_verified == true) ? "green" : "red";

    return (
      <tr>
        { viewType !== 'normalized' ?
          <td className="text-center anno-board">
            <div style={{position: 'relative', overflowY: 'auto'}}>
              <img id="mainImage" ref="img" src={imageURL}
                   width={this.props.imageWidth} height={this.props.imageHeight}
                   onLoad={this.update}/>
              <div style={{position: 'absolute', top: 0, left: 0, zIndex: 10, right: 0, bottom: 0}}>
                <svg
                  width={this.state.imageWidth}
                  height={this.state.imageHeight}
                  ref={el => this.svgEl = el}>
                </svg>
              </div>
            </div>
          </td>
          : null
        }
        <td style={{ textAlign: "left" }}>
          <MathpixLoader>
            <MathpixMarkdown mathJax={{mtextInheritFont: true}} text={text} isDisableFancy={true} />
          </MathpixLoader>
        </td>
        <td className="prop-col" style={{textAlign: "left"}}>
          <div className="code-wrap">
            <pre>{propsStr}</pre>
          </div>
        </td>
        { viewType === 'normalized'
          ? <td style={{textAlign: "left"}}>
            <MathpixLoader>
              <MathpixMarkdown text={`${text_normalized}`} isDisableFancy={true}/>
            </MathpixLoader>
          </td>
          : null
        }
        { viewType === 'normalized'
          ? <td className="prop-col" style={{textAlign: "left"}}>
            <div className="code-wrap">
              <pre>{text_normalized}</pre>
            </div>
          </td>
          : null
        }
        { viewType !== 'normalized' && verified_by ? <td style={{ color: annoColor }}>{annotator} ({verified_by})</td> : null }
        { viewType !== 'normalized' && !verified_by ? <td style={{ color: annoColor }}>{annotator}</td> : null }
        { viewType !== 'normalized' ? <td>{datetime && moment.utc(datetime).format('MMM D, YYYY')}</td> : null}
        <td className="action-col">
          <a target="_blank" href={textEditURL}>Link</a>
        </td>
      </tr>
    );
  }
}
