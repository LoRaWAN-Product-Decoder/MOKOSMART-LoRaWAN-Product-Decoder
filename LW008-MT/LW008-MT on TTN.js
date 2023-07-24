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

function Decoder(bytes, port) {
    if (bytes.length < 4) {
        return {};
    }
    var deviceInfo = {};
    deviceInfo.port = port;

    var operationModeCode = bytes[0] & 0x03;
    // deviceInfo.operation_mode_code = operationModeCode;
    deviceInfo.operation_mode = operationModeArray[operationModeCode];

    var batteryLevelCode = bytes[0] & 0x04;
    // deviceInfo.battery_level_code = batteryLevelCode;
    deviceInfo.battery_level = batteryLevelCode == 0 ? "Normal" : "Low battery";

    var manDownStatusCode = bytes[0] & 0x08;
    // deviceInfo.mandown_status_code = manDownStatusCode;
    deviceInfo.mandown_status = manDownStatusCode == 0 ? "Not in idle" : "In idle";

    var motionStateSinceLastPaylaodCode = bytes[0] & 0x10;
    // deviceInfo.motion_state_since_last_paylaod_code = motionStateSinceLastPaylaodCode;
    deviceInfo.motion_state_since_last_paylaod = motionStateSinceLastPaylaodCode == 0 ? "No" : "Yes";

    var positioningTypeCode = bytes[0] & 0x20;
    // deviceInfo.positioning_type_code = positioningTypeCode;
    deviceInfo.positioning_type = positioningTypeCode == 0 ? "Normal" : "Downlink for position";

    if (port == 12 && bytes.length == 11) {
        parse_port12_data(deviceInfo, bytes, port);
        // console.log(deviceInfo);
        return deviceInfo;
    }

    var temperature = signedHexToInt(bytesToHexString(bytes, 1, 1)) + '°C';
    deviceInfo.temperature = temperature;

    deviceInfo.ack = bytes[2] & 0x0f;

    if (port == 1 && bytes.length == 9) {
        parse_port1_data(deviceInfo, bytes.slice(3), port);
    } else if (port == 2 && bytes.length >= 7) {
        parse_port2_data(deviceInfo, bytes.slice(3), port);
    } else if (port == 4 && bytes.length >= 5) {
        parse_port4_data(deviceInfo, bytes.slice(3), port);
    } else if (port == 5 && bytes.length == 4) {
        var data = {};
        var shutdownTypeCode = bytesToInt(bytes, 3, 1);
        // data.shutdown_type_code = shutdownTypeCode;
        data.shutdown_type = shutdownTypeArray[shutdownTypeCode];
        deviceInfo.data = data;
    } else if (port == 6 && bytes.length == 5) {
        var data = {};
        data.number_of_shocks = bytesToInt(bytes, 3, 2);
        deviceInfo.data = data;
    } else if (port == 7 && bytes.length == 5) {
        var data = {};
        data.total_idle_time = bytesToInt(bytes, 3, 2);
        deviceInfo.data = data;
    } else if (port == 8 && bytes.length == 4) {
        var data = {};
        var eventTypeCode = bytesToInt(bytes, 3, 1);
        // data.event_type_code = eventTypeCode;
        data.event_type = eventTypeArray[eventTypeCode];
        deviceInfo.data = data;
    } else if (port == 9 && bytes.length == 43) {
        parse_port9_data(deviceInfo, bytes.slice(3), port);
    }
    // deviceInfo.data = data_dic;
    // console.log(deviceInfo);
    return deviceInfo;
}

/*********************Port Parse*************************/
function parse_port1_data(deviceInfo, bytes, port) {
    var data = {};
    var rebootReasonCode = bytesToInt(bytes, 0, 1);
    // deviceInfo.data.reboot_reason_code = rebootReasonCode;
    data.reboot_reason = rebootReasonArray[rebootReasonCode];
    var majorVersion = (bytes[1] >> 6) & 0x03;
    var minorVersion = (bytes[1] >> 4) & 0x03;
    var patchVersion = bytes[1] & 0x0f;
    var firmwareVersion = 'V' + majorVersion + '.' + minorVersion + '.' + patchVersion;
    data.firmware_version = firmwareVersion;
    var activityCount = bytesToInt(bytes, 2, 4);
    data.activity_count = activityCount;
    deviceInfo.data = data;
}

function parse_port2_data(deviceInfo, bytes, port) {
    var data = {};
    var age = bytesToInt(bytes, 0, 2);
    data.age = age + "s";
    var positionTypeCode = bytesToInt(bytes, 2, 1);
    // data.position_type_code = positionTypeCode;
    data.position_success_type = positionTypeArray[positionTypeCode];
    if (positionTypeCode < 5) {
        var positionData = parse_position_data(bytes.slice(4), positionTypeCode);
        // data.location_fixed_data = JSON.stringify(positionData);;
        data.location_fixed_data = positionData;
    } else {
        data.location_fixed_data = "Latitude and longitude data will return by the LoRa Cloud server";
    }
    deviceInfo.data = data;
}

function parse_port4_data(deviceInfo, bytes, port) {
    var data = {};
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
        // data.reasons_for_positioning_failure_code = failedTypeCode;
        data.reasons_for_positioning_failure = posFailedReasonArray[failedTypeCode];
        data.location_failure_data = data_list;
        deviceInfo.data = data;
        return;
    } else {
        var data_list = [];
        for (var i = 0; i < dataLen; i++) {
            var stringValue = bytesToHexString(dataBytes, (i * 1), 1);
            data_list.push(stringValue);
        }
        // data.reasons_for_positioning_failure_code = failedTypeCode;
        data.reasons_for_positioning_failure = posFailedReasonArray[failedTypeCode];
        data.location_failure_data = data_list;
        deviceInfo.data = data;
    }
}

function parse_port9_data(deviceInfo, bytes, port) {
    var data = {};
    data.work_times = bytesToInt(bytes, 0, 4);
    data.adv_times = bytesToInt(bytes, 4, 4);
    data.flash_write_times = bytesToInt(bytes, 8, 4);
    data.axis_wakeup_times = bytesToInt(bytes, 12, 4);
    data.ble_postion_times = bytesToInt(bytes, 16, 4);
    data.wifi_postion_times = bytesToInt(bytes, 20, 4);
    data.gps_postion_times = bytesToInt(bytes, 24, 4);
    data.lora_send_times = bytesToInt(bytes, 28, 4);
    data.lora_power = bytesToInt(bytes, 32, 4);
    data.battery_value = bytesToInt(bytes, 36, 4);
    deviceInfo.data = data;
}

function parse_port12_data(deviceInfo, bytes, port) {
    var data = {};
    data.ack = bytes[1] & 0x0f;

    data.latitude = Number(signedHexToInt(bytesToHexString(bytes, 2, 4)) * 0.0000001).toFixed(7)
        + '°';
    data.longitude = Number(signedHexToInt(bytesToHexString(bytes, 6, 4)) * 0.0000001).toFixed(7)
        + '°';
    data.podp = bytesToInt(bytes, 10, 1);
    deviceInfo.data = data;
}

function parse_position_data(bytes, type) {
    if ((type == 0) || (type == 2)) {
        var number = (bytes.length / 7);
        var data_list = [];
        for (var i = 0; i < number; i++) {
            var sub_bytes = bytes.slice((i * 7), (i * 7 + 8));
            var mac_address = bytesToHexString(sub_bytes, 0, 6);
            var rssi = bytesToInt(sub_bytes, 6, 1) - 256 + 'dBm';
            var data_dic = {
                'mac_address': mac_address,
                'rssi': rssi
            };
            data_list.push(data_dic);
        }
        return data_list;
    }
    if (type == 3) {
        var number = (bytes.length / 9);
        var data_list = [];
        for (var i = 0; i < number; i++) {
            var sub_bytes = bytes.slice((i * 9), (i * 9 + 10));
            var latitude = Number(signedHexToInt(bytesToHexString(sub_bytes, 0, 4)) * 0.0000001).toFixed(7)
                + '°';
            var longitude = Number(signedHexToInt(bytesToHexString(sub_bytes, 4, 4)) * 0.0000001).toFixed(7) + '°';
            var podp = bytesToInt(sub_bytes, 8, 1) * 0.1;
            var data_dic = {
                'latitude': latitude,
                'longitude': longitude,
                'podp': podp
            };
            data_list.push(data_dic);
        }
        return data_list;
    }
    if (type == 4) {
        return bytes;
    }
    return [];
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
    time_str += "/";
    time_str += formatNumber(d.getUTCMonth() + 1);
    time_str += "/";
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
    twoStr = parseInt(-twoStr_unsign, 2);
    return twoStr;
}

String.prototype.format = function () {
    if (arguments.length == 0)
        return this;
    for (var s = this, i = 0; i < arguments.length; i++)
        s = s.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i]);
    return s;
};


// var port_data1 = [0xf5,0xe4,0xa0,0x03,0x43,0x00,0x00,0xff,0xff];
// Decoder(port_data1,1);

// var port_data2 = [0xf5,0xe5,0xa0,0x00,0x64,0x00,0x0e,0xaa,0xbb,0xaa,0xbb,0xaa,0xbb,0xe4,0xaa,0xbb,0xaa,0xbb,0xaa,0xbb,0xe5];
// var port_data22 = [0xf5, 0xe5, 0xa0, 0x00, 0x64, 0x01, 0x00];
// var port_data222 = [0xf5,0xe5,0xa0,0x00,0x64,0x03,0x12,0xff,0xff,0xff,0x00,0xaa,0xbb,0x00,0x00,0x0f,0xf0,0xff,0xff,0x00,0xa0,0xbb,0x00,0x00,0x0d];
// Decoder(port_data2,2);
// console.log(Decoder(port_data22, 2));
// Decoder(port_data222,2);

// var port_data4 = [0xf5,0xe5,0xa0,0x00,0x0e,0xaa,0xbb,0xaa,0xbb,0xaa,0xbb,0xe4,0xaa,0xbb,0xaa,0xbb,0xaa,0xbb,0xe5];
// var port_data44 = [0xf5,0xe5,0xa0,0x06,0x0e,0xaa,0xbb,0xaa,0xbb,0xaa,0xbb,0xe4,0xaa,0xbb,0xaa,0xbb,0xaa,0xbb,0xe5];
// Decoder(port_data4,4);
// Decoder(port_data44,4);

// var port_data5 = [0xf5,0xe5,0xa0,0x01];
// var port_data55 = [0xf5,0xe5,0xa0,0x03];
// Decoder(port_data5,5);
// Decoder(port_data55,5);

// var port_data6 = [0xf5,0xe5,0xa0,0x01,0x01];
// Decoder(port_data6,6);

// var port_data7 = [0xf5,0xe5,0xa0,0x00,0x64];
// Decoder(port_data7,7);

// var port_data8 = [0xf5,0xe5,0xa0,0x01];
// Decoder(port_data8,8);

// var port_data9 = [0xf5,0xe5,0xa0,0x00,0x00,0x00,0x64,0x00,0x00,0x00,0x65,0x00,0x00,0x00,0x66,0x00,0x00,0x00,0x67,0x00,0x00,0x00,0x68,0x00,0x00,0x00,0x69,0x00,0x00,0x00,0x6a,0x00,0x00,0x00,0x6b,0x00,0x00,0x00,0x6c,0x00,0x00,0x00,0x6d];
// Decoder(port_data9,9);

// var port_data12 = [0xf4, 0xa3, 0xff, 0xff, 0xff, 0x00, 0x0f, 0xff, 0xff, 0x00, 0x0a];
// Decoder(port_data12, 12);

// function getData(hex) {
//     var length = hex.length;
//     var datas = [];
//     for (var i = 0; i < length; i += 3) {
//         var start = i;
//         var end = i + 2;
//         var data = parseInt("0x" + hex.substring(start, end));
//         datas.push(data);
//     }
//     return datas;
// }
// console.log(Decoder(getData("01 1C 00 00 08 05 02 00 01"), 2));