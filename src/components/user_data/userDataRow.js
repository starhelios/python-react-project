import React, { Component, PropTypes } from 'react';
import consts from '../../libs/consts';
import moment from 'moment';
import { MathpixMarkdown, MathpixLoader } from 'mathpix-markdown';

export default class UserDataRow extends Component {

  static propTypes = {
    image: PropTypes.object.isRequired,
    queueImage: PropTypes.func.isRequired,
  };

  constructor(...args) {
    super(...args);
    this.state = { queuing: false };
    this.onQueueClick = this.onQueueClick.bind(this);
    this.onImageClick = this.onImageClick.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    if(this.state.queuing === nextState.queuing && this.props.isBlocked === nextProps.isBlocked )
      return false;
    return true;
  };

  onImageClick(e) {
    this.setState({ queuing: true });
    this.props.queueImage(this.props.image, () => {
      this.setState({ queuing: false });
    });
  }

  onQueueClick = dataset => () => {
    this.setState({ queuing: true });
    this.props.queueImage(this.props.image, dataset, () => {
      this.setState({ queuing: false });
    });
  }

  render() {
    // const { image_id, latex, properties, datetime, batch_id,
    //         is_queued, group, user_id, is_queueing } = this.props.image_data;
    const image = this.props.image;
    const mathpixEditURL = "/annotate/mathpix?sessionID=" + image.image_id;
    const triageEditURL = "/annotate/triage?sessionID=" + image.image_id + "_triage";
    const imageURL = consts.S3BUCKET_URL + image.image_id + '.jpg';
    // const detectionMap = get(properties, 'detection_map');
    const confidence = image.confidence || 0.0;
    let latexEl = "";
    if (image.result.text) {
      latexEl = image.result.text;
    } else {
      const latex = image.internal.latex_anno;
      latexEl = `$$${latex}$$`;
    }
    const latexErr = image.result.error ? <p style={{color: 'red', textAlign: 'center'}}>{image.result.error}</p> : null;
    const rowColor = (image.is_queued || image.is_queueing || this.state.queuing) ? '#ffc107' : 'white';
    let imageResult = JSON.parse(JSON.stringify(image.result));
    delete imageResult.position;
    delete imageResult.detection_map;
    let internal = JSON.parse(JSON.stringify(image.internal));

    return (
      <tr style={{background: rowColor}}>
        <td></td>
        <td className="image-col">
          <img src={imageURL} />
          <p></p>
          {
            image.is_queued ?
              <div>
                <p>
                  <a className="edit-link" target="_blank" href={mathpixEditURL}>Mathpix edit</a>
                </p>
                <p>
                  <a className="edit-link" target="_blank" href={triageEditURL}>Triage edit</a>
                </p>
              </div>
              :
              <div>
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
              </div>
          }
        </td>
        <td>
          {
            latexErr == null ?
              <MathpixLoader>
                <MathpixMarkdown text={latexEl || ""} isDisableFancy={true}/>
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
