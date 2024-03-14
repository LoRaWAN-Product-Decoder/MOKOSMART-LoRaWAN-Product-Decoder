var messageTypeArray = [
  "Heartbeat report",
  "Parking spaces become empty",
  "Parking spaces was occuiped",
  "Strong magnetic interference",
  "Low battery alert",
  "Magnetic sensor failed",
  "TT&H sensor failed",
  "Radar sensor failed"
];


// Decode uplink function.
//
// Input is an object with the following fields:
// - bytes = Byte array containing the uplink payload, e.g. [255, 230, 255, 0]
// - fport = Uplink fport.
// - variables = Object containing the configured device variables.
//
// Output must be an object with the following fields:
// - data = Object representing the decoded payload.
function decodeUplink(input) {
  var bytes = input.bytes;
  var port = input.fPort;
  var deviceInfo = {};
  var data = {};

  data.port = port;
  data.hex_format_payload = bytesToHexString(bytes, 0, bytes.length);
  if (port == 1) {
    var index = 0;
    var head = bytes[index++].toString(16);
    var protocolVersion = bytes[index++];
    var timestamp = bytesToInt(bytes, index, 4);
    data.timestamp = timestamp;
    data.time = parse_time(timestamp);
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
        data.payloadType = 'Device Parameter Payload';
        var deviceType = bytesToInt(messageBytes, i, len);
        if (deviceType == 0x85) {
          data.deviceType = 'LW009-SM';
        }
      }
      else if (tag == 0x05) {
        data.deviceVersion = bytesToInt(messageBytes, i, len).toString(16);
      }
      else if (tag == 0x06) {
        data.heartbeatInterval = bytesToInt(messageBytes, i, len) * 30 + 's';
      }
      else if (tag == 0x022) {
        data.sensitivity = 'Level' + bytesToInt(messageBytes, i, len);
      }
      else if (tag == 0x02) {
        data.payloadType = 'Device State Payload';
        var value = bytesToInt(messageBytes, i, len);
        if (value == 0x00) {
          data.messageType = messageTypeArray[0];
        }
        else if (value == 0x0b) {
          data.messageType = messageTypeArray[1];
        }
        else if (value == 0x0c) {
          data.messageType = messageTypeArray[2];
        }
        else if (value == 0x0d) {
          data.messageType = messageTypeArray[3];
        }
        else if (value == 0x0e) {
          data.messageType = messageTypeArray[4];
        }
        else if (value == 0x10) {
          data.messageType = messageTypeArray[5];
        }
        else if (value == 0x11) {
          data.messageType = messageTypeArray[6];
        }
        else if (value == 0x12) {
          data.messageType = messageTypeArray[7];
        }
      }
      // else if (tag == 0x23) {
      //   data.radarData = bytesToInt(messageBytes, i + 1, len);
      // }
      else if (tag == 0x24) {
        data.batteryLevel = bytesToInt(messageBytes, i, len) + '%';
      }
      else if (tag == 0x29) {
        data.batteryVoltage = bytesToInt(messageBytes, i, len) + 'mV';
      }
      else if (tag == 0x25) {
        data.magneticSensorAxisX = bytesToInt(messageBytes, i, 2);
        data.magneticSensorAxisY = bytesToInt(messageBytes, i + 2, 2);
        data.magneticSensorAxisZ = bytesToInt(messageBytes, i + 4, 2);
      }
      else if (tag == 0x32) {
        data.parkingStatus = bytesToInt(messageBytes, i, len) == 1 ? 'Parking space with car' : 'No car';
      }
      else if (tag == 0x0B) {
        data.temperature = bytesToInt(messageBytes, i, len) + "°C";
      }
      else if (tag == 0x35) {
        data.humidity = bytesToInt(messageBytes, i, len) + "%";
      }
      i += len;
    }
  }
  deviceInfo.data = data;
  return deviceInfo;
}

function bytesToInt(bytes, start, len) {
  var value = 0;
  for (var i = 0; i < len; i++) {
    var m = ((len - 1) - i) * 8;
    value = value | bytes[start + i] << m;
  }
  // var value = ((bytes[start] << 24) | (bytes[start + 1] << 16) | (bytes[start + 2] << 8) | (bytes[start + 3]));
  return value;
}

function bytesToHexString(bytes, start, len) {
  var char = [];
  for (var i = 0; i < len; i++) {
    var data = bytes[start + i].toString(16);
    var dataHexStr = ("0x" + data) < 0x10 ? ("0" + data) : data;
    char.push(dataHexStr);
  }
  return char.join("");
}

function parse_time(timestamp) {
  var d = new Date(timestamp * 1000);

  var time_str = "";
  time_str += d.getUTCFullYear();
  time_str += "-";
  time_str += formatNumber(d.getUTCMonth() + 1);
  time_str += "-";
  time_str += formatNumber(d.getUTCDate());
  time_str += " ";

  time_str += formatNumber(d.getUTCHours());
  time_str += ":";
  time_str += formatNumber(d.getUTCMinutes());
  time_str += ":";
  time_str += formatNumber(d.getUTCSeconds());

  return time_str;
}

function formatNumber(number) {
  return number < 10 ? "0" + number : number;
}

function getData(hex) {
  var length = hex.length;
  var datas = [];
  for (var i = 0; i < length; i += 2) {
    var start = i;
    var end = i + 2;
    var data = parseInt("0x" + hex.substring(start, end));
    datas.push(data);
  }
  return datas;
}

// console.log(getData("7E1165F027B20009001D010002010023031C003C29020DE92506F01DF040FD6F3201000B011635012600007E"));
var input = {};
input.fPort = 1;
input.bytes = getData("7E1165F027B20009001D010002010023031C003C29020DE92506F01DF040FD6F3201000B011635012600007E");
console.log(decodeUplink(input));