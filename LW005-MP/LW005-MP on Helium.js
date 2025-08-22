//LW005-MP Payload Decoder rule
//Creation time:2022-07-20 
//Creator:yujiahang
//Suitable firmware versions:LW005-MP V1.X.X
//Programming languages:Javascript
//Suitable platforms:Helium
var payloadTypeArray = [
    "Switch"
    , "Electrical"
    , "Electrical"
    , "Energy"
    , "Over-voltage"
    , "Sag-voltage"
    , "Over-current"
    , "Over-load"
    , "Load state"
    , "Countdown"
];


function Decoder(bytes, port, uplink_info) {
    var dev_info = {};

    dev_info.port = port;
    dev_info.payload_type = payloadTypeArray[port - 5];
    if (command_format_check(bytes, port) == false) {
        dev_info.result = "Format wrong";
        if (uplink_info)
            dev_info.uplink_info = uplink_info;
        return dev_info;
    }
    var timestamp = bytesToInt(bytes, 0, 4);
    if (timestamp < 1000000000){
        dev_info.result = "Timestamp wrong";
        if (uplink_info)
            dev_info.uplink_info = uplink_info;
        return dev_info;
    }
    dev_info.time = parse_time(timestamp, bytes[4] * 0.5);
    dev_info.timezone = signedHexToInt(bytesToHexString(bytes, 4, 1)) / 2;
    switch (port) {
        case 5:
            dev_info.ac_output_state = bytes[5] == 1 ? "ON" : "OFF";
            dev_info.plug_load_status = bytes[6] == 1 ? "There is a load on the plug" : "No load on the plug";
            break;
        case 6:
            dev_info.instantaneous_voltage = bytesToInt(bytes, 5, 2) / 10 + "V";
            dev_info.instantaneous_current = bytesToInt(bytes, 7, 2) / 1000 + "A";
            dev_info.instantaneous_current_frequency = bytesToInt(bytes, 9, 2) / 1000 + "HZ";
            break;
        case 7:
            dev_info.instantaneous_active_power = bytesToInt(bytes, 5, 4) / 10 + "W";
            dev_info.instantaneous_power_factor = (bytes[9] & 0xFF) + "%";
            break;
        case 8:
            dev_info.total_energy = bytesToInt(bytes, 5, 4) / 3200 + "KWH";
            dev_info.energy_of_last_hour = bytesToInt(bytes, 9, 2) / 3200 + "KWH";
            break;
        case 9:
            dev_info.over_voltage_state = bytes[5];
            dev_info.current_instantaneous_voltage = bytesToInt(bytes, 6, 2) / 10 + "V";
            dev_info.over_voltage_threshold = bytesToInt(bytes, 8, 2) / 10 + "V";
            break;
        case 10:
            dev_info.sag_voltage_state = bytes[5];
            dev_info.current_instantaneous_voltage = bytesToInt(bytes, 6, 2) / 10 + "V";
            dev_info.sag_voltage_threshold = bytesToInt(bytes, 8, 2) / 10 + "V";
            break;
        case 11:
            dev_info.over_current_state = bytes[5];
            dev_info.current_instantaneous_current = parse_int16(bytesToInt(bytes, 6, 2)) / 1000 + "A";
            dev_info.over_current_threshold = bytesToInt(bytes, 8, 2) / 1000 + "A";
            break;
        case 12:
            dev_info.over_load_state = bytes[5];
            dev_info.current_instantaneous_power = parse_int24(bytesToInt(bytes, 6, 3)) / 10 + "W";
            dev_info.over_load_threshold = bytesToInt(bytes, 9, 2) / 10 + "W";
            break;
        case 13:
            dev_info.load_change_state = bytes[5] == 1 ? "load starts working" : "load starts stop";
            break;
        case 14:
            dev_info.ac_output_state_after_countdown = bytes[5] == 1 ? "ON" : "OFF";;
            dev_info.remaining_time_of_countdown_process = bytesToInt(bytes, 6, 4) + "s";
            break;
        default:
            break;
    }
    if (uplink_info)
        dev_info.uplink_info = uplink_info;
    return dev_info;
}

function command_format_check(bytes, port) {
    if (port >= 1 || port <= 4) {
        return true;
    }
    switch (port) {
        case 5:
            if (bytes.length === 7)
                return true;
            break;

        case 6:
            if (bytes.length === 11)
                return true;
            break;

        case 7:
            if (bytes.length === 10)
                return true;
            break;

        case 8:
            if (bytes.length === 11)
                return true;
            break;

        case 9:
            if (bytes.length === 10)
                return true;
            break;

        case 10:
            if (bytes.length === 10)
                return true;
            break;

        case 11:
            if (bytes.length === 10)
                return true;
            break;

        case 12:
            if (bytes.length === 11)
                return true;
            break;

        case 13:
            if (bytes.length === 6)
                return true;
            break;

        case 14:
            if (bytes.length === 10)
                return true;
            break;

        default:
            break;
    }

    return false;
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

function bytesToHexString(bytes, start, len) {
    var char = [];
    for (var i = 0; i < len; i++) {
        var data = bytes[start + i].toString(16);
        var dataHexStr = ("0x" + data) < 0x10 ? ("0" + data) : data;
        char.push(dataHexStr);
    }
    return char.join("");
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

function bytesToInt(bytes, start, len) {
    var value = 0;
    for (var i = 0; i < len; i++) {
        var m = ((len - 1) - i) * 8;
        value = value | bytes[start + i] << m;
    }
    // var value = ((bytes[start] << 24) | (bytes[start + 1] << 16) | (bytes[start + 2] << 8) | (bytes[start + 3]));
    return value;
}

function parse_time(timestamp, timezone) {
    timestamp = timestamp + timezone * 3600;
    if (timestamp < 0) {
        timestamp = 0;
    }

    var d = new Date(timestamp * 1000);
    //d.setUTCSeconds(1660202724);

    var time_str = "";
    time_str += d.getUTCFullYear();
    time_str += "/";
    time_str += d.getUTCMonth() + 1;
    time_str += "/";
    time_str += d.getUTCDate();
    time_str += " ";

    time_str += d.getUTCHours();
    time_str += ":";
    time_str += d.getUTCMinutes();
    time_str += ":";
    time_str += d.getUTCSeconds()

    return time_str;
}

//dev_info = Decoder([0x62, 0xF4, 0xBA, 0xDA, 0x10, 0x00, 0x00], 5);
//dev_info = Decoder([0x61, 0xAD, 0x6C, 0x62, 0x10, 0x09, 0x2D, 0xF2, 0x0F, 0xC3, 0x65], 6);
//dev_info = Decoder([0x61, 0xAD, 0x6C, 0x62, 0x10, 0x00, 0x00, 0x78, 0xF9, 0x26], 7);
// dev_info = Decoder([0x61, 0xAD, 0x6C, 0x44, 0x10, 0x00, 0xB4, 0x1F, 0x3F, 0x01, 0x67], 8);
// console.log(dev_info);
// console.log(parse_time(1660202724, 0));
