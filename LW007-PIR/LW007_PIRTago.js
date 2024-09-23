var payloadTypeArray = ['Heartbeat', 'Information', 'Shut Down'];
function Decoder(bytes, fPort, groupID) {
    var payloadList = [];
    if (fPort == 0) {
        return payloadList;
    }
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
    if (fPort == 6) {
        var temp_value = 0;
        temp_value = (bytes[5] >> 6) & 0x03;
        var pir_state = '';
        if (temp_value == 0x00) {
            pir_state = 'PIR motion not detected';
        }
        else if (temp_value == 0x01) {
            pir_state = 'PIR motion detected';
        }
        else {
            pir_state = 'Occupancy detection function is disable';
        }
        payloadList.push(getPayloadData('pir_state', pir_state, groupID));
        temp_value = (bytes[5] >> 4) & 0x03;
        var door_state = '';
        if (temp_value == 0x00) {
            door_state = 'Door/window is close';
        }
        else if (temp_value == 0x01) {
            door_state = 'Door/window is open';
        }
        else {
            door_state = 'Door/window status detection function is disable';
        }
        payloadList.push(getPayloadData('door_state', door_state, groupID));
        temp_value = (bytes[5] >> 2) & 0x03;
        var temperature_state = '';
        if (temp_value == 0x00) {
            temperature_state = 'Current environment temperature is lower than minimum temperature alarm threshold value';
        }
        else if (temp_value == 0x01) {
            temperature_state = 'Current environment temperature is higher than maximum temperature alarm threshold value';
        }
        else if (temp_value == 0x10) {
            temperature_state = 'Current environment temperature is normal';
        }
        else {
            temperature_state = 'Temperature threshold alarm function is disable';
        }
        payloadList.push(getPayloadData('temperature_state', temperature_state, groupID));
        temp_value = bytes[5] & 0x03;
        var humidity_state = '';
        if (temp_value == 0x00) {
            humidity_state = 'Current environment humidity is lower than minimum humidity alarm threshold value';
        }
        else if (temp_value == 0x01) {
            humidity_state = 'Current environment humidity is higher than maximum humidity alarm threshold value';
        }
        else if (temp_value == 0x10) {
            humidity_state = 'Current environment humidity is normal';
        }
        else {
            humidity_state = 'Humidity threshold alarm function is disable';
        }
        payloadList.push(getPayloadData('humidity_state', humidity_state, groupID));
        temp_value = (bytesToInt(bytes, 6, 3) >> 14) & 0x03ff;
        var temperature = '';
        if (temp_value == 0x03ff) {
            temperature = 'Temperature monitoring function is disable';
        }
        else {
            temp_value = temp_value / 10 - 30;
            temperature = temp_value.toFixed(1) + '°';
        }
        payloadList.push(getPayloadData('temperature', temperature, groupID));
        temp_value = (bytesToInt(bytes, 6, 3) >> 4) & 0x03ff;
        var humidity = '';
        if (temp_value == 0x03ff) {
            humidity = 'Humidity monitoring function is disable';
        }
        else {
            temp_value = temp_value / 10;
            humidity = temp_value.toFixed(1) + '%';
        }
        payloadList.push(getPayloadData('humidity', humidity, groupID));
        temp_value = (bytesToInt(bytes, 6, 3) >> 2) & 0x03;
        var temperature_change_state = '';
        if (temp_value == 0x00) {
            temperature_change_state = 'Current environment temperature rises faster than temperature change alarm condition';
        }
        else if (temp_value == 0x01) {
            temperature_change_state = 'Current environment temperature drops faster than temperature change alarm condition';
        }
        else if (temp_value == 0x10) {
            temperature_change_state = 'Current environment temperature change is normal';
        }
        else {
            temperature_change_state = 'Temperature change alarm function is disable';
        }
        payloadList.push(getPayloadData('temperature_change_state', temperature_change_state, groupID));
        temp_value = bytesToInt(bytes, 6, 3) & 0x03;
        var humidity_change_state = '';
        if (temp_value == 0x00) {
            humidity_change_state = 'Current environment humidity rises faster than humidity change alarm condition';
        }
        else if (temp_value == 0x01) {
            humidity_change_state = 'Current environment humidity drops faster than humidity change alarm condition';
        }
        else if (temp_value == 0x10) {
            humidity_change_state = 'Current environment humidity change is normal';
        }
        else {
            humidity_change_state = 'Humidity change alarm function is disable';
        }
        payloadList.push(getPayloadData('humidity_change_state', humidity_change_state, groupID));
        var low_battery_status_1 = (bytesToInt(bytes, 9, 2) >> 15) == 1 ? 'Battery level is low' : 'Battery level is normal';
        payloadList.push(getPayloadData('low_battery_status', low_battery_status_1, groupID));
        temp_value = bytesToInt(bytes, 10, 2) & 0x7FFF;
        var door_trigger_times = temp_value == 0x7FFF ? 'Door/window status detection function is disable' : temp_value.toString() + 'times';
        payloadList.push(getPayloadData('door_trigger_times', door_trigger_times, groupID));
    }
    else if (fPort == 7) {
        var low_battery_status = '';
        var low_battery_prompt = '';
        if (bytes[5] == 0x00) {
            low_battery_status = 'Battery level is normal';
            low_battery_prompt = 'low power alarm function is disabled';
        }
        else if (bytes[5] == 0x01) {
            low_battery_status = 'Battery is low';
            low_battery_prompt = 'low power alarm function is disabled';
        }
        else if (bytes[5] == 0x02) {
            low_battery_status = 'Battery is normal';
            low_battery_prompt = 'low power alarm function is disabled';
        }
        else if (bytes[5] == 0x03) {
            low_battery_status = 'Battery is low';
            low_battery_prompt = 'low power alarm function is disabled';
        }
        payloadList.push(getPayloadData('low_battery_status', low_battery_status, groupID));
        payloadList.push(getPayloadData('low_battery_prompt', low_battery_prompt, groupID));
    }
    return payloadList;
}
function command_format_check(length, fPort) {
    if (fPort == 5 && length === 11) {
        return true;
    }
    if (fPort == 6 && length === 11) {
        return true;
    }
    if (fPort == 7 && length === 6) {
        return true;
    }
    return false;
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
