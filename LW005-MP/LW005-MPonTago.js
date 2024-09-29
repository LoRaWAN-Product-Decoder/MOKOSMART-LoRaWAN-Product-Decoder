var payloadTypeArray = [
    "Switch",
    "Electrical",
    "Electrical",
    "Energy",
    "Over-voltage",
    "Sag-voltage",
    "Over-current",
    "Over-load",
    "Load state",
    "Countdown"
];
function Decoder(bytes, fPort, groupID) {
    var payloadList = [];
    payloadList.push(getPayloadData('port', fPort, groupID));
    var payload_type = payloadTypeArray[fPort - 5];
    payloadList.push(getPayloadData('payload_type', payload_type, groupID));
    if (command_format_check(bytes.length, fPort) == false) {
        payloadList.push(getPayloadData('result', 'Format wrong', groupID));
        return payloadList;
    }
    var timestamp = bytesToInt(bytes, 0, 4);
    payloadList.push(getPayloadData('timestamp', timestamp, groupID));
    var time = parse_time(timestamp, bytes[4] * 0.5);
    payloadList.push(getPayloadData('time', time, groupID));
    var timezone = timezone_decode(bytes[4]);
    payloadList.push(getPayloadData('timezone', timezone, groupID));
    if (fPort == 5) {
        var ac_output_state = bytes[5] == 1 ? "ON" : "OFF";
        payloadList.push(getPayloadData('ac_output_state', ac_output_state, groupID));
        var plug_load_status = bytes[6] == 1 ? "There is a load on the plug" : "No load on the plug";
        payloadList.push(getPayloadData('plug_load_status', plug_load_status, groupID));
    }
    else if (fPort == 6) {
        var instantaneous_voltage = (bytesToInt(bytes, 5, 2) / 10).toFixed(1).toString() + "V";
        payloadList.push(getPayloadData('instantaneous_voltage', instantaneous_voltage, groupID));
        var instantaneous_current = (bytesToInt(bytes, 7, 2) / 1000).toFixed(4).toString() + "A";
        payloadList.push(getPayloadData('instantaneous_current', instantaneous_current, groupID));
        var instantaneous_current_frequency = (bytesToInt(bytes, 9, 2) / 1000).toFixed(4).toString() + "HZ";
        payloadList.push(getPayloadData('instantaneous_current_frequency', instantaneous_current_frequency, groupID));
    }
    else if (fPort == 7) {
        var instantaneous_active_power = (bytesToInt(bytes, 5, 4) / 10).toFixed(1).toString() + "W";
        payloadList.push(getPayloadData('instantaneous_active_power', instantaneous_active_power, groupID));
        var instantaneous_power_factor = (bytes[9] & 0xFF).toString() + "%";
        payloadList.push(getPayloadData('instantaneous_power_factor', instantaneous_power_factor, groupID));
    }
    else if (fPort == 8) {
        var total_energy = (bytesToInt(bytes, 5, 4) / 3200).toFixed(4).toString() + "KWH";
        payloadList.push(getPayloadData('total_energy', total_energy, groupID));
        var energy_of_last_hour = (bytesToInt(bytes, 9, 2) / 3200).toFixed(4).toString() + "KWH";
        payloadList.push(getPayloadData('energy_of_last_hour', energy_of_last_hour, groupID));
    }
    else if (fPort == 9) {
        var over_voltage_state = bytes[5];
        payloadList.push(getPayloadData('over_voltage_state', over_voltage_state, groupID));
        var current_instantaneous_voltage = (bytesToInt(bytes, 6, 2) / 10).toFixed(1).toString() + "V";
        payloadList.push(getPayloadData('current_instantaneous_voltage', current_instantaneous_voltage, groupID));
        var over_voltage_threshold = (bytesToInt(bytes, 8, 2) / 10).toFixed(1).toString() + "V";
        payloadList.push(getPayloadData('over_voltage_threshold', over_voltage_threshold, groupID));
    }
    else if (fPort == 10) {
        var sag_voltage_state = bytes[5];
        payloadList.push(getPayloadData('sag_voltage_state', sag_voltage_state, groupID));
        var current_instantaneous_voltage = (bytesToInt(bytes, 6, 2) / 10).toFixed(1).toString() + "V";
        payloadList.push(getPayloadData('current_instantaneous_voltage', current_instantaneous_voltage, groupID));
        var sag_voltage_threshold = (bytesToInt(bytes, 8, 2) / 10).toFixed(1).toString() + "V";
        payloadList.push(getPayloadData('sag_voltage_threshold', sag_voltage_threshold, groupID));
    }
    else if (fPort == 11) {
        var over_current_state = bytes[5];
        payloadList.push(getPayloadData('over_current_state', over_current_state, groupID));
        var current_instantaneous_current = (parse_int16(bytesToInt(bytes, 6, 2)) / 1000).toFixed(1).toString() + "A";
        payloadList.push(getPayloadData('current_instantaneous_current', current_instantaneous_current, groupID));
        var over_current_threshold = (bytesToInt(bytes, 8, 2) / 1000).toFixed(4).toString() + "A";
        payloadList.push(getPayloadData('over_current_threshold', over_current_threshold, groupID));
    }
    else if (fPort == 12) {
        var over_load_state = bytes[5];
        payloadList.push(getPayloadData('over_load_state', over_load_state, groupID));
        var current_instantaneous_power = (parse_int24(bytesToInt(bytes, 6, 3)) / 10).toFixed(1).toString() + "W";
        payloadList.push(getPayloadData('current_instantaneous_power', current_instantaneous_power, groupID));
        var over_load_threshold = (bytesToInt(bytes, 9, 2) / 10).toFixed(1).toString() + "W";
        payloadList.push(getPayloadData('over_load_threshold', over_load_threshold, groupID));
    }
    else if (fPort == 13) {
        var load_change_state = bytes[5] == 1 ? "load starts working" : "load starts stop";
        payloadList.push(getPayloadData('load_change_state', load_change_state, groupID));
    }
    else if (fPort == 14) {
        var ac_output_state_after_countdown = bytes[5] == 1 ? "ON" : "OFF";
        payloadList.push(getPayloadData('ac_output_state_after_countdown', ac_output_state_after_countdown, groupID));
        var remaining_time_of_countdown_process = bytesToInt(bytes, 6, 4).toString() + "s";
        payloadList.push(getPayloadData('remaining_time_of_countdown_process', remaining_time_of_countdown_process, groupID));
    }
    return payloadList;
}
function command_format_check(length, fPort) {
    if (fPort == 5 && length === 7) {
        return true;
    }
    if (fPort == 6 && length === 11) {
        return true;
    }
    if (fPort == 7 && length === 10) {
        return true;
    }
    if (fPort == 8 && length === 11) {
        return true;
    }
    if (fPort == 9 && length === 10) {
        return true;
    }
    if (fPort == 10 && length === 10) {
        return true;
    }
    if (fPort == 11 && length === 10) {
        return true;
    }
    if (fPort == 12 && length === 11) {
        return true;
    }
    if (fPort == 13 && length === 6) {
        return true;
    }
    if (fPort == 14 && length === 10) {
        return true;
    }
    return false;
}
function parse_int16(num) {
    if (num & 0x8000)
        return (num - 0x10000);
    else
        return num;
}
function parse_int24(num) {
    if (num & 0x800000)
        return (num - 0x1000000);
    else
        return num;
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
    var tz_str = 'UTC';
    tz = tz > 128 ? tz - 256 : tz;
    if (tz < 0) {
        tz_str += '-';
        tz = -tz;
    }
    else {
        tz_str += '+';
    }
    if (tz < 20) {
        tz_str += '0';
    }
    tz_str += String(tz / 2);
    tz_str += ':';
    if (tz % 2) {
        tz_str += '30';
    }
    else {
        tz_str += '00';
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
    var time_str = '';
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
function formatNumber(number) {
    return number < 10 ? '0' + number.toString() : number.toString();
}
/*
    有符号十六进制字符串转十进制
*/
function signedHexToInt(hexStr) {
    var twoStr = parseInt(hexStr, 16).toString(2); // 将十六转十进制，再转2进制
    // console.log(twoStr);
    var bitNum = hexStr.length * 4; // 1个字节 = 8bit ，0xff 一个 'f'就是4位
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
    var twoStr_unsign = '';
    var tempValue = parseInt(twoStr, 2) - 1; // 补码：(负数)反码+1，符号位不变；相对十进制来说也是 +1，但这里是负数，+1就是绝对值数据-1
    twoStr_unsign = tempValue.toString(2).substring(1, bitNum); // 舍弃首位(符号位)
    // 去除首字符，将0转为1，将1转为0   反码
    twoStr_unsign = twoStr_unsign.replace(/0/g, 'z');
    twoStr_unsign = twoStr_unsign.replace(/1/g, '0');
    twoStr_unsign = twoStr_unsign.replace(/z/g, '1');
    return parseInt('-' + twoStr_unsign, 2);
}
function getPayloadData(type, value, groupID) {
    return {
        'variable': type,
        'value': value,
        'group': groupID,
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
    var buffer = Buffer.from(hexString, 'hex');
    return Array.from(buffer, function (byte) { return byte; });
}
