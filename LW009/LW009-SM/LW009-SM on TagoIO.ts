const messageTypeArray:string[] = [
    'Heartbeat report',
    'Parking spaces become empty',
    'Parking spaces was occuiped',
    'Strong magnetic interference',
    'Low battery alert',
    'Magnetic sensor failed',
    'TT&H sensor failed',
    'Radar sensor failed'
];


function Decoder(bytes: number[], fPort: number, groupID: string):{ [key: string]: any }[] {
    const payloadList: { [key: string]: any }[] = [];

    payloadList.push(getPayloadData('port', fPort, groupID));

    const hex_format_payload = bytesToHexString(bytes,0,bytes.length);
    payloadList.push(getPayloadData('hex_format_payload', hex_format_payload, groupID));

    if (fPort != 1) {
        return payloadList;
    }

    var index = 0;
    var head = bytes[index++].toString(16);
    var protocolVersion = bytes[index++];
    var timestamp = bytesToInt(bytes, index, 4);
    var date = new Date();
    var offsetHours = Math.abs(Math.floor(date.getTimezoneOffset() / 60));
    payloadList.push(getPayloadData('timezone', timezone_decode(offsetHours * 2), groupID));
    payloadList.push(getPayloadData('timestamp', timestamp, groupID));
    payloadList.push(getPayloadData('time', parse_time(timestamp, offsetHours), groupID));
    index += 4;
    var frameCount = bytesToInt(bytes, index, 2);
    index += 2
    var messageLength = bytesToInt(bytes, index, 2);
    index += 2
    var instructionCode = bytes[index++];
    var isEncrypted = bytes[index++];
    var messageBytes = bytes.slice(index, index + messageLength);
    for (var i = 0; i < messageLength;) {
        var tag = messageBytes[i++] & 0xff;
        var len = messageBytes[i++] & 0xff;
        if (tag == 0x03) {
            payloadList.push(getPayloadData('payloadType', 'Device Parameter Payload', groupID));
            var deviceType = bytesToInt(messageBytes, i, len);
            if (deviceType == 0x85) {
              payloadList.push(getPayloadData('deviceType', 'LW009-SM', groupID));
            }
          }
          else if (tag == 0x05) {
            const deviceVersion = bytesToInt(messageBytes, i, len).toString();
            payloadList.push(getPayloadData('deviceVersion',deviceVersion , groupID));
          }
          else if (tag == 0x06) {
            const heartbeatInterval = (bytesToInt(messageBytes, i, len) * 30).toString() + 's';
            payloadList.push(getPayloadData('heartbeatInterval',heartbeatInterval , groupID));
          }
          else if (tag == 0x022) {
            const sensitivity = 'Level' + bytesToInt(messageBytes, i, len).toString();
            payloadList.push(getPayloadData('sensitivity',sensitivity , groupID));
          }
          else if (tag == 0x02) {
            const payloadType = 'Device State Payload';
            var value = bytesToInt(messageBytes, i, len);
            var messageType = '';
            if (value == 0x00) {
              messageType = messageTypeArray[0];
            }
            else if (value == 0x0b) {
              messageType = messageTypeArray[1];
            }
            else if (value == 0x0c) {
              messageType = messageTypeArray[2];
            }
            else if (value == 0x0d) {
              messageType = messageTypeArray[3];
            }
            else if (value == 0x0e) {
              messageType = messageTypeArray[4];
            }
            else if (value == 0x10) {
              messageType = messageTypeArray[5];
            }
            else if (value == 0x11) {
              messageType = messageTypeArray[6];
            }
            else if (value == 0x12) {
              messageType = messageTypeArray[7];
            }
            payloadList.push(getPayloadData('messageType',messageType , groupID));
          }
          // else if (tag == 0x23) {
          //   data.radarData = bytesToInt(messageBytes, i + 1, len);
          // }
          else if (tag == 0x24) {
            const batteryLevel = bytesToInt(messageBytes, i, len).toString() + '%';
            payloadList.push(getPayloadData('batteryLevel',batteryLevel , groupID));
          }
          else if (tag == 0x29) {
            const batteryVoltage = bytesToInt(messageBytes, i, len).toString() + 'mV';
            payloadList.push(getPayloadData('batteryVoltage',batteryVoltage , groupID));
          }
          else if (tag == 0x25) {
            payloadList.push(getPayloadData('magneticSensorAxisX',bytesToInt(messageBytes, i, 2) , groupID));
            payloadList.push(getPayloadData('magneticSensorAxisY',bytesToInt(messageBytes, i + 2, 2) , groupID));
            payloadList.push(getPayloadData('magneticSensorAxisZ',bytesToInt(messageBytes, i + 4, 2) , groupID));
          }
          else if (tag == 0x32) {
            const parkingStatusCode = bytesToInt(messageBytes, i, len);
            const parkingStatus = parkingStatusCode == 1 ? 'Parking space with car' : 'No car';
            payloadList.push(getPayloadData('parkingStatus',parkingStatus , groupID));
          }
          else if (tag == 0x0B) {
            const temperature = bytesToInt(messageBytes, i, len).toString() + '°C';
            payloadList.push(getPayloadData('temperature',temperature , groupID));
          }
          else if (tag == 0x35) {
            const humidity = bytesToInt(messageBytes, i, len).toString() + '%';
            payloadList.push(getPayloadData('humidity',humidity , groupID));
        }
        i += len;
    }

    return payloadList; 
}


/*
    整型数组指定部分转换成对应的Hex字符串
    bytes:里面全部为整数,
    start:开始转换的位置
    len:需要转换的长度
*/
function bytesToHexString(bytes: number[], start: number, len: number): string {
    if (bytes.length == 0 || start >= bytes.length || (start + len) > bytes.length) return '';
    var hexStr = '';
    for (var i = 0; i < len; i++) {
        var tempBytes = bytes[start + i];
        var data = tempBytes.toString(16);
        if (tempBytes < 16) {
            data = '0' + data;
        }
        hexStr += data;
    }
    return hexStr;
}

/*
    整型数组指定部分十六进制转换成对应的10进制整数
    bytes:里面全部为整数,
    start:开始转换的位置
    len:需要转换的长度
*/
function bytesToInt(bytes: number[], start: number, len: number): number {
    if (bytes.length == 0 || start >= bytes.length || (start + len) > bytes.length) return 0;
    var value = 0;
    for (let i = 0; i < len; i++) {
        var m = ((len - 1) - i) * 8;
        value = value | bytes[start + i] << m;
    }
    return value;
}

function timezone_decode(tz: number): string {
    let tz_str = 'UTC';
    tz = tz > 128 ? tz - 256 : tz;
    if (tz < 0) {
        tz_str += '-';
        tz = -tz;
    } else {
        tz_str += '+';
    }

    if (tz < 20) {
        tz_str += '0';
    }

    tz_str += String(tz / 2);
    tz_str += ':'

    if (tz % 2) {
        tz_str += '30'
    } else {
        tz_str += '00'
    }

    return tz_str;
}

function parse_time(timestamp: number, timezone: number): string {
    timezone = timezone > 64 ? timezone - 128 : timezone;
    timestamp = timestamp + timezone * 3600;
    if (timestamp < 0) {
        timestamp = 0;
    }

    const d = new Date(timestamp * 1000);
    //d.setUTCSeconds(1660202724);

    let time_str = '';
    time_str += d.getUTCFullYear();
    time_str += '-';
    time_str += formatNumber(d.getUTCMonth() + 1);
    time_str += '-';
    time_str += formatNumber(d.getUTCDate());
    time_str += ' ';

    time_str += formatNumber(d.getUTCHours());
    time_str += ':';
    time_str += formatNumber(d.getUTCMinutes());
    time_str += ':';
    time_str += formatNumber(d.getUTCSeconds());

    return time_str;
}

function formatNumber(number: number): string {
    return number < 10 ? '0' + number.toString() : number.toString();
}

/*
    有符号十六进制字符串转十进制
*/
function signedHexToInt(hexStr: string): number {
    let twoStr = parseInt(hexStr, 16).toString(2); // 将十六转十进制，再转2进制
    
    let bitNum = hexStr.length * 4; // 1个字节 = 8bit ，0xff 一个 'f'就是4位
    if (twoStr.length < bitNum) {
        while (twoStr.length < bitNum) {
            twoStr = '0' + twoStr;
        }
    }
    if (twoStr.substring(0, 1) == '0') {
        // 正数
        return parseInt(twoStr, 2); // 二进制转十进制
    }
    // 负数
    let twoStr_unsign = '';
    let tempValue = parseInt(twoStr, 2) - 1; // 补码：(负数)反码+1，符号位不变；相对十进制来说也是 +1，但这里是负数，+1就是绝对值数据-1
    twoStr_unsign = tempValue.toString(2).substring(1, bitNum); // 舍弃首位(符号位)
    // 去除首字符，将0转为1，将1转为0   反码
    twoStr_unsign = twoStr_unsign.replace(/0/g, 'z');
    twoStr_unsign = twoStr_unsign.replace(/1/g, '0');
    twoStr_unsign = twoStr_unsign.replace(/z/g, '1');
    return parseInt('-' + twoStr_unsign, 2);
}

function getPayloadData(type: string, value: any, groupID: string): { [key: string]: any } {
    return {
        'variable': type,
        'value': value,
        'group': groupID,
    };
}

const payloadd = payload.find((x) => ['payload_raw', 'payload', 'data'].includes(x.variable));
const portt = payload.find((x) => ['port', 'fport', 'f_port'].includes(x.variable));

if (payloadd.value && portt.value) {

  try {
    // Convert the data from Hex to Javascript Buffer.
    var buffer = hexToNumberArray(payloadd.value);
    // payload.push(...Decoder(buffer, port.value, payload_raw.group));
    payload = payload.concat(Decoder(buffer, portt.value, payloadd.group));
  }
  catch (e) {
    
  }
}

function hexToNumberArray(hexString: string): number[] {
    const buffer = Buffer.from(hexString, 'hex');
    return Array.from(buffer, (byte) => byte);
}