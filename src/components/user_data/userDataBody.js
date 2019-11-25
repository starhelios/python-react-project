import React, { Component, PropTypes } from 'react';
import { find, isEqual, has, forEach } from 'lodash';
import UserDataRow from "./userDataRow";

export default class UserDataBody extends Component {

  static propTypes = {
    data: PropTypes.array.isRequired
  };

  constructor(...args) {
    super(...args);
    this.state = { blocked: {}, blockedIPs: {}, userIdList: {}};
    this.blockUser = this.blockUser.bind(this);
    this.getBlockedUsers = this.getBlockedUsers.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.data !== this.props.data || !isEqual(this.state.blockedIPs, nextState.blockedIPs)
      || !isEqual(this.state.userIdList, nextState.userIdList) || this.state.blocked !== nextState.blocked) {
      return true;
    }
    return false;
  };

  componentDidMount() {
    this.getBlockedUsers();
  }

  getBlockedUsers() {
    const ids = {};

    forEach(this.props.data, item => {
      if (!has(ids, item.app_id)) {
        $.ajax({
          url: `/api/properties?app_id=${item.app_id}`,
          type: "GET",
          contentType: "application/json; charset=utf-8",
          success: function(data) {
            if (data.success) {
              const userIdList = {...this.state.userIdList}
              const blockedIPs = {...this.state.blockedIPs}
              userIdList[item.app_id] = data && data.data && data.data.user_id_list || [];
              blockedIPs[item.app_id] = data && data.data && data.data.ip || [];

              this.setState({
                userIdList,
                blockedIPs
              });
            }
          }.bind(this),
          dataType: "json"
        });
      }

      ids[item.app_id] = true;
    });
  }

  blockUser(item = {}) {
    const ips = item && item.internal && item.internal.ip || "";
    const ipArr = ips && ips.split(",");
    // TODO: fix the hardcoding
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

  unblockUser(item = {}) {
    const ips = item && item.internal && item.internal.ip || "";
    const ipArr = ips && ips.split(",");
    // TODO: fix hardcoded values
    const payload = {"user_id": item.user_id, "ip": ipArr && ipArr[0] || '', "app_id": item.app_id}

    $.ajax({
      url: "/api/unblock-user",
      type: "POST",
      data: JSON.stringify(payload),
      contentType: "application/json; charset=utf-8",
      success: function(data) {
        if (data.success) {
          const blocked = {...this.state.blocked};
          blocked[item.user_id] = false;
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
          const alreadyBlocked = !!find(blockedIPs[item.app_id], item => item === ip) || !!find(userIdList[item.app_id], item => item === item.user_id);
          let isBlocked = this.state.blocked[item.user_id] || (this.state.blocked[item.user_id] === undefined && alreadyBlocked); // TODO update status here after implementing in dbase

          if (!has(blockedIPs, item.app_id) || !has(userIdList, item.app_id)) {
            isBlocked = -1;
          }

          return (
            <UserDataRow
              key={index}
              image={item}
              annoList={item.anno_list}
              queueImage={this.props.queueImage}
              isBlocked={isBlocked}
              // onGetBlockedUsers={() => this.getBlockedUsers(item.app_id)}
              onBlockUser={() => this.blockUser(item)}
              onUnblockUser={() => this.unblockUser(item)}
            />
          )
        })
      }
      </tbody>
    );
  };
};


