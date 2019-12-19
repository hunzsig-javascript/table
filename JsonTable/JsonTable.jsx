import React, {Component} from 'react';
import {Spin, message, Button, Alert, Modal, Table} from 'antd';
import CommonBalloon from './../CommonBalloon';
import {DesktopForm} from 'form';
import {Api} from 'api';
import {I18n} from "foundation";

class ThisPage extends Component {
  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.state = {
      data: null,
      loading: true,
      operation: [
        {
          name: I18n('EDIT'),
          type: 'button',
          onClick: this.doModify,
          button: {
            size: 'small',
            type: 'primary',
          },
        },
        {
          name: I18n('DELETE'),
          type: 'balloon',
          onClick: (data) => {
            this.doDelete(data);
          },
          button: {
            size: 'small',
            type: 'danger',
          },
          balloon: {
            align: 't',
          },
        },
        {
          name: I18n('MOVE_UP'),
          type: 'orderingUp',
          onClick: this.doUp,
          button: {
            size: 'small',
            type: 'default',
          },
        },
        {
          name: I18n('MOVE_DOWN'),
          type: 'orderingDown',
          onClick: this.doDown,
          button: {
            size: 'small',
            type: 'default',
          },
        },
      ],
    };
    this.jsonKey = this.props.jsonKey; // 对应数据库里的key
    this.jsonName = this.props.jsonName || I18n('UN_KNOW'); // 对应数据库里的name
    this.jsonTips = this.props.jsonTips || {add: '', edit: I18n('NO_TIPS')};
    this.jsonFields = this.props.jsonFields || {}; // 数据所有的field
    this.jsonShow = this.props.jsonShow || []; // 数据展示的field
    this.jsonValues = this.props.jsonValues || []; // 数据支持修改的field
    this.valueFormatter = this.props.valueFormatter || null; // 数据前置处理
  }

  componentDidMount() {
    this.query();
  }

  rebuildData = (data) => {
    const values = [];
    data.forEach((val, idx) => {
      let i;
      const temp = {};
      temp.serial = (idx + 1);
      for (i in this.jsonFields) {
        temp[i] = val[i];
      }
      values.push(temp);
    });
    return values;
  };

  query = () => {
    this.setState({
      loading: true,
    });
    Api.real('System.Data.getInfo', {key: this.jsonKey}, (res) => {
      if (res.code === 200) {
        const data = res.data.system_data_data;
        this.setState({
          loading: false,
          data: this.rebuildData(data),
        });
      }
    });
  };

  doInsert = () => {
    const jsonValues = JSON.parse(JSON.stringify(this.jsonValues));
    const modal = Modal.warning({
      width: 800,
      title: `${I18n('ADD')}${this.jsonName}`,
      maskClosable: true,
      className: 'vertical-center-modal hideFooter',
      content: (
        <div>
          {
            this.jsonTips.add && this.jsonTips.add.length > 0 &&
            <Alert message={this.jsonTips.add} type="warning" banner showIcon={false}/>
          }
          <DesktopForm form={{
            scope: 'System.Data.edit',
            refresh: true,
            valueFormatter: (result) => {
              if (typeof this.valueFormatter === 'function') {
                result = this.valueFormatter(result);
                if (typeof result === 'string') {
                  return result;
                }
              }
              let error = null;
              const temp = {};
              temp.serial = this.state.data.length + 1;
              const jsonValuesRequired = {};
              const jsonValuesUnique = {};
              for (const jv in jsonValues) {
                const key = jsonValues[jv].field;
                jsonValuesRequired[key] = !!(jsonValues[jv].params && jsonValues[jv].params.required === true);
                jsonValuesUnique[key] = !!(jsonValues[jv].params && jsonValues[jv].params.unique === 1);
              }
              for (const f in this.jsonFields) {
                if (jsonValuesRequired[f] === true) {
                  if (result[f] === undefined || result[f] === null) {
                    error = `${I18n('PLEASE_TYPE_VALUE')} ${f}`;
                    break;
                  }
                }
                if (jsonValuesUnique[f] === true) {
                  for (const i in this.state.data) {
                    if (this.state.data[i][f] === result[f]) {
                      error = `${I18n('SAME_ALREADY_EXISTS')}${f},${I18n('PLEASE_SET_OTHERS')}${f}`;
                      break;
                    }
                  }
                }
                temp[f] = result[f];
                if (error !== null) {
                  return error;
                }
              }
              if (error !== null) {
                return error;
              }
              this.state.data = this.rebuildData(this.state.data);
              this.state.data.push(temp);
              return {key: this.jsonKey, data: this.state.data};
            },
            onSuccess: () => {
              modal.destroy();
              this.setState({
                data: this.state.data,
              });
            },
            items: [
              {
                col: 0,
                values: this.jsonValues,
              },
            ],
            operation: [
              {
                type: 'submit',
                label: I18n('SURE'),
              },
            ],
          }}
          />
        </div>
      ),
    });
  };

  doModify = (data) => {
    const jsonValues = JSON.parse(JSON.stringify(this.jsonValues));
    for (const i in jsonValues) {
      jsonValues[i].value = data[jsonValues[i].field];
    }
    const modal = Modal.info({
      width: 800,
      title: `${I18n('EDIT')}${this.jsonName}`,
      maskClosable: true,
      className: 'vertical-center-modal hideFooter',
      content: (
        <div>
          {
            this.jsonTips.edit && this.jsonTips.edit.length > 0 &&
            <Alert message={this.jsonTips.edit} type="info" banner showIcon={false}/>
          }
          <DesktopForm form={{
            scope: 'System.Data.edit',
            refresh: true,
            valueFormatter: (result) => {
              if (typeof this.valueFormatter === 'function') {
                result = this.valueFormatter(result);
                if (typeof result === 'string') {
                  return result;
                }
              }
              let error = null;
              const temp = {};
              temp.serial = data.serial;
              const jsonValuesRequired = {};
              const jsonValuesUnique = {};
              for (const jv in jsonValues) {
                const key = jsonValues[jv].field;
                jsonValuesRequired[key] = !!(jsonValues[jv].params && jsonValues[jv].params.required === true);
                jsonValuesUnique[key] = !!(jsonValues[jv].params && jsonValues[jv].params.unique === 1);
              }
              for (const f in this.jsonFields) {
                if (jsonValuesRequired[f] === true) {
                  if (result[f] === undefined || result[f] === null) {
                    error = `${I18n('PLEASE_TYPE_VALUE')} ${f}`;
                    break;
                  }
                }
                if (jsonValuesUnique[f] === true) {
                  for (const i in this.state.data) {
                    if (this.state.data[i][f] === result[f] && this.state.data[i].serial !== temp.serial) {
                      error = `${I18n('SAME_ALREADY_EXISTS')}${f},${I18n('PLEASE_SET_OTHERS')}${f}`;
                      break;
                    }
                  }
                }
                temp[f] = result[f];
                if (error !== null) {
                  return error;
                }
              }
              if (error !== null) {
                return error;
              }
              this.state.data[data.serial - 1] = temp;
              this.state.data = this.rebuildData(this.state.data);
              return {key: this.jsonKey, data: this.state.data};
            },
            onSuccess: () => {
              modal.destroy();
              this.setState({
                data: this.state.data,
              });
            },
            items: [
              {
                col: 0,
                values: jsonValues,
              },
            ],
            operation: [
              {
                type: 'submit',
                label: I18n('SURE'),
              },
            ],
          }}
          />
        </div>
      ),
    });
  };

  doDelete = (data) => {
    const index = Number.parseInt(data.serial, 10) - 1;
    this.state.data.splice(index, 1);
    const values = this.rebuildData(this.state.data);
    this.setState({
      loading: true,
    });
    Api.real('System.Data.edit', {key: this.jsonKey, data: this.state.data}, (res) => {
      if (res.code === 200) {
        message.success(I18n('DELETE_SUCCESS'));
        this.setState({
          loading: false,
          data: values,
        });
      }
    });
  };

  doUp = (data) => {
    const index = Number.parseInt(data.serial, 10) - 1;
    const prevIndex = index - 1;
    const temp1 = JSON.parse(JSON.stringify(this.state.data[prevIndex]));
    const temp2 = JSON.parse(JSON.stringify(this.state.data[index]));
    temp1.serial = index + 1;
    temp2.serial = prevIndex + 1;
    this.state.data[prevIndex] = temp2;
    this.state.data[index] = temp1;
    this.setState({
      loading: true,
    });
    Api.real('System.Data.edit', {key: this.jsonKey, data: this.state.data}, (res) => {
      if (res.code === 200) {
        message.success(I18n('MOVE_UP_SUCCESS'));
        this.setState({
          loading: false,
          data: this.state.data,
        });
      }
    });
  };

  doDown = (data) => {
    const index = Number.parseInt(data.serial, 10) - 1;
    const nextIndex = index + 1;
    const temp1 = JSON.parse(JSON.stringify(this.state.data[nextIndex]));
    const temp2 = JSON.parse(JSON.stringify(this.state.data[index]));
    temp1.serial = index + 1;
    temp2.serial = nextIndex + 1;
    this.state.data[nextIndex] = temp2;
    this.state.data[index] = temp1;
    this.setState({
      loading: true,
    });
    Api.real('System.Data.edit', {key: this.jsonKey, data: this.state.data}, (res) => {
      if (res.code === 200) {
        message.success(I18n('MOVE_DOWN_SUCCESS'));
        this.setState({
          loading: false,
          data: this.state.data,
        });
      }
    });
  };

  renderColumn = (...value) => {
    const key = value[0];
    const index = value[2];
    const val = value[3];
    let tpl = null;
    const data = val[key];
    const dataType = typeof data;
    switch (dataType) {
      case 'object':
        if (Array.isArray(data)) {
          tpl = data.join(',');
        } else {
          tpl = JSON.stringify(data);
        }
        break;
      default:
        tpl = data;
        break;
    }
    return (<span key={index}>{tpl}</span>);
  };

  renderOperations = (value, index, record) => {
    return (
      this.state.operation.map((o, idx) => {
        let tpl = null;
        const id = `h${o.type}_${index}_${idx}`;
        switch (o.type) {
          case 'button':
            tpl = (
              <Button
                id={id}
                style={styles.operationBtn}
                key={idx}
                {...o.button} // see https://alibaba.github.io/ice/component/button
                onClick={o.onClick !== undefined ? o.onClick.bind(index, record) : undefined}
              >
                {o.name}
              </Button>
            );
            break;
          case 'orderingUp':
            tpl = (
              <Button
                disabled={index <= 0}
                id={id}
                style={styles.operationBtn}
                key={idx}
                {...o.button} // see https://alibaba.github.io/ice/component/button
                onClick={o.onClick !== undefined ? o.onClick.bind(index, record) : undefined}
              >
                {o.name}
              </Button>
            );
            break;
          case 'orderingDown':
            tpl = (
              <Button
                disabled={index >= this.state.data.length - 1}
                id={id}
                style={styles.operationBtn}
                key={idx}
                {...o.button} // see https://alibaba.github.io/ice/component/button
                onClick={o.onClick !== undefined ? o.onClick.bind(index, record) : undefined}
              >
                {o.name}
              </Button>
            );
            break;
          case 'balloon':
            tpl = <CommonBalloon key={idx} o={o} index={index} record={record}/>;
            break;
          default:
            break;
        }
        return tpl;
      })
    );
  };

  render() {
    return (
      <Spin style={styles.loading} shape="dot-circle" color="#aaaaaa"
            spinning={this.state.loading === true || this.state.data === null}>
        <div style={styles.formContent}>
          <h2 style={styles.formTitle}>
            <div>
              {this.jsonName}{I18n('MANAGE')}
              <Button type="primary" size="small" style={{marginLeft: '3px'}} onClick={this.doInsert}>
                {I18n('ADD')}
              </Button>
            </div>
          </h2>
          {
            this.state.data !== null &&
            <Table dataSource={this.state.data}>
              <Table.Column title={I18n('SERIAL')} dataIndex="serial" width={100}/>
              {
                this.jsonShow.map((val, idx) => {
                  const renderColumn = (typeof val.renderColumn === 'function') ? val.renderColumn : this.renderColumn;
                  return <Table.Column key={idx} title={val.title}
                                       cell={renderColumn.bind(this, val.dataIndex)} {...val.params} />;
                })
              }
              <Table.Column title={I18n('OPERATION')} cell={this.renderOperations}/>
            </Table>
          }
        </div>
      </Spin>
    );
  }
}

const styles = {
  loading: {
    width: '100%',
    minHeight: '250px',
  },
  formContent: {
    width: '100%',
    position: 'relative',
    backgroundColor: 'rgb(255, 255, 255)',
    borderRadius: '6px',
    padding: '20px',
    marginBottom: '20px',
  },
  formTitle: {
    margin: '0 0 20px',
    paddingBottom: '10px',
    borderBottom: '1px solid #eee',
  },
  operationBtn: {
    marginLeft: '6px',
    marginBottom: '2px',
  },
};

export default ThisPage;
