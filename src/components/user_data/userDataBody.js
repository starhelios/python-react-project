import React, { Component, PropTypes } from 'react';
import { find } from 'lodash';
import UserDataRow from "./userDataRow";

export default class UserDataBody extends Component {

  static propTypes = {
    data: PropTypes.array.isRequired
  };

  constructor(...args) {
    super(...args);
    this.state = { blocked: {}, blockedIPs: [], userIdList: []};
    this.blockUser = this.blockUser.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.data !== this.props.data || this.state.blockedIPs !== nextState.blockedIPs
      || this.state.userIdList !== nextState.userIdList || this.state.blocked !== nextState.blocked) {
      return true;
    }
    return false;
  };

  componentDidMount() {
    $.ajax({
      url: "/api/properties?app_id=mathpix_chrome",
      type: "GET",
      contentType: "application/json; charset=utf-8",
      success: function(data) {
        if (data.success) {
          this.setState({
            userIdList: data && data.data && data.data.user_id_list,
            blockedIPs: data && data.data && data.data.ip
          });
        }
      }.bind(this),
      dataType: "json"
    });
  }

  blockUser(item = {}) {
    const ips = item && item.internal && item.internal.ip || "";
    const ipArr = ips && ips.split(",");
    const payload = {"user_id": item.user_id, "ip": ipArr && ipArr[0] || '', "app_id": item.app_id}

    $.ajax({
      url: "/api/block-user",
      type: "POST",
      data: JSON.stringify(payload),
      contentType: "application/json; charset=utf-8",
      success: function(data) {
        if (data.success) {
          const blocked = {...this.state.blocked};
          blocked[item.user_id] = true;
          this.setState({blocked});
        }
      }.bind(this),
      dataType: "json"
    });
  }

  render() {
    return (
      <tbody>
      {
        this.props.data.map((item, index) => {
          const { blockedIPs = [], userIdList = [] } = this.state;
          const ips = item && item.internal && item.internal.ip || "";
          const ipArr = ips && ips.split(",");
          const ip = ipArr && ipArr[0] || '';
          const alreadyBlocked = !!find(blockedIPs, item => item === ip) || !!find(userIdList, item => item === item.user_id);
          const isBlocked = this.state.blocked[item.user_id] || alreadyBlocked; // TODO update status here after implementing in dbase

          return (
            <UserDataRow key={index} image={item} queueImage={this.props.queueImage} isBlocked={isBlocked} onBlockUser={() => this.blockUser(item)} />
          )
        })
      }
      </tbody>
    );
  };
};


