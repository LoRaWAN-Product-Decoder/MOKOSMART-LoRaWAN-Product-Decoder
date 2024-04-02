var turnOffMode = ["Bluetooth", "LoRa", "Button", "Low Battery"];
var deviceMode = ["Standby Mode", "Timing Mode", "Periodic Mode", "Motion Mode On Stationary", "Motion Mode On Start", "Motion Mode In Trip", "Motion Mode On End"];
var deviceStatus = ["No", "Man Down", "Downlink", "Alert", "SOS"];
var lowPower = ["10%", "20%", "30%", "40%", "50%", "60%"];
var eventType = ["Motion On Start", "Motion In Trip", "Motion On End", "Man Down Start", "Man Down End", "SOS Start", "SOS End", "Alert Start", "Alert End", "Ephemeris Start", "Ephemeris End", "Downlink Report"];
var posType = ["Working Mode", "Man Down", "Downlink", "Alert", "SOS"];
var posDataSign = ["WIFI Pos Success", "BLE Pos Success", "LR1110 GPS Pos Success", "L76 Pos Success", "WIFI Pos Success(No Data)", "LR1110 GPS Pos Success(No Data)"];
var fixFailedReason = [
    "WIFI positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)"
    , "WIFI positioning strategies timeout (Please increase the WIFI positioning timeout via MKLoRa app)"
    , "Bluetooth broadcasting in progress causes WIFI location failure (Please reduce the Bluetooth broadcast timeout or avoid Bluetooth positioning when Bluetooth broadcasting in process via MKLoRa app)"
    , "Bluetooth positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)"
    , "Bluetooth positioning strategies timeout (Please increase the Bluetooth positioning timeout via MKLoRa app)"
    , "Bluetooth broadcasting in progress (Please reduce the Bluetooth broadcast timeout or avoid Bluetooth positioning when Bluetooth broadcasting in process via MKLoRa app)"
    , "GPS positioning timeout (Pls increase GPS positioning timeout via MKLoRa app)"
    , "GPS positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)"
    , "GPS aiding positioning timeout (Please adjust GPS autonomous latitude and autonomous longitude)"
    , "The ephemeris of GPS aiding positioning is too old, need to be updated"
    , "PDOP limit (Please increase the POP value via MKLoRa app)"
    , "Interrupted positioning at start of movement (the movement ends too quickly, resulting in not enough time to complete the positioning)"
    , "Interrupted positioning at end of movement (the movement restarted too quickly, resulting in not enough time to complete the positioning)"
    , "Interrupted by Man Down Detection State"
    , "Interrupted by Downlink for Position"
    , "Interrupted by Alarm Function"
];

// Decode uplink function.
//
// Input is an object with the following fields:
// - bytes = Byte array containing the uplink payload, e.g. [255, 230, 255, 0]
// - fPort = Uplink fPort.
// - variables = Object containing the configured device variables.
//
// Output must be an object with the following fields:
// - data = Object representing the decoded payload.
function decodeUplink(input) {
    var bytes = input.bytes;
    var fPort = input.fPort;
    var dev_info = {};
    var data = {};
    data.port = fPort;
    data.hex_format_payload = bytesToHexString(bytes, 0, bytes.length);

    if (fPort == 1 || fPort == 2 || fPort == 3 || fPort == 4
        || fPort == 5 || fPort == 8 || fPort == 9) {
        data.charging_status = bytes[0] & 0x80 ? "charging" : "no charging";
        data.batt_level = (bytes[0] & 0x7F) + "%";
    }
    if (fPort == 1) {
        // Device info
        data.payload_type = 'Device info';
        var temperature = bytes[1];
        if (temperature > 0x80)
            data.temperature = "-" + (0x100 - temperature) + "°C";
        else
            data.temperature = temperature + "°C";
        var firmware_ver_major = (bytes[2] >> 6) & 0x03;
        var firmware_ver_minor = (bytes[2] >> 4) & 0x03;
        var firmware_ver_patch = bytes[2] & 0x0f;
        data.firmware_version = "V" + firmware_ver_major + "." + firmware_ver_minor + "." + firmware_ver_patch;
        var hardware_ver_major = (bytes[3] >> 4) & 0x0f;
        var hardware_ver_patch = bytes[3] & 0x0f;
        data.hardware_version = "V" + hardware_ver_major + "." + hardware_ver_patch;
        data.device_mode = deviceMode[bytes[4]];
        data.device_status = deviceStatus[bytes[5]];
        data.vibration_status = bytes[6] > 0 ? "Abnormal" : "Normal";

    } else if (fPort == 2 || fPort == 3 || fPort == 4) {
        // 2:Turn off info;3:Heartbeat;4:LowPower;
        var temperature = bytes[1];
        if (temperature > 0x80)
            data.temperature = "-" + (0x100 - temperature) + "°C";
        else
            data.temperature = temperature + "°C";
        data.time = parse_time(bytesToInt(bytes, 2, 4), bytes[6] * 0.5);
        data.timestamp = bytesToInt(bytes, 2, 4);
        data.timezone = timezone_decode(bytes[6]);
        data.device_mode = deviceMode[bytes[7]];
        data.device_status_code = bytes[8] & 0x0F;
        data.device_status = deviceStatus[data.device_status_code];
        if (fPort == 2) {
            data.payload_type = 'Turn off info';
            data.turn_off_mode = turnOffMode[bytes[9]];
        } else if (fPort == 4) {
            data.low_power_prompt = lowPower[bytes[9]];
        }
        // data.batt_v = bytesToInt(bytes, 1, 2) + "mV";
    } else if (fPort == 5) {
        // Event info
        data.payload_type = 'Event info';
        data.time = parse_time(bytesToInt(bytes, 1, 4), bytes[5] * 0.5);
        data.timestamp = bytesToInt(bytes, 1, 4);
        data.timezone = timezone_decode(bytes[5]);
        data.event_type = eventType[bytes[6]];
    } else if (fPort == 6) {
        // L76_GPS data
        data.pos_type = posType[bytesToInt(bytes, 0, 2) >> 12];
        data.age = bytesToInt(bytes, 0, 2) + "s";
        var latitude = Number(signedHexToInt(bytesToHexString(bytes, 2, 4)) * 0.0000001).toFixed(7) + '°';
        var longitude = Number(signedHexToInt(bytesToHexString(bytes, 6, 4)) * 0.0000001).toFixed(7) + '°';
        var pdop = (bytes[10] & 0xFF) * 0.1;
        data.latitude = latitude;
        data.longitude = longitude;
        data.pdop = pdop;
    } else if (fPort == 7) {
        // Saved data
        data.length = bytes[0] & 0xFF;
        var length = data.length;
        if (length == 2) {
            data.packet_sum = bytesToInt(bytes, 1, 2);
        } else {
            data.time = parse_time(bytesToInt(bytes, 1, 4), bytes[5] * 0.5);
            data.timestamp = bytesToInt(bytes, 1, 4);
            data.timezone = timezone_decode(bytes[5]);
            data.data_port = bytes[6] & 0xFF;
            var data_len = length - 6;
            data.rawData = bytesToHexString(bytes, 7, data_len).toUpperCase();
        }
    } else if (fPort == 8) {
        var date = new Date();
        var timestamp = Math.trunc(date.getTime() / 1000);
        var offsetHours = Math.abs(Math.floor(date.getTimezoneOffset() / 60));
        data.timestamp = timestamp;
        data.time = parse_time(timestamp, offsetHours);
        data.timezone = timezone_decode(offsetHours * 2);
        // Pos Success
        // data.payload_type = 'Pos Success';
        data.age = bytesToInt(bytes, 1, 2) + "s";
        data.pos_type = posType[bytes[3] >> 4];
        var pos_data_sign = bytes[3] & 0x0F;
        data.payload_type = posDataSign[pos_data_sign];
        data.pos_data_sign_code = pos_data_sign;
        data.device_mode = deviceMode[bytes[4] >> 4];
        data.device_status_code = bytes[4] & 0x0F;
        data.device_status = deviceStatus[data.device_status_code];
        var pos_data_length = bytes[5] & 0xFF;
        data.pos_data_length = pos_data_length;
        if ((pos_data_sign == 0 || pos_data_sign == 1) && pos_data_length > 0) {
            // WIFI BLE
            var datas = [];
            var count = pos_data_length / 7;
            var index = 6;
            for (var i = 0; i < count; i++) {
                var item = {};
                item.rssi = bytes[index++] - 256 + "dBm";
                item.mac = bytesToHexString(bytes, index, 6).toLowerCase();
                index += 6;
                datas.push(item);
                // datas.push(JSON.stringify(item));
            }
            data.mac_data = datas;
        }
        if (pos_data_sign == 3 && pos_data_length > 0) {
            // L76 GPS
            var datas = [];
            var count = pos_data_length / 9;
            var index = 6;
            // for (var i = 0; i < count; i++) {
            // var item = {};
            var latitude = Number(signedHexToInt(bytesToHexString(bytes, index, 4)) * 0.0000001).toFixed(7) + '°';
            index += 4;
            var longitude = Number(signedHexToInt(bytesToHexString(bytes, index, 4)) * 0.0000001).toFixed(7) + '°';
            index += 4;
            var pdop = Number(bytes[index++] & 0xFF * 0.1).toFixed(1);
            // item.latitude = latitude;
            // item.longitude = longitude;
            // item.pdop = pdop;
            // datas.push(item);
            // }
            // data.pos_data = datas;
            data.latitude = latitude;
            data.longitude = longitude;
            data.pdop = pdop;
        }
    } else if (fPort == 9) {
        // Pos Failed
        data.payload_type = 'Pos Failed';
        data.pos_type = posType[bytes[1]];
        data.device_mode = deviceMode[bytes[2]];
        data.device_status = deviceStatus[bytes[3]];
        var pos_data_sign = bytes[4] & 0x0F;
        data.pos_data_sign = pos_data_sign;
        data.failed_reason = fixFailedReason[pos_data_sign];
        var pos_data_length = bytes[5] & 0xFF;
        data.pos_data_length = pos_data_length;
        if (pos_data_length % 7 == 0) {
            // WIFI/BLE Failed
            var datas = [];
            var count = pos_data_length / 7;
            var index = 6;
            for (var i = 0; i < count; i++) {
                var item = {};
                item.rssi = bytes[index++];
                item.mac = bytesToHexString(bytes, index, 6).toLowerCase();
                index += 6;
                datas.push(item);
            }
            data.pos_data = datas;
        } else if (pos_data_length == 5) {
            // L76 GPS Failed
            var pdop = Number(bytes[6] & 0xFF * 0.1).toFixed(1);
            data.pdop = pdop;
            if (pdop == 0xFF) {
                data.pdop == "unknow";
            }
            var datas = [];
            var index = 7;
            for (var i = 0; i < 4; i++) {
                var item = bytesToHexString(bytes, index++, 1).toLowerCase();
                datas.push(item);
            }
            data.pos_data = datas;
        } else if (pos_data_length == 4) {
            // LR1110 GPS Failed
            var datas = [];
            var index = 6;
            for (var i = 0; i < 4; i++) {
                var item = bytesToHexString(bytes, index++, 1).toLowerCase();
                datas.push(item);
            }
            data.pos_data = datas;
        }
    }
    dev_info.data = data;
    return dev_info;
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

function bytesToString(bytes, start, len) {
    var char = [];
    for (var i = 0; i < len; i++) {
        char.push(String.fromCharCode(bytes[start + i]));
    }
    return char.join("");
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

function timezone_decode(tz) {
    var tz_str = "UTC";
    tz = tz > 128 ? tz - 256 : tz;
    if (tz < 0) {
        tz_str += "-";
        tz = -tz;
    } else {
        tz_str += "+";
    }

    if (tz < 20) {
        tz_str += "0";
    }

    tz_str += String(parseInt(tz / 2));
    tz_str += ":"

    if (tz % 2) {
        tz_str += "30"
    } else {
        tz_str += "00"
    }

    return tz_str;
}

function parse_time(timestamp, timezone) {
    timezone = timezone > 64 ? timezone - 128 : timezone;
    timestamp = timestamp + timezone * 3600;
    if (timestamp < 0) {
        timestamp = 0;
    }

    var d = new Date(timestamp * 1000);
    //d.setUTCSeconds(1660202724);

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

String.prototype.format = function () {
    if (arguments.length == 0)
        return this;
    for (var s = this, i = 0; i < arguments.length; i++)
        s = s.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i]);
    return s;
};

function signedHexToInt(hexStr) {
    var twoStr = parseInt(hexStr, 16).toString(2); // 将十六转十进制，再转2进制
    var bitNum = hexStr.length * 4; // 1个字节 = 8bit ，0xff 一个 "f"就是4位
    if (twoStr.length < bitNum) {
        while (twoStr.length < bitNum) {
            twoStr = "0" + twoStr;
        }
    }
    if (twoStr.substring(0, 1) == "0") {
        // 正数
        twoStr = parseInt(twoStr, 2); // 二进制转十进制
        return twoStr;
    }
    // 负数
    var twoStr_unsign = "";
    twoStr = parseInt(twoStr, 2) - 1; // 补码：(负数)反码+1，符号位不变；相对十进制来说也是 +1，但这里是负数，+1就是绝对值数据-1
    twoStr = twoStr.toString(2);
    twoStr_unsign = twoStr.substring(1, bitNum); // 舍弃首位(符号位)
    // 去除首字符，将0转为1，将1转为0   反码
    twoStr_unsign = twoStr_unsign.replace(/0/g, "z");
    twoStr_unsign = twoStr_unsign.replace(/1/g, "0");
    twoStr_unsign = twoStr_unsign.replace(/z/g, "1");
    twoStr = -parseInt(twoStr_unsign, 2);
    return twoStr;
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

// Encode downlink function.
//
// Input is an object with the following fields:
// - data = Object representing the payload that must be encoded.
// - variables = Object containing the configured device variables.
//
// Output must be an object with the following fields:
// - bytes = Byte array containing the downlink payload.
//   function encodeDownlink(input) {
//     var data = input.data;
//     var head = 0xED;
//     var flag = data.flag;
//     var cmd = data.cmd;
//     if (flag == 0) {ce
//         return {
//             bytes: [head, flag, cmd, 0]
//           };
//     }

//     return {
//       bytes: [225, 230, 255, 0]
//     };
//   }

// var datas = [17, 100, 145, 120, 51, 16, 9, 8, 1, 2, 1, 6, 5, 34, 0, 0, 0, 0];

// console.log(getData("5c000943240912278934443a9fcb0f"));
// var input = {};
// input.fPort = 8;
// input.bytes = getData("300000012015d9ed1cab8c5a5bd8f129904d3925d2cd47027d7f3c");
// console.log(decodeUplink(input));