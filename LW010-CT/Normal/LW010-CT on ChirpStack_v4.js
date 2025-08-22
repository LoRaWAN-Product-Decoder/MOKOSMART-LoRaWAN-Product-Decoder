var operationModeArray = ["Standby mode"
    , "Timing mode"
    , "Periodic mode"
    , "Stationary in motion mode"
    , "Start of movement in motion mode"
    ,"Movement in motion mode"
    ,"End of movement in motion mode"
    ,"Timing + period mode"];
var deviceStatusArray = ["No auxiliary"
    ,"Man down"
    ,"Downlink for positioning"
    ,"Alert alarm"
    ,"SOS alarm"];
var shutdownTypeArray = ["Bluetooth command to turn off the device"
    , "LoRaWAN command to turn off the device"
    , "Magnetic to turn off the device"
    , "The battery run out"];
var lowPowerPercentArray = ["10%","20%","30%","40%","50%","60%"];
var eventTypeArray = ["Start movement"
    ,"In movement"
    ,"End of movement"
    ,"Man Down start"
    ,"Exist Man Down"
    ,"SOS start"
    ,"SOS end"
    ,"Alert alarm start"    
    ,"Alert alarm end"
    ,""
    ,""
    ,"Downlink for positioning"
    ,"Temperature high"
    ,"Temperature low"
    ,"Light intensity over threshold"];
var positionTypeArray = [
    "Positioning in working mode"
    , "ManDown positioning"
    , "Downlink for positioning"
    , "Alert positioning"
    , "SOS positioning"
];
var assistanceTypeArray = ["No auxiliary","Man down","Downlink for positioning","Alert alarm","SOS alarm"];


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
    var contain_vlotage = 0;
    var deviceInfo = {};
    var data = {};
    if (fPort < 0 || fPort == 10 || fPort == 7 || fPort > 12) {
        deviceInfo.data = data;
        return deviceInfo;
    }

    data.port = fPort;
    data.hex_format_payload = bytesToHexString(bytes, 0, bytes.length);

    if (fPort == 6) {
        var index = 0;
        var type_code = bytesToInt(bytes, index, 2);
        var position_type_code = (type_code >> 12) & 0x0f;
        data.position_type = positionTypeArray[position_type_code];
        data.age = (type_code & 0x0fff);
        index += 2;

        var latitude = Number(signedHexToInt(bytesToHexString(bytes, index, 4)) * 0.0000001).toFixed(7);
        index += 4;

        var longitude = Number(signedHexToInt(bytesToHexString(bytes, index, 4)) * 0.0000001).toFixed(7);
        index += 4;

        var pdop = Number(bytesToInt(bytes, index, 1) * 0.1).toFixed(1);

        data.latitude = latitude;
        data.longitude = longitude;
        data.pdop = pdop;
    }else {
        var index = 0;
        data.charging_status = ((bytes[index] & 0x80) == 0x80) ? 'Charging' : 'No charging';
        data.battery_percent = (bytes[index] & 0x7f) + "%";
        index += 1;
        
        if (fPort == 1 && bytes.length == 8) {
            if (bytes[index] != 0x80) {
                //0x80代表温度关闭
                var temperature = signedHexToInt(bytesToHexString(bytes, index, 1)) + '°C';
                data.temperature = temperature;
            } 
            index += 1;

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

            var work_mode = bytesToInt(bytes,index,1);
            data.work_mode = operationModeArray[work_mode];
            index += 1;

            var device_status = bytesToInt(bytes,index,1);
            data.device_status = deviceStatusArray[device_status];
            index += 1;

            var light_intensity = bytesToInt(bytes,index,2);
            if (light_intensity != 65535) {
                data.light_intensity = light_intensity;
            }
        }else if (fPort == 2 && bytes.length == 12) {
            if (bytes[index] != 0x80) {
                //0x80代表温度关闭
                var temperature = signedHexToInt(bytesToHexString(bytes, index, 1)) + '°C';
                data.temperature = temperature;
            } 
            index += 1;

            const date = new Date(1000 * bytesToInt(bytes, index, 4));
            data.time = date.toLocaleString();
            index += 4;

            data.timezone = signedHexToInt(bytesToHexString(bytes, index, 1));
            index += 1;

            var work_mode = bytesToInt(bytes,index,1);
            data.work_mode = operationModeArray[work_mode];
            index += 1;

            var device_status = bytesToInt(bytes,index,1);
            data.device_status = deviceStatusArray[device_status];
            index += 1;

            var shutdown_type = bytesToInt(bytes,index,1);
            data.shutdown_type = shutdownTypeArray[shutdown_type];
            index += 1;

            var light_intensity = bytesToInt(bytes,index,2);
            if (light_intensity != 65535) {
                data.light_intensity = light_intensity;
            }
        }else if (fPort == 3 && bytes.length == 11) {
            if (bytes[index] != 0x80) {
                //0x80代表温度关闭
                var temperature = signedHexToInt(bytesToHexString(bytes, index, 1)) + '°C';
                data.temperature = temperature;
            } 
            index += 1;

            const date = new Date(1000 * bytesToInt(bytes, index, 4));
            data.time = date.toLocaleString();
            index += 4;

            data.timezone = signedHexToInt(bytesToHexString(bytes, index, 1));
            index += 1;

            var work_mode = bytesToInt(bytes,index,1);
            data.work_mode = operationModeArray[work_mode];
            index += 1;

            var device_status = bytesToInt(bytes,index,1);
            data.device_status = deviceStatusArray[device_status];
            index += 1;

            var light_intensity = bytesToInt(bytes,index,2);
            if (light_intensity != 65535) {
                data.light_intensity = light_intensity;
            }
        }else if (fPort == 4 && bytes.length == 12) {
            if (bytes[index] != 0x80) {
                //0x80代表温度关闭
                var temperature = signedHexToInt(bytesToHexString(bytes, index, 1)) + '°C';
                data.temperature = temperature;
            } 
            index += 1;

            const date = new Date(1000 * bytesToInt(bytes, index, 4));
            data.time = date.toLocaleString();
            index += 4;

            data.timezone = signedHexToInt(bytesToHexString(bytes, index, 1));
            index += 1;

            var work_mode = bytesToInt(bytes,index,1);
            data.work_mode = operationModeArray[work_mode];
            index += 1;

            var device_status = bytesToInt(bytes,index,1);
            data.device_status = deviceStatusArray[device_status];
            index += 1;

            var low_power_percent = bytesToInt(bytes,index,1);
            data.low_power_percent = lowPowerPercentArray[low_power_percent];
            index += 1;
            
            var light_intensity = bytesToInt(bytes,index,2);
            if (light_intensity != 65535) {
                data.light_intensity = light_intensity;
            }
        }else if (fPort == 5 && bytes.length == 10) {
            const date = new Date(1000 * bytesToInt(bytes, index, 4));
            data.time = date.toLocaleString();
            index += 4;

            data.timezone = signedHexToInt(bytesToHexString(bytes, index, 1));
            index += 1;

            var event_type = bytesToInt(bytes,index,1);
            data.event_type = eventTypeArray[event_type];
            index += 1;

            if (bytes[index] != 0x80) {
                //0x80代表温度关闭
                var temperature = signedHexToInt(bytesToHexString(bytes, index, 1)) + '°C';
                data.temperature = temperature;
            } 
            index += 1;
            
            var light_intensity = bytesToInt(bytes,index,2);
            if (light_intensity != 65535) {
                data.light_intensity = light_intensity;
            }
        }else if (fPort == 8 && bytes.length > 6) {
            index += 2;

            var position_type_code = (bytes[index] >> 4) & 0x0f;
            data.position_type = positionTypeArray[position_type_code];
            var position_symbol = (bytes[index] & 0x0f);
            data.position_symbol = (position_symbol == 0x01) ? "Bluetooth positioning success" : "GPS positioning success";
            index += 1;

            var work_mode = (bytes[index] >> 4) & 0x0f;
            data.work_mode = operationModeArray[work_mode];
            var device_status = (bytes[index] & 0x0f);
            data.device_status = deviceStatusArray[device_status];
            index += 1;

            var data_len = bytes[index];
            index += 1;

            var position_data = bytes.slice(index,index + data_len);
            index += data_len;

            if (position_symbol == 0x01) {
                //蓝牙定位
                var sub_bytes_len = (contain_vlotage ? 9 : 7);
                var data_list = [];
                for (var i = 0; i < (data_len / sub_bytes_len);i ++) {
                    var item = {};
                    var temp_sub = position_data.slice((i * sub_bytes_len),(i * sub_bytes_len) + sub_bytes_len);
                    item.mac_address = bytesToHexString(temp_sub, 0, 6);
                    item.rssi = signedHexToInt(bytesToHexString(temp_sub, 6, 1)) + 'dBm';
                    if (contain_vlotage) {
                        item.voltage = bytesToInt(temp_sub, 7, 2) + "mV";
                    }
                    data_list.push(item);
                }
                data.position_data = data_list;
            }else if (position_symbol == 0x03) {
                //GPS定位
                var data_list = [];
                for (var i = 0; i < (data_len / 9);i ++) {
                    var item = {};
                    var temp_sub = position_data.slice((i * 9),(i * 9) + 9);
                    item.latitude = Number(signedHexToInt(bytesToHexString(temp_sub, 0, 4)) * 0.0000001).toFixed(7) + '°';
                    item.longitude = Number(signedHexToInt(bytesToHexString(temp_sub, 4, 4)) * 0.0000001).toFixed(7) + '°';
                    item.pdop = (bytesToInt(temp_sub, 8, 1) * 0.1).toFixed(1).toString();
                    data_list.push(item);
                }
                data.position_data = data_list;
            }else {
                data.position_data = position_data;
            }

            if (bytes[index] != 0x80) {
                //0x80代表温度关闭
                var temperature = signedHexToInt(bytesToHexString(bytes, index, 1)) + '°C';
                data.temperature = temperature;
            } 
            index += 1;
            
            var light_intensity = bytesToInt(bytes,index,2);
            if (light_intensity != 65535) {
                data.light_intensity = light_intensity;
            }
            index += 2;

            const date = new Date(1000 * bytesToInt(bytes, index, 4));
            data.time = date.toLocaleString();
        }else if (fPort == 9 && bytes.length > 7) {
            data.position_type = positionTypeArray[bytes[index]];
            index += 1;

            data.work_mode = operationModeArray[bytes[index]];
            index += 1;

            data.assistance_type = assistanceTypeArray[bytes[index]];
            index +=1;

            data.position_failed_type = parsePositionFailedCode(bytes[index]);
            index +=1;

            var data_len = bytes[index];
            index += 1;

            var failed_data = bytes.slice(index,index + data_len);
            index += data_len;

            var failed_type = bytes[index];
            index += 1;

            if (failed_type == 1) {
                //蓝牙定位
                var sub_bytes_len = (contain_vlotage ? 9 : 7);
                var data_list = [];
                for (var i = 0; i < (data_len / sub_bytes_len);i ++) {
                    var item = {};
                    var temp_sub = failed_data.slice((i * sub_bytes_len),(i * sub_bytes_len) + sub_bytes_len);
                    item.mac_address = bytesToHexString(temp_sub, 0, 6);
                    item.rssi = signedHexToInt(bytesToHexString(temp_sub, 6, 1)) + 'dBm';
                    if (contain_vlotage) {
                        item.voltage = bytesToInt(temp_sub, 7, 2) + "mV";
                    }
                    data_list.push(item);
                }
                data.position_failed_data = data_list;
            }else if (failed_type == 3) {
                //GPS定位
                var data_list = [];
                for (var i = 0; i < (data_len / 5);i ++) {
                    var item = {};
                    var temp_sub = failed_data.slice((i * 5),(i * 5) + 5);
                    item.pdop = (bytesToInt(temp_sub, 0, 1) * 0.1).toFixed(1).toString();
                    var cn_list = [];
                    cn_list.push(bytesToInt(temp_sub, 1, 1));
                    cn_list.push(bytesToInt(temp_sub, 2, 1));
                    cn_list.push(bytesToInt(temp_sub, 3, 1));
                    cn_list.push(bytesToInt(temp_sub, 4, 1));
                    item.cn_list = cn_list;
                    data_list.push(item);
                }
                data.position_failed_data = data_list;
            }else {
                data.position_failed_data = failed_data;
            }

            if (bytes[index] != 0x80) {
                //0x80代表温度关闭
                var temperature = signedHexToInt(bytesToHexString(bytes, index, 1)) + '°C';
                data.temperature = temperature;
            } 
            index += 1;
            
            var light_intensity = bytesToInt(bytes,index,2);
            if (light_intensity != 65535) {
                data.light_intensity = light_intensity;
            }
            index += 2;
        }else if (fPort == 11 && bytes.length == 12) {
            if (bytes[index] != 0x80) {
                //0x80代表温度关闭
                var temperature = signedHexToInt(bytesToHexString(bytes, index, 1)) + '°C';
                data.temperature = temperature;
            } 
            index += 1;

            const date = new Date(1000 * bytesToInt(bytes, index, 4));
            data.time = date.toLocaleString();
            index += 4;

            data.timezone = signedHexToInt(bytesToHexString(bytes, index, 1));
            index += 1;

            var work_mode = bytesToInt(bytes,index,1);
            data.work_mode = operationModeArray[work_mode];
            index += 1;

            var device_status = bytesToInt(bytes,index,1);
            data.device_status = deviceStatusArray[device_status];
            index += 1;

            data.shock_times = bytesToInt(bytes,index,1);
            index += 1;

            var light_intensity = bytesToInt(bytes,index,2);
            if (light_intensity != 65535) {
                data.light_intensity = light_intensity;
            }
        }else if (fPort == 12 && bytes.length == 53) {
            data.work_time = bytesToInt(bytes, index, 4);
            index += 4;

            data.adv_times = bytesToInt(bytes, index, 4);
            index += 4;

            data.axis_wakeup_time = bytesToInt(bytes, index, 4);
            index += 4;

            data.ble_position_time = bytesToInt(bytes, index, 4);
            index += 4;

            data.gps_position_time = bytesToInt(bytes, index, 4);
            index += 4;

            data.lora_send_times = bytesToInt(bytes, index, 4);
            index += 4;

            data.lora_power = bytesToInt(bytes, index, 4);
            index += 4;

            data.battery_consumption = bytesToInt(bytes, index, 4);
            index += 4;

            data.position_report_times_during_stationary_in_motion_mode = bytesToInt(bytes, index, 4);
            index += 4;

            data.position_report_times_during_movement_in_motion_mode = bytesToInt(bytes, index, 4);
            index += 4;

            data.green_led_working_time = bytesToInt(bytes, index, 4);
            index += 4;

            data.orange_led_working_time = bytesToInt(bytes, index, 4);
            index += 4;

            data.blue_led_working_time = bytesToInt(bytes, index, 4);
            index += 4;
        }
    }
    
    deviceInfo.data = data;
    return deviceInfo;
}

function parsePositionFailedCode(byte) {
    if (byte == 3) {
        return "Bluetooth positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)";
    }
    if (byte == 4) {
        return "Bluetooth positioning strategies timeout (Please increase the Bluetooth positioning timeout via MKLoRa app)";
    }
    if (byte == 6) {
        return "GPS positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)";
    }
    if (byte == 7) {
        return "GPS positioning strategies timeout (please increase the GPS positioning timeout via MKLoRa app)";
    }
    if (byte == 10) {
        return "GPS aiding positioning timeout (Please increase gps aiding positioning timeout or disable gps aiding function)";
    }
    if (byte == 11) {
        return "Interrupted positioning by end of movement (the movement restarted too quickly, resulting in not enough time to complete the positioning)";
    }
    if (byte == 12) {
        return "Interrupted positioning by start of movement (the movement ends too quickly, resulting in not enough time to complete the positioning)";
    }
    if (byte == 13) {
        return "Interrupted by Man Down";
    }
    if (byte == 14) {
        return "Interrupted by Down link for positioning";
    }
    if (byte == 15) {
        return "interrupted by alarm";
    }
    return "";
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