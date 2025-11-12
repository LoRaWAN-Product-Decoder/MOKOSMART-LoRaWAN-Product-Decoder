var deviceModeList = [
    'Standby mode',     //待机模式
    'Periodic mode',    //定期模式
    'Timing mode',      //定时模式
    'Start of movement in motion mode', //运动模式下运动开始
    'In movement for motion mode',      //运动模式下运动中
    'End of movement in motion mode',   //运动模式下运动结束
    'Stationary state in motion mode',  //运动模式下静止    
    'Time-segmented mode'               //定时+定期模式
];

var auxiliaryStatusList = [
    'No auxiliary operation',
    'Man Down status',
    'Downlink for position',
    'alarm 1',
    'alarm 2'
];

var powerOffTypeList = [
    'Bluetooth command',
    'LoRaWAN command',
    'Power button',
    'Battery run out'
];

var eventTypeList = [
    'Start of movement',    //运动开始
    'In movement',          //运动中
    'End of movement',      //运动结束
    'Man Down Start',       //进入ManDown
    'Man Down End',         //退出ManDown
    'Alarm1 start',         //Alarm1报警开始
    'Alarm1 end',           //Alarm1报警结束
    'Alarm2 start',         //Alarm2报警开始
    'Alarm2 end',           //Alarm2报警结束
    'Uplink Payload triggered by downlink command'  //下行帧触发上报
];

var positionTypeList = [
    'Working Mode',     //工作模式定位
    'Man Down',         //Man Down定位
    'downlink command', //下定请求定位
    'alarm1',           //Alarm1定位
    'alarm2'            //Alarm2定位
];

var posFailedReasonArray = [
    "WIFI positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)"
    , "WIFI positioning strategies timeout (Please increase the WIFI positioning timeout via MKLoRa app)"
    , "WIFI module is not detected, the WIFI module itself works abnormally"
    , "BLE Pos Timeout"
    , "BLE Pos Tech Timeout"
    , "Bluetooth broadcasting in progress (Please reduce the Bluetooth broadcast timeout or avoid Bluetooth positioning when Bluetooth broadcasting in process via MKLoRa app)"
    , "GPS Pos Timeout"
    , "GPS Pos Tech Timeout"
    , "GPS aiding positioning timeout (Please adjust GPS autonomous latitude and autonomous longitude)"
    , "The ephemeris of GPS aiding positioning is too old, need to be updated."
    , "L76 GPS Pos failed because of DPOP Limit"
    , "Interrupted by the end of the Motion"
    , "Interrupted by the start of the Motion"
    , "Interrupted by ManDown"
    , "Interrupted by Downlink command"
    , "Interrupted by Alarm"
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
    var contain_vlotage = false;
    if (fPort < 1 || fPort > 11) {
        deviceInfo.data = data;
        return deviceInfo;
    }

    data.port = fPort;
    data.hex_format_payload = bytesToHexString(bytes, 0, bytes.length);

    if (fPort == 11) {            
        deviceInfo.data = parse_port11_data(bytes);
    } else if ((fPort == 1 || fPort == 3) && bytes.length == 6) {
        deviceInfo.data = parse_port1_data(bytes);
    } else if ((fPort == 2 || fPort == 4) && (bytes.length == 10 || bytes.length == 9)) {
        deviceInfo.data = parse_port24_data(bytes,fPort);
    } else if (fPort == 5 && bytes.length == 7) {
        deviceInfo.data = parse_port5_data(bytes);
    } else if (fPort == 6 && bytes.length == 11) {
        deviceInfo.data = parse_port6_data(bytes);
    } else if (fPort == 8) {
        deviceInfo.data = parse_port8_data(bytes,contain_vlotage);
    } else if (fPort == 9) {
        deviceInfo.data = parse_port9_data(bytes,contain_vlotage);
    }
    
    return deviceInfo;
}

function parse_port1_data(bytes) {
    var index = 0;
    var data = {};
    data.charging_status = ((bytes[0] & 0x80) ? "in charging" : "no charging");
    data.battery_level = (bytes[0] & 0x7F) + "%";
    index ++;

    data.mcu_temperature = signedHexToInt(bytesToHexString(bytes, index, 1)) + '°C';
    index ++;

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

    data.device_mode = deviceModeList[bytes[index]];
    index += 1;

    data.auxiliary_operation = auxiliaryStatusList[bytes[index]];

    return data;
}

function parse_port24_data(bytes,fPort) {
    var index = 0;
    var data = {};

    data.charging_status = ((bytes[0] & 0x80) ? "in charging" : "no charging");
    data.battery_level = (bytes[0] & 0x7F) + "%";
    index ++;

    data.temperature = signedHexToInt(bytesToHexString(bytes, index, 1)) + '°C';
    index ++;

    var timestamp = bytesToInt(bytes, index, 4);
    index += 4;

    data.timestamp = parse_time(timestamp, bytes[index] * 0.5);
    index ++;

    data.device_mode = deviceModeList[bytes[index]];
    index += 1;

    data.auxiliary_operation = auxiliaryStatusList[bytes[index]];
    index ++;

    if (fPort == 2 && bytes.length == 10) {
        data.shutdown_type = powerOffTypeList[bytes[index]];
    }

    return data;
}

function parse_port5_data(bytes) {
    var index = 0;
    var data = {};
    data.charging_status = ((bytes[0] & 0x80) ? "in charging" : "no charging");
    data.battery_level = (bytes[0] & 0x7F) + "%";
    index ++;

    var timestamp = bytesToInt(bytes, index, 4);
    index += 4;

    data.timestamp = parse_time(timestamp, bytes[index] * 0.5);
    index ++;

    data.event_type = eventTypeList[bytes[index]];
    index ++;

    return data;
}

function parse_port6_data(bytes) {
    var index = 0;
    var data = {};

    var pos_type = ((bytesToInt(bytes,index,2) & 0xf000) >> 12);
    data.pos_type = positionTypeList[pos_type];
    data.Age = (bytesToInt(bytes,index,2) & 0x0fff);
    index += 2;

    data.latitude = Number(signedHexToInt(bytesToHexString(bytes, index, 4)) * 0.0000001).toFixed(7) + '°';
    index += 4;

    data.longitude = Number(signedHexToInt(bytesToHexString(bytes, index, 4)) * 0.0000001).toFixed(7) + '°';
    index += 4;

    data.pdop = (bytesToInt(bytes, index, 1) * 0.1).toFixed(1).toString();

    return data;
}

function parse_port8_data(bytes, contain_vlotage) {
    var index = 0;
    var data = {};

    data.charging_status = ((bytes[index] & 0x80) ? "in charging" : "no charging");
    data.battery_level = (bytes[index] & 0x7F) + "%";
    index ++;

    index += 2;

    data.pos_type = positionTypeList[(bytes[index] & 0xf0) >> 4];

    var positionTypeCode = (bytes[index] & 0x0f);
    data.position_success_type = (positionTypeCode == 0) ? "BLE Pos Success" : "GPS Pos Success";
    index ++;

    data.device_mode = deviceModeList[(bytes[index] & 0xf0) >> 4];
    data.auxiliary_operation = auxiliaryStatusList[bytes[index] & 0x0f];
    index ++;

    var len = bytes[index];
    index ++;

    var sub_bytes = bytes.slice(index, index + len);

    if (positionTypeCode == 0) {
        // 情况1: 仅有BLE定位成功数据
        var positionData = parse_port8_position_data(sub_bytes, contain_vlotage);
        data.mac_data = JSON.stringify(positionData);
        data.position_data = positionData; // 统一数组
    } else if (positionTypeCode == 1) {
        // 情况2: GPS定位数据，可能包含BLE数据
        var positionData = parseGPSAndBLEPositionData(sub_bytes, contain_vlotage);
        
        // 设置统一数组
        data.position_data = positionData;
        
        // 为了向后兼容，设置原有字段（从数组中提取GPS数据）
        var gpsItems = positionData.filter(item => item.type === "GPS");
        if (gpsItems.length > 0) {
            var lastGPS = gpsItems[gpsItems.length - 1]; // 取最后一条GPS数据
            data.latitude = lastGPS.latitude;
            data.longitude = lastGPS.longitude;
            data.pdop = lastGPS.pdop;
            data.satellite_signal_strength = lastGPS.satellite_signal_strength;
        }
        
        // 为了向后兼容，设置BLE数据
        // var bleItems = positionData.filter(item => item.type === "BLE");
        // if (bleItems.length > 0) {
        //     data.mac_data = JSON.stringify(bleItems);
        // }
    }

    index += len;

    const date = new Date(1000 * bytesToInt(bytes, index, 4));
    data.time = date.toLocaleString();
    index += 4;

    return data;
}

function parse_port9_data(bytes, contain_vlotage) {
    var index = 0;
    var obj = {};

    obj.charging_status = ((bytes[index] & 0x80) ? "in charging" : "no charging");
    obj.battery_level = (bytes[index] & 0x7F) + "%";
    index ++;

    obj.pos_type = positionTypeList[bytes[index]];
    index ++;

    obj.device_mode = deviceModeList[bytes[index]];
    index ++;

    obj.auxiliary_status = auxiliaryStatusList[bytes[index]];
    index ++;

    var failedTypeCode = bytesToInt(bytes, index, 1);
    index ++;

    var dataLen = bytesToInt(bytes, index, 1);
    index ++;

    var dataBytes = bytes.slice(index);
    
    // 将解析结果合并到obj中
    obj.reasons_for_positioning_failure_code = failedTypeCode;
    obj.reasons_for_positioning_failure = posFailedReasonArray[failedTypeCode];
    obj.location_failure_data = parsePositionData(dataBytes, contain_vlotage);
    
    return obj;
}

function parse_port11_data(bytes) {
    var index = 0;
    var data = {};
    data.work_time = bytesToInt(bytes,  index, 4);
    index += 4;

    data.adv_times = bytesToInt(bytes, index, 4);
    index += 4;

    data.ble_position_time = bytesToInt(bytes, index, 4);
    index += 4;

    data.gps_position_time = bytesToInt(bytes, index, 4);
    index += 4;

    data.axis_wakeup_time = bytesToInt(bytes, index, 4);
    index += 4;

    data.motor_viberation_time = bytesToInt(bytes, index, 4);
    index += 4;

    data.red_led_working_time = bytesToInt(bytes, index, 4);
    index += 4;

    data.green_led_working_time = bytesToInt(bytes, index, 4);
    index += 4;

    data.blue_led_working_time = bytesToInt(bytes, index, 4);
    index += 4;

    data.lora_send_times = bytesToInt(bytes, index, 4);
    index += 4;

    data.lora_power = bytesToInt(bytes, index, 4);
    index += 4;

    data.battery_consumption = bytesToInt(bytes, index, 4);
    index += 4;

    return data;
}

function parse_port8_position_data(bytes, contain_vlotage) {
    var sub_len = (contain_vlotage ? 9 : 7);
    var number = (bytes.length / sub_len);
    var mac_data = [];
    for (var i = 0; i < number; i++) {
        var obj = {
            type: "BLE"
        };
        var sub_bytes = bytes.slice((i * sub_len), (i * sub_len) + sub_len);
        var mac_address = bytesToHexString(sub_bytes, 0, 6);
        var rssi = bytesToInt(sub_bytes, 6, 1) - 256 + 'dBm';
        obj.mac_address = mac_address;
        obj.rssi = rssi;
        
        // 检查电压值，如果是0xFFFF则不包含voltage字段
        if (contain_vlotage && sub_bytes.length >= 9) {
            var voltageValue = bytesToInt(sub_bytes, 7, 2);
            if (voltageValue !== 0xFFFF) {
                obj.voltage = voltageValue + "mV";
            }
        }
        mac_data.push(obj);
    }
    return mac_data;
}

function parseGPSAndBLEPositionData(dataBytes, contain_vlotage) {
    var n = dataBytes.length;
    var result = [];
    
    var ble_sub_len = contain_vlotage ? 9 : 7;
    var gps_sub_len = 13;
        
    // 情况2.1: 仅有GPS定位数据 (长度是13的倍数)
    if (n % gps_sub_len === 0) {
        var gpsNumber = n / gps_sub_len;
        
        for (var i = 0; i < gpsNumber; i++) {
            var start = i * gps_sub_len;
            var end = start + gps_sub_len;
            var gpsBytes = dataBytes.slice(start, end);
            
            var gpsItem = {
                type: "GPS",
                latitude: Number(signedHexToInt(bytesToHexString(gpsBytes, 0, 4)) * 0.0000001).toFixed(7),
                longitude: Number(signedHexToInt(bytesToHexString(gpsBytes, 4, 4)) * 0.0000001).toFixed(7),
                pdop: Number(bytesToInt(gpsBytes, 8, 1) * 0.1).toFixed(1),
                satellite_signal_strength: bytesToInt(gpsBytes, 9, 4)
            };
            result.push(gpsItem);
        }
    }
    // 情况2.2: GPS和BLE混合数据
    else if (n > gps_sub_len && (n - gps_sub_len) % ble_sub_len === 0) {
        var bleNumber = (n - gps_sub_len) / ble_sub_len;
        
        // 解析BLE数据
        for (var i = 0; i < bleNumber; i++) {
            var start = i * ble_sub_len;
            var end = start + ble_sub_len;
            var bleBytes = dataBytes.slice(start, end);
            
            var bleItem = {
                type: "BLE",
                mac_address: bytesToHexString(bleBytes, 0, 6),
                rssi: bytesToInt(bleBytes, 6, 1) - 256 + 'dBm'
            };
            
            // 检查电压值，如果是0xFFFF则不包含voltage字段
            if (contain_vlotage && bleBytes.length >= 9) {
                var voltageValue = bytesToInt(bleBytes, 7, 2);
                if (voltageValue !== 0xFFFF) {
                    bleItem.voltage = voltageValue + "mV";
                }
            }
            
            result.push(bleItem);
        }
        
        // 解析GPS数据 (最后13字节)
        var gpsBytes = dataBytes.slice(bleNumber * ble_sub_len);
        
        var gpsItem = {
            type: "GPS",
            latitude: Number(signedHexToInt(bytesToHexString(gpsBytes, 0, 4)) * 0.0000001).toFixed(7),
            longitude: Number(signedHexToInt(bytesToHexString(gpsBytes, 4, 4)) * 0.0000001).toFixed(7),
            pdop: Number(bytesToInt(gpsBytes, 8, 1) * 0.1).toFixed(1),
            satellite_signal_strength: bytesToInt(gpsBytes, 9, 4)
        };
        result.push(gpsItem);
    }
    else {
        // 默认尝试解析为GPS数据
        if (n >= gps_sub_len) {
            var gpsBytes = dataBytes.slice(0, gps_sub_len);
            
            var gpsItem = {
                type: "GPS",
                latitude: Number(signedHexToInt(bytesToHexString(gpsBytes, 0, 4)) * 0.0000001).toFixed(7),
                longitude: Number(signedHexToInt(bytesToHexString(gpsBytes, 4, 4)) * 0.0000001).toFixed(7),
                pdop: Number(bytesToInt(gpsBytes, 8, 1) * 0.1).toFixed(1),
                satellite_signal_strength: bytesToInt(gpsBytes, 9, 4)
            };
            result.push(gpsItem);
        }
    }
    
    return result;
}

function parsePositionData(dataBytes, contain_vlotage) {
    var n = dataBytes.length;
    var result = [];
    
    var ble_sub_len = contain_vlotage ? 9 : 7;
    var gps_sub_len = 5;
        
    if (n == gps_sub_len) {
        // 情况1: 仅有一条GPS定位失败数据 
        var item = {
            type: "GPS",
            pdop: bytesToInt(dataBytes, 0, 1) / 10,
            satellite_signal_strength: bytesToInt(sub_bytes, 1, 4),
        };
        result.push(item);
    } else if (n % ble_sub_len === 0) {
        // 情况2: 仅有BLE定位失败数据 (长度是7或9的倍数)
        var bleNumber = n / ble_sub_len;

        for (var i = 0; i < bleNumber; i++) {
            var start = i * ble_sub_len;
            var end = start + ble_sub_len;
            var sub_bytes = dataBytes.slice(start, end);
            
            var item = {
                type: "BLE",
                mac_address: bytesToHexString(sub_bytes, 0, 6),
                rssi: bytesToInt(sub_bytes, 6, 1) - 256 + 'dBm',
            };
            // 检查电压值，如果是0xFFFF则不包含voltage字段
            if (contain_vlotage && sub_bytes.length >= 9) {
                var voltageValue = bytesToInt(sub_bytes, 7, 2);
                if (voltageValue !== 0xFFFF) {
                    item.voltage = voltageValue + "mV";
                }
            }
            result.push(item);
        }
    } else if (n === ble_sub_len + gps_sub_len) {
        // 情况3: GPS和BLE都定位失败 (混合数据)
        // 对于12字节数据：可能是 1条BLE(7字节) + 1条GPS(5字节)        
        // 解析BLE数据 (前7字节)
        var bleBytes = dataBytes.slice(0, ble_sub_len);
        var bleItem = {
            type: "BLE",
            mac_address: bytesToHexString(bleBytes, 0, 6),
            rssi: bytesToInt(bleBytes, 6, 1) - 256 + 'dBm',
        };
        // 检查电压值，如果是0xFFFF则不包含voltage字段
        if (contain_vlotage && bleBytes.length >= 9) {
            var voltageValue = bytesToInt(bleBytes, 7, 2);
            if (voltageValue !== 0xFFFF) {
                bleItem.voltage = voltageValue + "mV";
            }
        }
        result.push(bleItem);
        
        // 解析GPS数据 (最后5字节)
        var gpsBytes = dataBytes.slice(ble_sub_len);
        var gpsItem = {
            type: "GPS",
            pdop: bytesToInt(gpsBytes, 0, 1) / 10,
            satellite_signal_strength: bytesToInt(gpsBytes, 1, 4),
        };
        result.push(gpsItem);
    } else if (n > ble_sub_len + gps_sub_len && (n - gps_sub_len) % ble_sub_len === 0) {
        // 情况4: 多条BLE + GPS
        var bleNumber = (n - gps_sub_len) / ble_sub_len;
        
        // 解析BLE数据
        for (var i = 0; i < bleNumber; i++) {
            var start = i * ble_sub_len;
            var end = start + ble_sub_len;
            var sub_bytes = dataBytes.slice(start, end);
            
            var item = {
                type: "BLE",
                mac_address: bytesToHexString(sub_bytes, 0, 6),
                rssi: bytesToInt(sub_bytes, 6, 1) - 256 + 'dBm',
            };
            // 检查电压值，如果是0xFFFF则不包含voltage字段
            if (contain_vlotage && sub_bytes.length >= 9) {
                var voltageValue = bytesToInt(sub_bytes, 7, 2);
                if (voltageValue !== 0xFFFF) {
                    item.voltage = voltageValue + "mV";
                }
            }
            result.push(item);
        }
        
        // 解析GPS数据 (最后5字节)
        var gpsBytes = dataBytes.slice(bleNumber * ble_sub_len);
        var gpsItem = {
            type: "GPS",
            pdop: bytesToInt(gpsBytes, 0, 1) / 10,
            satellite_signal_strength: bytesToInt(gpsBytes, 1, 4),
        };
        result.push(gpsItem);
    }
    
    return result;
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

// var input = {};
// input.fPort = 8;
// input.bytes = getData("5F000021101BDCBFBE1F7355E3EB2FCC765B12DC12278956443A9B6E37211F1E1D690F0D08");
// console.log(decodeUplink(input));