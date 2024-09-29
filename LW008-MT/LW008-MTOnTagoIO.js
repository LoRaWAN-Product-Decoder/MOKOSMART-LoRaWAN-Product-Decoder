var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var payloadTypeArray = [
    "Heartbeat",
    "Location Fixed",
    "Location Failure",
    "Shutdown",
    "Shock",
    "Man Down detection",
    "Event Message",
    "Battery Consumption",
    "GPS Limit"
];
var operationModeArray = ["Standby mode", "Periodic mode", "Timing mode", "Motion mode"];
var rebootReasonArray = ["Restart after power failure", "Bluetooth command request", "LoRaWAN command request", "Power on after normal power off"];
var positionTypeArray = [
    "WIFI positioning success (Customized Format)",
    "WIFI positioning success (LoRa Cloud DAS Format, the positioning date would be upload to LoRa Cloud on Port199)",
    "Bluetooth positioning success",
    "GPS positioning success (LW008-MTP)",
    "GPS positioning success (LW008-MT Customized Format)",
    "GPS positioning success (LW008-MT LoRa Cloud DAS Format, the positioning date would be upload to LoRa Cloud on Port199)"
];
var posFailedReasonArray = [
    "WIFI positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)",
    "WIFI positioning strategies timeout (Please increase the WIFI positioning timeout via MKLoRa app)",
    "WIFI module is not detected, the WIFI module itself works abnormally",
    "Bluetooth positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)",
    "Bluetooth positioning strategies timeout (Please increase the Bluetooth positioning timeout via MKLoRa app)",
    "Bluetooth broadcasting in progress (Please reduce the Bluetooth broadcast timeout or avoid Bluetooth positioning when Bluetooth broadcasting in process via MKLoRa app)",
    "GPS positioning timeout (Pls increase GPS positioning timeout via MKLoRa app)",
    "GPS positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)",
    "GPS aiding positioning timeout (Please adjust GPS autonomous latitude and autonomous longitude)",
    "The ephemeris of GPS aiding positioning is too old, need to be updated.",
    "PDOP limit (Please increase the PDOP value via MKLoRa app)",
    "Interrupted by Downlink for Position",
    "Interrupted positioning at start of movement(the movement ends too quickly, resulting in not enough time to complete the positioning)",
    "Interrupted positioning at end of movement(the movement restarted too quickly, resulting in not enough time to complete the positioning)"
];
var shutdownTypeArray = ["Bluetooth command to turn off the device", "LoRaWAN command to turn off the device", "Magnetic to turn off the device", "The battery run out"];
var eventTypeArray = [
    "Start of movement",
    "In movement",
    "End of movement",
    "Uplink Payload triggered by downlink message",
    "Notify of ephemeris update start",
    "Notify of ephemeris update end"
];
function Decoder(bytes, fPort, groupID) {
    if (fPort == 0 || fPort == 10 || fPort == 11) {
        return [];
    }
    var payloadList = [];
    var operationModeCode = bytes[0] & 0x03;
    // const operation_mode_code = operationModeCode;
    var operation_mode = operationModeArray[operationModeCode];
    payloadList.push(getPayloadData("operation_mode", operation_mode, groupID));
    var batteryLevelCode = bytes[0] & 0x04;
    // const battery_level_code = batteryLevelCode;
    var battery_level = batteryLevelCode == 0 ? "Normal" : "Low battery";
    payloadList.push(getPayloadData("battery_level", battery_level, groupID));
    var manDownStatusCode = bytes[0] & 0x08;
    // const mandown_status_code = manDownStatusCode;
    var mandown_status = manDownStatusCode == 0 ? "Not in idle" : "In idle";
    payloadList.push(getPayloadData("mandown_status", mandown_status, groupID));
    var motionStateSinceLastPaylaodCode = bytes[0] & 0x10;
    // const motion_state_since_last_paylaod_code = motionStateSinceLastPaylaodCode;
    var motion_state_since_last_paylaod = motionStateSinceLastPaylaodCode == 0 ? "No" : "Yes";
    payloadList.push(getPayloadData("motion_state_since_last_paylaod", motion_state_since_last_paylaod, groupID));
    var positioningTypeCode = bytes[0] & 0x20;
    // const positioning_type_code = positioningTypeCode;
    var positioning_type = positioningTypeCode == 0 ? "Normal" : "Downlink for position";
    payloadList.push(getPayloadData("positioning_type", positioning_type, groupID));
    var date = new Date();
    var timestamp = Math.trunc(date.getTime() / 1000);
    payloadList.push(getPayloadData("timestamp", timestamp, groupID));
    var offsetHours = Math.abs(Math.floor(date.getTimezoneOffset() / 60));
    payloadList.push(getPayloadData("time", parse_time(timestamp, offsetHours), groupID));
    payloadList.push(getPayloadData("timezone", timezone_decode(offsetHours * 2), groupID));
    if (fPort == 12 && bytes.length == 11) {
        payloadList.push(getPayloadData("ack", bytes[1] & 0x0f, groupID));
        payloadList.push(getPayloadData("battery_value", ((bytes[1] & 0xf0) * 0.1).toString() + "V", groupID));
        var lat = bytesToInt(bytes, 2, 4);
        var lon = bytesToInt(bytes, 6, 4);
        if (lat > 0x80000000)
            lat = lat - 0x100000000;
        if (lon > 0x80000000)
            lon = lon - 0x100000000;
        var latitude = (lat / 10000000);
        var longitude = (lon / 10000000);
        var location_1 = {
            'variable': 'location',
            'value': 'My Address',
            'location': {
                'lat': latitude,
                'lng': longitude,
            },
            'group': groupID,
            'metadata': {
                'color': '#add8e6'
            },
        };
        payloadList.push(location_1);
        payloadList.push(getPayloadData("pdop", bytesToInt(bytes, 10, 1), groupID));
        return payloadList;
    }
    var temperature = signedHexToInt(bytesToHexString(bytes, 1, 1)).toString() + '°C';
    payloadList.push(getPayloadData("temperature", temperature, groupID));
    payloadList.push(getPayloadData("ack", bytes[2] & 0x0f, groupID));
    if (fPort == 1 && bytes.length == 9) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[0], groupID));
        return __spreadArray(__spreadArray([], payloadList, true), parse_port1_data(bytes.slice(3), groupID), true);
    }
    if (fPort == 2 && bytes.length >= 7) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[1], groupID));
        return __spreadArray(__spreadArray([], payloadList, true), parse_port2_data(bytes.slice(3), groupID), true);
    }
    if (fPort == 4 && bytes.length >= 5) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[2], groupID));
        return __spreadArray(__spreadArray([], payloadList, true), parse_port4_data(bytes.slice(3), groupID), true);
    }
    if (fPort == 5 && bytes.length == 4) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[3], groupID));
        var shutdownTypeCode = bytesToInt(bytes, 3, 1);
        //addPayloadArray("shutdown_type_code",shutdownTypeCode);
        payloadList.push(getPayloadData("shutdown_type", shutdownTypeArray[shutdownTypeCode], groupID));
        return payloadList;
    }
    if (fPort == 6 && bytes.length == 5) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[4], groupID));
        payloadList.push(getPayloadData("number_of_shocks", bytesToInt(bytes, 3, 2), groupID));
        return payloadList;
    }
    if (fPort == 7 && bytes.length == 5) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[5], groupID));
        payloadList.push(getPayloadData("total_idle_time", bytesToInt(bytes, 3, 2), groupID));
        return payloadList;
    }
    if (fPort == 8 && bytes.length == 4) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[6], groupID));
        var eventTypeCode = bytesToInt(bytes, 3, 1);
        //addPayloadArray("event_type_code = eventTypeCode;
        payloadList.push(getPayloadData("event_type", eventTypeArray[eventTypeCode], groupID));
        return payloadList;
    }
    if (fPort == 9 && bytes.length == 43) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[7], groupID));
        return __spreadArray(__spreadArray([], payloadList, true), parse_port9_data(bytes.slice(3), groupID), true);
    }
    return payloadList;
}
/*********************Port Parse*************************/
function parse_port1_data(bytes, groupID) {
    var tempList = [];
    var rebootReasonCode = bytesToInt(bytes, 0, 1);
    // data.obj.reboot_reason_code = rebootReasonCode;
    tempList.push(getPayloadData("reboot_reason", rebootReasonArray[rebootReasonCode], groupID));
    var majorVersion = (bytes[1] >> 6) & 0x03;
    var minorVersion = (bytes[1] >> 4) & 0x03;
    var patchVersion = bytes[1] & 0x0f;
    var firmwareVersion = 'V' + majorVersion.toString() + '.' + minorVersion.toString() + '.' + patchVersion.toString();
    tempList.push(getPayloadData("firmware_version", firmwareVersion, groupID));
    var activityCount = bytesToInt(bytes, 2, 4);
    tempList.push(getPayloadData("activity_count", activityCount, groupID));
    return tempList;
}
function parse_port2_data(bytes, groupID) {
    var tempList = [];
    var age = bytesToInt(bytes, 0, 2);
    tempList.push(getPayloadData("age", age.toString() + 's', groupID));
    var positionTypeCode = bytesToInt(bytes, 2, 1);
    tempList.push(getPayloadData("position_type_code", positionTypeCode, groupID));
    tempList.push(getPayloadData("position_success_type", positionTypeArray[positionTypeCode], groupID));
    if (positionTypeCode < 5) {
        var sub_bytes = bytes.slice(4);
        if (positionTypeCode == 0 || positionTypeCode == 2) {
            var positionData = parse_position_data(sub_bytes, positionTypeCode);
            // obj.location_fixed_data_str = JSON.stringify(positionData);
            tempList.push(getPayloadData("mac_data", positionData, groupID));
        }
        else if (positionTypeCode == 3) {
            var latitude = Number(signedHexToInt(bytesToHexString(sub_bytes, 0, 4)) * 0.0000001).toFixed(7);
            var longitude = Number(signedHexToInt(bytesToHexString(sub_bytes, 4, 4)) * 0.0000001).toFixed(7);
            var pdop = Number(bytesToInt(sub_bytes, 8, 1) * 0.1).toFixed(1);
            tempList.push(getPayloadData("latitude", latitude, groupID));
            tempList.push(getPayloadData("longitude", longitude, groupID));
            tempList.push(getPayloadData("pdop", pdop, groupID));
        }
        else if (positionTypeCode == 4) {
            tempList.push(getPayloadData("bytes", sub_bytes, groupID));
        }
    }
    else {
        tempList.push(getPayloadData("location_fixed_data", "Latitude and longitude data will return by the LoRa Cloud server", groupID));
    }
    return tempList;
}
function parse_port4_data(bytes, groupID) {
    var tempList = [];
    var failedTypeCode = bytesToInt(bytes, 0, 1);
    var dataLen = bytesToInt(bytes, 1, 1);
    var dataBytes = bytes.slice(2);
    if (failedTypeCode == 0 || failedTypeCode == 1 || failedTypeCode == 2
        || failedTypeCode == 3 || failedTypeCode == 4 || failedTypeCode == 5) {
        var number = (dataLen / 7);
        for (var i = 0; i < number; i++) {
            var item = {};
            var sub_bytes = dataBytes.slice((i * 7), (i * 7 + 8));
            var mac_address = bytesToHexString(sub_bytes, 0, 6);
            var rssi = (bytesToInt(sub_bytes, 6, 1) - 256).toString() + 'dBm';
            tempList.push(getPayloadData("mac_address" + i.toString(), mac_address, groupID));
            tempList.push(getPayloadData("rssi" + i.toString(), rssi, groupID));
        }
        tempList.push(getPayloadData("reasons_for_positioning_failure_code", failedTypeCode, groupID));
        tempList.push(getPayloadData("reasons_for_positioning_failure", posFailedReasonArray[failedTypeCode], groupID));
    }
    else {
        var data_list = [];
        for (var i = 0; i < dataLen; i++) {
            var stringValue = bytesToHexString(dataBytes, (i * 1), 1);
            // data_list.push(stringValue);
            tempList.push(getPayloadData("satellite" + i.toString(), stringValue, groupID));
        }
        tempList.push(getPayloadData("reasons_for_positioning_failure_code", failedTypeCode, groupID));
        tempList.push(getPayloadData("reasons_for_positioning_failure", posFailedReasonArray[failedTypeCode], groupID));
    }
    return tempList;
}
function parse_port9_data(bytes, groupID) {
    var tempList = [];
    tempList.push(getPayloadData("work_times", bytesToInt(bytes, 0, 4), groupID));
    tempList.push(getPayloadData("adv_times", bytesToInt(bytes, 4, 4), groupID));
    tempList.push(getPayloadData("flash_write_times", bytesToInt(bytes, 8, 4), groupID));
    tempList.push(getPayloadData("axis_wakeup_times", bytesToInt(bytes, 12, 4), groupID));
    tempList.push(getPayloadData("ble_position_times", bytesToInt(bytes, 16, 4), groupID));
    tempList.push(getPayloadData("wifi_position_times", bytesToInt(bytes, 20, 4), groupID));
    tempList.push(getPayloadData("gps_position_times", bytesToInt(bytes, 24, 4), groupID));
    tempList.push(getPayloadData("lora_send_times", bytesToInt(bytes, 28, 4), groupID));
    tempList.push(getPayloadData("lora_power", bytesToInt(bytes, 32, 4), groupID));
    tempList.push(getPayloadData("battery_value", bytesToInt(bytes, 36, 4), groupID));
    return tempList;
}
function parse_position_data(bytes, type) {
    // if ((type == 0) || (type == 2)) {
    var number = (bytes.length / 7);
    var mac_data = [];
    for (var i = 0; i < number; i++) {
        var sub_bytes = bytes.slice((i * 7), (i * 7 + 8));
        var mac_address = bytesToHexString(sub_bytes, 0, 6);
        var rssi = (bytesToInt(sub_bytes, 6, 1) - 256).toString + 'dBm';
        var data_dic = {
            'mac': mac_address,
            'rssi': rssi
        };
        mac_data.push(data_dic);
    }
    return mac_data;
}
/*
    整型数组指定部分转换成对应的Hex字符串
    bytes:里面全部为整数,
    start:开始转换的位置
    len:需要转换的长度
*/
function bytesToHexString(bytes, start, len) {
    if (bytes.length == 0 || start >= bytes.length || (start + len) > bytes.length)
        return '';
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
function bytesToInt(bytes, start, len) {
    if (bytes.length == 0 || start >= bytes.length || (start + len) > bytes.length)
        return 0;
    var value = 0;
    for (var i = 0; i < len; i++) {
        var m = ((len - 1) - i) * 8;
        value = value | bytes[start + i] << m;
    }
    return value;
}
function timezone_decode(tz) {
    var tz_str = "UTC";
    tz = tz > 128 ? tz - 256 : tz;
    if (tz < 0) {
        tz_str += "-";
        tz = -tz;
    }
    else {
        tz_str += "+";
    }
    if (tz < 20) {
        tz_str += "0";
    }
    tz_str += String(tz / 2);
    tz_str += ":";
    if (tz % 2) {
        tz_str += "30";
    }
    else {
        tz_str += "00";
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
    return number < 10 ? "0" + number.toString() : number.toString();
}
/*
    有符号十六进制字符串转十进制
*/
function signedHexToInt(hexStr) {
    var twoStr = parseInt(hexStr, 16).toString(2); // 将十六转十进制，再转2进制
    // console.log(twoStr);
    var bitNum = hexStr.length * 4; // 1个字节 = 8bit ，0xff 一个 "f"就是4位
    if (twoStr.length < bitNum) {
        while (twoStr.length < bitNum) {
            twoStr = "0" + twoStr;
        }
    }
    if (twoStr.substring(0, 1) == "0") {
        // 正数
        return parseInt(twoStr, 2); // 二进制转十进制
    }
    // 负数
    var twoStr_unsign = "";
    var tempValue = parseInt(twoStr, 2) - 1; // 补码：(负数)反码+1，符号位不变；相对十进制来说也是 +1，但这里是负数，+1就是绝对值数据-1
    twoStr_unsign = tempValue.toString(2).substring(1, bitNum); // 舍弃首位(符号位)
    // 去除首字符，将0转为1，将1转为0   反码
    twoStr_unsign = twoStr_unsign.replace(/0/g, "z");
    twoStr_unsign = twoStr_unsign.replace(/1/g, "0");
    twoStr_unsign = twoStr_unsign.replace(/z/g, "1");
    return parseInt('-' + twoStr_unsign, 2);
}
function getPayloadData(type, value, groupID) {
    return {
        "variable": type,
        "value": value,
        "group": groupID,
    };
}
var payloadd = payload.find(function (x) { return ["payload_raw", "payload", "data"].includes(x.variable); });
var portt = payload.find(function (x) { return ["port", "fport", "f_port"].includes(x.variable); });
if (payloadd.value && portt.value) {
    try {
        // Convert the data from Hex to Javascript Buffer.
        var buffer = hexToNumberArray(payloadd.value);
        // payload.push(...Decoder(buffer, port.value, payload_raw.group));
        payload = payload.concat(Decoder(buffer, portt.value, payloadd.group));
    }
    catch (e) {
        // Print the error to the Live Inspector.
        console.error(e);
        // Return the variable parse_error for debugging.
        // payload = [{ variable: 'parse_error', value: e.message }];
    }
}
function hexToNumberArray(hexString) {
    var buffer = Buffer.from(hexString, "hex");
    return Array.from(buffer, function (byte) { return byte; });
}
