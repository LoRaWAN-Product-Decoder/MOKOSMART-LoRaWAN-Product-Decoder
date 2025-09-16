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
    if (fPort == 199 || fPort == 10) {
        return {};
    }
    if (fPort == 11) {
        
        var header = bytes[0];
        if ((header & 0x80) == 0x80) {
            //Bit7=1鍒欒〃绀轰笉闇€瑕佽В鏋�
            return {}
        }
        var index = 2;

        var year = bytesToInt(bytes, index, 2);
        index += 2;

        var month = bytesToInt(bytes, index, 1);
        index += 1;

        var day = bytesToInt(bytes, index, 1);
        index += 1;

        var hour = bytesToInt(bytes, index, 1);
        index += 1;

        var minute = bytesToInt(bytes, index, 1);
        index += 1;

        var second = bytesToInt(bytes, index, 1);
        index += 1;

        var storage_timezone = signedHexToInt(bytesToHexString(bytes, index, 1)) / 2;

        index += 1;
        var port = bytesToInt(bytes, index, 1);
        index += 1;
        var tempDataInfo = {};
        tempDataInfo.bytes = bytes.slice(index);
        tempDataInfo.fPort = port;
        var tempDeviceInfo = decodeUplink(tempDataInfo).data;
        tempDeviceInfo.storage_time = year + '/' + month + '/' + day + ' ' + hour + ':' + minute + ':' + second;
        tempDeviceInfo.storage_timezone = storage_timezone;
        var deviceInfo = {};
        deviceInfo.data = tempDeviceInfo;

        return deviceInfo;
    }
    var deviceInfo = {};
    var data = {};
    data.port = fPort;

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

    var timestamp = new Date().getTime();
    timestamp = timestamp;
    data.timestamp = timestamp;

    var date = new Date();
    data.time = date.toJSON();

    if (fPort == 12 && bytes.length == 11) {
        parse_port12_data(data, bytes, fPort);
        // console.log(data);
        deviceInfo.data = data
        return deviceInfo;
    }

    var temperature = signedHexToInt(bytesToHexString(bytes, 1, 1)) + '掳C';
    data.temperature = temperature;

    data.ack = bytes[2] & 0x0f;

    if (fPort == 1 && bytes.length == 9) {
        parse_port1_data(data, bytes.slice(3), fPort);
    } else if (fPort == 2 && bytes.length >= 7) {
        parse_port2_data(data, bytes.slice(3), fPort);
    } else if (fPort == 4 && bytes.length >= 5) {
        parse_port4_data(data, bytes.slice(3), fPort);
    } else if (fPort == 5 && bytes.length == 4) {
        var obj = {};
        var shutdownTypeCode = bytesToInt(bytes, 3, 1);
        // obj.shutdown_type_code = shutdownTypeCode;
        obj.shutdown_type = shutdownTypeArray[shutdownTypeCode];
        data.obj = obj;
    } else if (fPort == 6 && bytes.length == 5) {
        var obj = {};
        obj.number_of_shocks = bytesToInt(bytes, 3, 2);
        data.obj = obj;
    } else if (fPort == 7 && bytes.length == 5) {
        var obj = {};
        obj.total_idle_time = bytesToInt(bytes, 3, 2);
        data.obj = obj;
    } else if (fPort == 8 && bytes.length == 4) {
        var obj = {};
        var eventTypeCode = bytesToInt(bytes, 3, 1);
        // obj.event_type_code = eventTypeCode;
        obj.event_type = eventTypeArray[eventTypeCode];
        data.obj = obj;
    } else if (fPort == 9 && bytes.length == 43) {
        parse_port9_data(data, bytes.slice(3), fPort);
    }
    // data.obj = data_dic;
    // console.log(data);
    deviceInfo.data = data;
    return deviceInfo;
}

/*********************Port Parse*************************/
function parse_port1_data(data, bytes, port) {
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

function parse_port2_data(data, bytes, port) {
    var obj = {};
    var age = bytesToInt(bytes, 0, 2);
    obj.age = age + "s";
    var positionTypeCode = bytesToInt(bytes, 2, 1);
    obj.position_type_code = positionTypeCode;
    obj.position_success_type = positionTypeArray[positionTypeCode];
    if (positionTypeCode < 5) {
        var positionData = parse_position_data(bytes.slice(4), positionTypeCode);
        obj.location_fixed_data_str = JSON.stringify(positionData);;
        obj.location_fixed_data = positionData;
    } else {
        obj.location_fixed_data = "Latitude and longitude data will return by the LoRa Cloud server";
    }
    data.obj = obj;
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
        + '掳';
    obj.longitude = Number(signedHexToInt(bytesToHexString(bytes, 6, 4)) * 0.0000001).toFixed(7)
        + '掳';
    obj.pdop = bytesToInt(bytes, 10, 1);
    data.obj = obj;
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
            var latitude = Number(signedHexToInt(bytesToHexString(sub_bytes, 0, 4)) * 0.0000001).toFixed(7);
            var longitude = Number(signedHexToInt(bytesToHexString(sub_bytes, 4, 4)) * 0.0000001).toFixed(7);
            var pdop = Number(bytesToInt(sub_bytes, 8, 1) * 0.1).toFixed(1);
            var data_dic = {
                'latitude': latitude,
                'longitude': longitude,
                'pdop': pdop
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
    var twoStr = parseInt(hexStr, 16).toString(2); // 灏嗗崄鍏浆鍗佽繘鍒讹紝鍐嶈浆2杩涘埗
    var bitNum = hexStr.length * 4; // 1涓瓧鑺� = 8bit 锛�0xff 涓€涓� "f"灏辨槸4浣�
    if (twoStr.length < bitNum) {
        while (twoStr.length < bitNum) {
            twoStr = "0" + twoStr;
        }
    }
    if (twoStr.substring(0, 1) == "0") {
        // 姝ｆ暟
        twoStr = parseInt(twoStr, 2); // 浜岃繘鍒惰浆鍗佽繘鍒�
        return twoStr;
    }
    // 璐熸暟
    var twoStr_unsign = "";
    twoStr = parseInt(twoStr, 2) - 1; // 琛ョ爜锛�(璐熸暟)鍙嶇爜+1锛岀鍙蜂綅涓嶅彉锛涚浉瀵瑰崄杩涘埗鏉ヨ涔熸槸 +1锛屼絾杩欓噷鏄礋鏁帮紝+1灏辨槸缁濆鍊兼暟鎹�-1
    twoStr = twoStr.toString(2);
    twoStr_unsign = twoStr.substring(1, bitNum); // 鑸嶅純棣栦綅(绗﹀彿浣�)
    // 鍘婚櫎棣栧瓧绗︼紝灏�0杞负1锛屽皢1杞负0   鍙嶇爜
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