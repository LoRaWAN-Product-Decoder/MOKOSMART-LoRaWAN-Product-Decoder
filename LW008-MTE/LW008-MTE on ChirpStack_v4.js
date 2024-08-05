var payloadTypeArray = [
    "Heartbeat"
    , "Location Fixed"
    , "Location Failure"
    , "Shutdown"
    , "Shock"
    , "Man Down detection"
    , "Event Message"
    , "Battery Consumption"
    , "GPS Limit"];
var operationModeArray = ["Standby mode", "Periodic mode", "Timing mode", "Motion mode"];
var rebootReasonArray = ["Restart after power failure", "Bluetooth command request", "LoRaWAN command request", "Power on after normal power off"];
var positionTypeArray = [
    "WIFI positioning success (Customized Format)"
    , "WIFI positioning success (LoRa Cloud DAS Format, the positioning date would be upload to LoRa Cloud on Port199)"
    , "Bluetooth positioning success"
    , "GPS positioning success (LW008-MTP)"
    , "GPS positioning success (LW008-MT Customized Format)"
    , "GPS positioning success (LW008-MT LoRa Cloud DAS Format, the positioning date would be upload to LoRa Cloud on Port199)"
];
var posFailedReasonArray = [
    "WIFI positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)"
    , "WIFI positioning strategies timeout (Please increase the WIFI positioning timeout via MKLoRa app)"
    , "WIFI module is not detected, the WIFI module itself works abnormally"
    , "Bluetooth positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)"
    , "Bluetooth positioning strategies timeout (Please increase the Bluetooth positioning timeout via MKLoRa app)"
    , "Bluetooth broadcasting in progress (Please reduce the Bluetooth broadcast timeout or avoid Bluetooth positioning when Bluetooth broadcasting in process via MKLoRa app)"
    , "GPS positioning timeout (Pls increase GPS positioning timeout via MKLoRa app)"
    , "GPS positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)"
    , "GPS aiding positioning timeout (Please adjust GPS autonomous latitude and autonomous longitude)"
    , "The ephemeris of GPS aiding positioning is too old, need to be updated."
    , "PDOP limit (Please increase the PDOP value via MKLoRa app)"
    , "Interrupted by Downlink for Position"
    , "Interrupted positioning at start of movement(the movement ends too quickly, resulting in not enough time to complete the positioning)"
    , "Interrupted positioning at end of movement(the movement restarted too quickly, resulting in not enough time to complete the positioning)"
];
var shutdownTypeArray = ["Bluetooth command to turn off the device", "LoRaWAN command to turn off the device", "Magnetic to turn off the device", "The battery run out"];
var eventTypeArray = [
    "Start of movement"
    , "In movement"
    , "End of movement"
    , "Uplink Payload triggered by downlink message"
    , "Notify of ephemeris update start"
    , "Notify of ephemeris update end"
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
    var deviceInfo = {};
    var data = {};
    if (fPort == 0 || fPort == 10 || fPort == 11) {
        deviceInfo.data = data;
        return deviceInfo;
    }

    data.port = fPort;
    data.hex_format_payload = bytesToHexString(bytes, 0, bytes.length);

    var operationModeCode = bytes[0] & 0x03;
    // data.operation_mode_code = operationModeCode;
    data.operation_mode = operationModeArray[operationModeCode];

    var batteryLevelCode = bytes[0] & 0x04;
    // data.battery_level_code = batteryLevelCode;
    data.battery_level = batteryLevelCode == 0 ? "Normal" : "Low battery";

    var manDownStatusCode = bytes[0] & 0x08;
    // data.mandown_status_code = manDownStatusCode;
    data.mandown_status = manDownStatusCode == 0 ? "Not in idle" : "In idle";

    var motionStateSinceLastPaylaodCode = bytes[0] & 0x10;
    // data.motion_state_since_last_paylaod_code = motionStateSinceLastPaylaodCode;
    data.motion_state_since_last_paylaod = motionStateSinceLastPaylaodCode == 0 ? "No" : "Yes";

    var positioningTypeCode = bytes[0] & 0x20;
    // data.positioning_type_code = positioningTypeCode;
    data.positioning_type = positioningTypeCode == 0 ? "Normal" : "Downlink for position";

    var date = new Date();
    var timestamp = Math.trunc(date.getTime() / 1000);
    var offsetHours = Math.abs(Math.floor(date.getTimezoneOffset() / 60));
    data.timestamp = timestamp;
    data.time = parse_time(timestamp, offsetHours);
    data.timezone = timezone_decode(offsetHours * 2);

    if (fPort == 12 && bytes.length == 11) {
        parse_port12_data(data, bytes, fPort);
        // console.log(data);
        deviceInfo.data = data
        return deviceInfo;
    }

    var temperature = signedHexToInt(bytesToHexString(bytes, 1, 1)) + '°C';
    data.temperature = temperature;

    data.ack = bytes[2] & 0x0f;

    if (fPort == 1 && bytes.length == 9) {
        data.payload_type = payloadTypeArray[0];
        parse_port1_data(data, bytes.slice(3));
    } else if (fPort == 2 && bytes.length >= 7) {
        data.payload_type = payloadTypeArray[1];
        parse_port2_data(data, bytes.slice(3));
    }else if (fPort == 3 && bytes.length == 8) {
        data.payload_type = payloadTypeArray[7];
        parse_port3_data(data, bytes.slice(3));
    } else if (fPort == 4 && bytes.length >= 5) {
        data.payload_type = payloadTypeArray[2];
        parse_port4_data(data, bytes.slice(3), fPort);
    } else if (fPort == 5 && bytes.length == 4) {
        data.payload_type = payloadTypeArray[3];
        var obj = {};
        var shutdownTypeCode = bytesToInt(bytes, 3, 1);
        // obj.shutdown_type_code = shutdownTypeCode;
        obj.shutdown_type = shutdownTypeArray[shutdownTypeCode];
        data.obj = obj;
    } else if (fPort == 6 && bytes.length == 5) {
        data.payload_type = payloadTypeArray[4];
        var obj = {};
        obj.number_of_shocks = bytesToInt(bytes, 3, 2);
        data.obj = obj;
    } else if (fPort == 7 && bytes.length == 5) {
        data.payload_type = payloadTypeArray[5];
        var obj = {};
        obj.total_idle_time = bytesToInt(bytes, 3, 2);
        data.obj = obj;
    } else if (fPort == 8 && bytes.length == 4) {
        data.payload_type = payloadTypeArray[6];
        var eventTypeCode = bytesToInt(bytes, 3, 1);
        // obj.event_type_code = eventTypeCode;
        data.event_type = eventTypeArray[eventTypeCode];
    } else if (fPort == 9 && bytes.length == 43) {
        data.payload_type = payloadTypeArray[7];
        parse_port9_data(data, bytes.slice(3), fPort);
    }
    // data.obj = data_dic;
    // console.log(data);
    deviceInfo.data = data;
    return deviceInfo;
}

/*********************Port Parse*************************/
function parse_port1_data(data, bytes) {
    var obj = {};
    var rebootReasonCode = bytesToInt(bytes, 0, 1);
    // data.obj.reboot_reason_code = rebootReasonCode;
    obj.reboot_reason = rebootReasonArray[rebootReasonCode];
    var majorVersion = (bytes[1] >> 6) & 0x03;
    var minorVersion = (bytes[1] >> 4) & 0x03;
    var patchVersion = bytes[1] & 0x0f;
    var firmwareVersion = 'V' + majorVersion + '.' + minorVersion + '.' + patchVersion;
    obj.firmware_version = firmwareVersion;
    var activityCount = bytesToInt(bytes, 2, 4);
    obj.activity_count = activityCount;
    data.obj = obj;
}

function parse_port2_data(data, bytes) {
    var age = bytesToInt(bytes, 0, 2);
    data.age = age + "s";
    var positionTypeCode = bytesToInt(bytes, 2, 1);
    data.position_type_code = positionTypeCode;
    data.position_success_type = positionTypeArray[positionTypeCode];
    var sub_bytes = bytes.slice(4,4 + bytes[3]);
    if (positionTypeCode == 2) {
        var positionData = parse_position_data(sub_bytes, positionTypeCode);
        data.mac_data = positionData;
    } else if (positionTypeCode == 3) {
        var latitude = Number(signedHexToInt(bytesToHexString(sub_bytes, 0, 4)) * 0.0000001).toFixed(7);
        var longitude = Number(signedHexToInt(bytesToHexString(sub_bytes, 4, 4)) * 0.0000001).toFixed(7);
        var pdop = Number(bytesToInt(sub_bytes, 8, 1) * 0.1).toFixed(1);
        data.latitude = latitude;
        data.longitude = longitude;
        data.pdop = pdop;
    }
    const date = new Date(bytesToInt(bytes, 4 + bytes[3], 4));
    data.time = date.toLocaleString();
}

function parse_port3_data(data, bytes) {
    data.low_power_percent = bytesToInt(bytes, 0, 1);
    data.current_cicle_battery_total_consumer = bytesToInt(bytes, 1, 4);
}

function parse_port4_data(data, bytes, port) {
    var obj = {};
    var failedTypeCode = bytesToInt(bytes, 0, 1);
    var dataLen = bytesToInt(bytes, 1, 1);
    var dataBytes = bytes.slice(2);
    if (failedTypeCode == 0 || failedTypeCode == 1 || failedTypeCode == 2
        || failedTypeCode == 3 || failedTypeCode == 4 || failedTypeCode == 5) {
        var number = (dataLen / 7);
        var data_list = [];
        for (var i = 0; i < number; i++) {
            var item = {};
            var sub_bytes = dataBytes.slice((i * 7), (i * 7 + 8));
            var mac_address = bytesToHexString(sub_bytes, 0, 6);
            var rssi = bytesToInt(sub_bytes, 6, 1) - 256 + 'dBm';
            item.mac_address = mac_address;
            item.rssi = rssi;
            data_list.push(item);
        }
        obj.reasons_for_positioning_failure_code = failedTypeCode;
        obj.reasons_for_positioning_failure = posFailedReasonArray[failedTypeCode];
        obj.location_failure_data = data_list;
        data.obj = obj;
        return;
    } else {
        var data_list = [];
        for (var i = 0; i < dataLen; i++) {
            var stringValue = bytesToHexString(dataBytes, (i * 1), 1);
            data_list.push(stringValue);
        }
        obj.reasons_for_positioning_failure_code = failedTypeCode;
        obj.reasons_for_positioning_failure = posFailedReasonArray[failedTypeCode];
        obj.location_failure_data = data_list;
        data.obj = obj;
    }
}

function parse_port9_data(data, bytes, port) {
    var obj = {};
    obj.work_times = bytesToInt(bytes, 0, 4);
    obj.adv_times = bytesToInt(bytes, 4, 4);
    obj.flash_write_times = bytesToInt(bytes, 8, 4);
    obj.axis_wakeup_times = bytesToInt(bytes, 12, 4);
    obj.ble_position_times = bytesToInt(bytes, 16, 4);
    obj.wifi_position_times = bytesToInt(bytes, 20, 4);
    obj.gps_position_times = bytesToInt(bytes, 24, 4);
    obj.lora_send_times = bytesToInt(bytes, 28, 4);
    obj.lora_power = bytesToInt(bytes, 32, 4);
    obj.battery_value = bytesToInt(bytes, 36, 4);
    data.obj = obj;
}

function parse_port12_data(data, bytes, port) {
    var obj = {};
    obj.ack = bytes[1] & 0x0f;
    obj.battery_value = ((bytes[1] & 0xf0) * 0.1) + "V";
    obj.latitude = Number(signedHexToInt(bytesToHexString(bytes, 2, 4)) * 0.0000001).toFixed(7)
        + '°';
    obj.longitude = Number(signedHexToInt(bytesToHexString(bytes, 6, 4)) * 0.0000001).toFixed(7)
        + '°';
    obj.pdop = bytesToInt(bytes, 10, 1);
    data.obj = obj;
}

function parse_position_data(bytes, type) {
    // if ((type == 0) || (type == 2)) {
    var number = (bytes.length / 7);
    var mac_data = [];
    for (var i = 0; i < number; i++) {
        var sub_bytes = bytes.slice((i * 7), (i * 7 + 8));
        var mac_address = bytesToHexString(sub_bytes, 0, 6);
        var rssi = bytesToInt(sub_bytes, 6, 1) - 256 + 'dBm';
        var data_dic = {
            'mac': mac_address,
            'rssi': rssi
        };
        mac_data.push(data_dic);
    }
    return mac_data;
    // }
    // if (type == 3) {
    // var number = (bytes.length / 9);
    // var data_list = [];
    // for (var i = 0; i < number; i++) {
    // var sub_bytes = bytes.slice(0, 10);
    // var latitude = Number(signedHexToInt(bytesToHexString(sub_bytes, 0, 4)) * 0.0000001).toFixed(7);
    // var longitude = Number(signedHexToInt(bytesToHexString(sub_bytes, 4, 4)) * 0.0000001).toFixed(7);
    // var pdop = Number(bytesToInt(sub_bytes, 8, 1) * 0.1).toFixed(1);
    // var data_dic = {
    //     'latitude': latitude,
    //     'longitude': longitude,
    //     'pdop': pdop
    // };
    // data_list.push(data_dic);
    // }
    // return data_list;
    // }
    // if (type == 4) {
    //     return bytes;
    // }
    // return [];
}
/*********************Port Parse*************************/

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

String.prototype.format = function () {
    if (arguments.length == 0)
        return this;
    for (var s = this, i = 0; i < arguments.length; i++)
        s = s.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i]);
    return s;
};

// convert a byte value to signed int8
function int8(byte) {
    var sign = byte & (1 << 7);
    if (sign) {
        return 0xFFFFFF00 | byte;
    }
    return byte;
}