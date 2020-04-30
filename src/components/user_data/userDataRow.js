import React, { Component, PropTypes } from 'react';
import consts from '../../libs/consts';
import moment from 'moment';
import * as d3 from 'd3';
import { forEach } from 'lodash';
import { MathpixMarkdown, MathpixLoader } from 'mathpix-markdown-it';

export default class UserDataRow extends Component {

  static propTypes = {
    image: PropTypes.object.isRequired,
    queueImage: PropTypes.func.isRequired,
  };

  constructor(...args) {
    super(...args);
    this.state = {
      queuing: false,
      imageWidth: 0,
      imageHeight: 0
    };
    this.onQueueClick = this.onQueueClick.bind(this);
    this.onImageClick = this.onImageClick.bind(this);
    this.update = this.update.bind(this);
    this.updateChart = this.updateChart.bind(this);
  }

  componentDidMount() {
    this.updateChart()
  }

  componentDidUpdate() {
    this.updateChart()
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { queuing, imageHeight, imageWidth } = this.state;
    const { isBlocked } = this.props;
    if (
      queuing === nextState.queuing && isBlocked === nextProps.isBlocked &&
      imageHeight === nextState.imageHeight && imageWidth === nextState.imageWidth
    ) return false;
    return true;
  };

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

  onImageClick(e) {
    this.setState({ queuing: true });
    this.props.queueImage(this.props.image, () => {
      this.setState({ queuing: false });
    });
  }

  onQueueClick = dataset => () => {
    this.setState({ queuing: true });
    if (dataset === 'all') {
      this.props.queueImage(this.props.image, 'mathpix', () => {
        this.props.queueImage(this.props.image, 'triage', () => {
          this.setState({ queuing: false });
        });
      });
    } else {
      this.props.queueImage(this.props.image, dataset, () => {
        this.setState({ queuing: false });
      });
    }
  }

  render() {
    // const { image_id, latex, properties, datetime, batch_id,
    //         is_queued, group, user_id, is_queueing } = this.props.image_data;
    const image = this.props.image;
    const mathpixEditURL = "/annotate/mathpix?sessionID=" + image.image_id;
    const ocrEditURL = "/annotate/ocr?sessionID=" + image.image_id + "_ocr";
    const triageEditURL = "/annotate/triage?sessionID=" + image.image_id + "_triage";
    const imageURL = consts.S3BUCKET_URL + image.image_id + '.jpg';
    // const detectionMap = get(properties, 'detection_map');
    const confidence = image.confidence || 0.0;
    let latexEl = "";
    if (image.result && image.result.text) {
      latexEl = image.result.text;
    } else {
      if (image.internal && image.internal.latex_anno) {
        const latex = image.internal.latex_anno;
        latexEl = `$$${latex}$$`;
      }
    }
    const latexErr = image.result && image.result.error ? <p style={{color: 'red', textAlign: 'center'}}>{image.result.error}</p> : null;
    const rowColor = (image.is_queued || image.is_queueing || this.state.queuing) ? '#ffc107' : 'white';
    let imageResult = JSON.parse(JSON.stringify(image.result));
    if (imageResult && imageResult.position) {
      delete imageResult.position;
    }
    if (imageResult && imageResult.detection_map) {
      delete imageResult.detection_map;
    }
    let internal = JSON.parse(JSON.stringify(image.internal));

    return (
      <tr style={{background: rowColor}}>
        <td></td>
        <td className="image-col">
          <div style={{position: 'relative', overflowY: 'auto'}}>
            <img id="mainImage" ref="img" src={imageURL}
                 width={this.props.imageWidth} height={this.props.imageHeight} onLoad={this.update}/>
            <div style={{position: 'absolute', top: 0, left: 0, zIndex: 10, right: 0, bottom: 0}}>
              <svg
                width={this.state.imageWidth}
                height={this.state.imageHeight}
                ref={el => this.svgEl = el}>
              </svg>
            </div>
          </div>
          <p></p>
          {
              <div>
                <div>
                  <p>
                    <a className="edit-link" target="_blank" href={mathpixEditURL}>Mathpix edit (legacy)</a>
                  </p>
                  <p>
                    <a className="edit-link" target="_blank" href={ocrEditURL}>OCR edit</a>
                  </p>
                  <p>
                    <a className="edit-link" target="_blank" href={triageEditURL}>Triage edit</a>
                  </p>
                </div>
                <div>
                  <button type="button" className="btn btn-info btn-queue" onClick={this.onQueueClick('mathpix')}>
                    {
                      this.state.queuing || image.is_queueing ?
                        <img src="/static/img/spinner-sm.gif" />
                        :
                        'Queue Mathpix'
                    }
                  </button>
                </div>
                <br />
                <div>
                  <button type="button" className="btn btn-info btn-queue" onClick={this.onQueueClick('triage')}>
                    {
                      this.state.queuing || image.is_queueing ?
                        <img src="/static/img/spinner-sm.gif" />
                        :
                        'Queue Triage'
                    }
                  </button>
                </div>
                <br />
                <div>
                  <button type="button" className="btn btn-info btn-queue" onClick={this.onQueueClick('ocr')}>
                    {
                      this.state.queuing || image.is_queueing ?
                        <img src="/static/img/spinner-sm.gif" />
                        :
                        'Queue OCR'
                    }
                  </button>
                </div>
                <br />
              </div>
          }
        </td>
        <td>
          {
            latexErr == null ?
              <MathpixLoader>
                <MathpixMarkdown mathJax={{mtextInheritFont: true}} text={latexEl || ""} isDisableFancy={true}/>
              </MathpixLoader>
              :
              latexErr
          }
        </td>
        <td>{ confidence.toFixed(5) }</td>
        <td className="prop-col"><pre>{JSON.stringify(image.request_args, null, 2)}</pre></td>
        <td className="prop-col"><pre>{JSON.stringify(imageResult, null, 2)}</pre></td>
        <td className="prop-col"><pre>{JSON.stringify(internal, null, 2)}</pre></td>
        <td className="user-col">
          <a target="_blank" href={"/user-data?user=" + image.user_id}>{image.user_id}</a>
          {this.props.isBlocked
            ? <button type="button" className="btn btn-danger" onClick={this.props.onUnblockUser} style={{marginTop: 30, display: 'block'}}>Unblock User</button>
            : (this.props.isBlocked > -1 ? <button type="button" className="btn btn-primary" onClick={this.props.onBlockUser} style={{marginTop: 30, display: 'block'}}>Block User</button> : null)
          }
        </td>
        <td className="group-col"><a target="_blank" href={"/user-data?group=" + image.group_id}>{image.group_id}</a></td>
        <td>{image.datetime && moment.utc(image.datetime).format('YYYY-MM-DD HH:mm')}</td>
      </tr>
    );
  }
}
