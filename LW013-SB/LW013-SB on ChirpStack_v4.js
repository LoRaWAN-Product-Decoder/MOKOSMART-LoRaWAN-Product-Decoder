var eventTypeList = [
    'no event triggered',
    'event1 triggered',
    'event2 triggered',
    'event3 triggered'
];

var powerOffTypeList = [
    'turn off via APP',
    'turn off via downlink command',
    'turn off via magnetic'
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
    if (fPort < 0 || fPort > 6) {
        deviceInfo.data = data;
        return deviceInfo;
    }

    data.port = fPort;
    data.hex_format_payload = bytesToHexString(bytes, 0, bytes.length);

    var index = 0;

    if (fPort == 6) {
        data.work_time = bytesToInt(bytes,  index, 4);
        index += 4;

        data.adv_times = bytesToInt(bytes, index, 4);
        index += 4;

        data.red_led_working_time = bytesToInt(bytes, index, 4);
        index += 4;

        data.green_led_working_time = bytesToInt(bytes, index, 4);
        index += 4;

        data.blue_led_working_time = bytesToInt(bytes, index, 4);
        index += 4;

        data.buzzer_working_normal_time = bytesToInt(bytes, index, 4);
        index += 4;

        data.buzzer_alarm_normal_time = bytesToInt(bytes, index, 4);
        index += 4;

        data.event1_trigger_times = bytesToInt(bytes, index, 4);
        index += 4;

        data.event1_report_payload_times = bytesToInt(bytes, index, 4);
        index += 4;

        data.event2_trigger_times = bytesToInt(bytes, index, 4);
        index += 4;

        data.event2_report_payload_times = bytesToInt(bytes, index, 4);
        index += 4;

        data.event3_trigger_times = bytesToInt(bytes, index, 4);
        index += 4;

        data.event3_report_payload_times = bytesToInt(bytes, index, 4);
        index += 4;

        data.lora_send_times = bytesToInt(bytes, index, 4);
        index += 4;

        data.lora_power = bytesToInt(bytes, index, 4);
        index += 4;

        data.battery_consumption = bytesToInt(bytes, index, 4);
        index += 4;
            
        deviceInfo.data = data;
        return deviceInfo;
    }

    const date = new Date(1000 * bytesToInt(bytes, index, 4));
    data.time = date.toLocaleString();
    index += 4;

    data.timezone = signedHexToInt(bytesToHexString(bytes, index, 1));
    index += 1;

    var temperature = signedHexToInt(bytesToHexString(bytes, index, 1)) + '°C';
    data.temperature = temperature;
    index += 1;

    data.voltage = bytesToInt(bytes,index,2) + 'mV';
    index += 2;

    if (fPort == 1 && bytes.length == 11) {
        var major_firmware_version = (bytes[index] >> 6) & 0x03;
        var minor_firmware_version = (bytes[index] >> 4) & 0x03;
        var patch_firmware_version = bytes[index] & 0x0f;
        var firmware_version = 'V' + major_firmware_version + '.' + minor_firmware_version + '.' + patch_firmware_version;
        data.firmware_version = firmware_version;
        index += 1;

        var major_hardware_version = (bytes[index] >> 4) & 0x0f;
        var patch_hardware_version = bytes[index] & 0x0f;
        var hard_version = 'V' + major_hardware_version + '.' + patch_hardware_version;
        data.hardware_version = hard_version;
        index += 1;

        data.event_type = eventTypeList[bytes[index]];
    }else if (fPort == 2 && bytes.length == 9) {
        data.event_type = eventTypeList[bytes[index]];
    }else if (fPort == 3 && bytes.length == 9) {
        data.battery_percent = bytesToInt(bytes,index,1) + '%';
    }else if (fPort == 4 && bytes.length == 9) {
        data.shutdown_type = powerOffTypeList[bytes[index]];
    }else if (fPort == 5 && bytes.length == 9) {
        data.event_type = (bytes[index] == 0) ? 'downlink trigger' : '';
    }
    
    deviceInfo.data = data;
    return deviceInfo;
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