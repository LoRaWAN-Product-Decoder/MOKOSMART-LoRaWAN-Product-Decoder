const payloadTypeArray:string[] = [
    "Heartbeat"
    , "Location Fixed"
    , "Low Power"
    , "Location Failure"
    , "Shutdown"
    , "Shock"
    , "Man Down detection"
    , "Event Message"
    , "Battery Consumption"
    , "Data Storage"
    , "GPS Limit"
    , "Anti-demolition"];
const operationModeArray:string[] = ["Standby mode", "Periodic mode", "Timing mode", "Motion mode", "Timing + period mode"];
const rebootReasonArray:string[] = ["Restart after power failure", "Bluetooth command request", "LoRaWAN command request", "Power on after normal power off","Factory reset"];
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
const shutdownTypeArray:string[] = ["Bluetooth command to turn off the device", "LoRaWAN command to turn off the device", "Magnetic to turn off the device", "The battery run out"];
const eventTypeArray:string[] = [
    "Start of movement"
    , "In movement"
    , "End of movement"
    , "Uplink Payload triggered by downlink message"
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
function Decoder(bytes: number[], fPort: number, groupID: string):{ [key: string]: any }[] {
    var contain_vlotage = 0;
    const payloadList: { [key: string]: any }[] = []; {
    
    payloadList.push(getPayloadData("port", fPort, groupID));
    payloadList.push(getPayloadData("hex_format_payload", bytesToHexString(bytes, 0, bytes.length), groupID));

    if (fPort == 0 || fPort == 10 || fPort == 11) {
        return payloadList;
    }

    if (fPort == 12 && bytes.length == 11) {
        payloadList.push(getPayloadData("ack", bytes[1] & 0x0f, groupID));
        payloadList.push(getPayloadData("battery_value", (((bytes[1] >> 4) & 0xf) * 0.1 + 2.2).toFixed(1).toString() + "V", groupID));

        var lat = bytesToInt(bytes, 2, 4);
		var lon = bytesToInt(bytes, 6, 4);

		if (lat > 0x80000000)
            lat = lat - 0x100000000;
        if (lon > 0x80000000)
            lon = lon - 0x100000000;

        const latitude = (lat / 10000000);

        const longitude = (lon / 10000000);

        const location = {
            'variable': 'location',
            'value': 'My Address',
            'location':{
                'lat': latitude,
                'lng': longitude,
            },
            'group': groupID,
            'metadata': {
                'color': '#add8e6'
            },
        }

        payloadList.push(getPayloadData("pdop", (bytesToInt(bytes, 10, 1) * 0.1).toFixed(1).toString(), groupID));
        return payloadList;
    }

    const operationModeCode = bytes[0] & 0x07;
    const operation_mode = operationModeArray[operationModeCode];
    payloadList.push(getPayloadData("operation_mode", operation_mode, groupID));

    const batteryLevelCode = bytes[0] & 0x08;
    const battery_level = batteryLevelCode == 0 ? "Normal" : "Low battery";
    payloadList.push(getPayloadData("battery_level", battery_level, groupID));

    const manDownStatusCode = bytes[0] & 0x10;
    const mandown_status = manDownStatusCode == 0 ? "Not in idle" : "In idle";
    payloadList.push(getPayloadData("mandown_status", mandown_status, groupID));

    const motionStateSinceLastPaylaodCode = bytes[0] & 0x20;
    const motion_state_since_last_paylaod = motionStateSinceLastPaylaodCode == 0 ? "No" : "Yes";
    payloadList.push(getPayloadData("motion_state_since_last_paylaod", motion_state_since_last_paylaod, groupID));

    const positioningTypeCode = bytes[0] & 0x40;
    const positioning_type = positioningTypeCode == 0 ? "Normal" : "Downlink for position";
    payloadList.push(getPayloadData("positioning_type", positioning_type, groupID));

    const anti_demolition = ((bytes[0] & 0x80) == 0) ? "No trigger" : "Trigger";
    payloadList.push(getPayloadData("anti_demolition", anti_demolition, groupID));

    const temperature = signedHexToInt(bytesToHexString(bytes, 1, 1)).toString() + '°C';
    payloadList.push(getPayloadData("temperature", temperature, groupID));

    payloadList.push(getPayloadData("ack", (bytes[2] & 0x0f), groupID));

    const battery_voltage = ((28 + ((bytes[2] >> 4) & 0x0f)) / 10).toString + "V";
    payloadList.push(getPayloadData("battery_voltage", battery_voltage, groupID));


    if (fPort == 1 && bytes.length == 5) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[0], groupID));
        return [...payloadList, ...parse_port1_data(bytes.slice(3),groupID)];
    } else if (fPort == 2 && bytes.length >= 7) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[1], groupID));
        return [...payloadList, ...parse_port2_data(bytes.slice(3),(contain_vlotage == 1),groupID)];
    }else if (fPort == 3 && bytes.length == 8) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[2], groupID));
        return [...payloadList, ...parse_port3_data(bytes.slice(3),groupID)];
    } else if (fPort == 4 && bytes.length >= 5) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[3], groupID));
        return [...payloadList, ...parse_port4_data(bytes.slice(3),(contain_vlotage == 1),groupID)];
    } else if (fPort == 5 && bytes.length == 4) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[4], groupID));
        var shutdownTypeCode = bytesToInt(bytes, 3, 1);
        payloadList.push(getPayloadData("shutdown_type", shutdownTypeArray[shutdownTypeCode], groupID));
        return payloadList;
    } else if (fPort == 6 && bytes.length == 4) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[5], groupID));
        payloadList.push(getPayloadData("number_of_shocks", bytesToInt(bytes, 3, 2), groupID));
        return payloadList;
    } else if (fPort == 7 && bytes.length == 5) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[6], groupID));
        payloadList.push(getPayloadData("total_idle_time", bytesToInt(bytes, 3, 2), groupID));
        return payloadList;
    } else if (fPort == 8 && bytes.length == 4) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[7], groupID));
        const eventTypeCode = bytesToInt(bytes, 3, 1);
        //addPayloadArray("event_type_code = eventTypeCode;
        payloadList.push(getPayloadData("event_type", eventTypeArray[eventTypeCode], groupID));
        return payloadList;
    } else if (fPort == 9 && bytes.length == 43) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[8], groupID));
        return [...payloadList, ...parse_port9_data(bytes.slice(3),groupID)];
    }  else if (fPort == 13 && bytes.length == 7) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[11], groupID));
        var timestamp = bytesToInt(bytes,3,4);
        payloadList.push(getPayloadData("timestamp", timestamp, groupID));
        const date = new Date(1000 * timestamp);
        payloadList.push(getPayloadData("time", date.toLocaleString(), groupID));
        return payloadList;
    }
    return payloadList;
}

/*********************Port Parse*************************/

function parse_port1_data(bytes:number[], groupID:string):{ [key: string]: any }[] {
    const tempList: { [key: string]: any }[] = []; 
    const rebootReasonCode = bytesToInt(bytes, 0, 1);
    tempList.push(getPayloadData("reboot_reason", rebootReasonArray[rebootReasonCode], groupID));
    const majorVersion = (bytes[1] >> 6) & 0x03;
    const minorVersion = (bytes[1] >> 4) & 0x03;
    const patchVersion = bytes[1] & 0x0f;
    const firmwareVersion = 'V' + majorVersion.toString() + '.' + minorVersion.toString() + '.' + patchVersion.toString();
    tempList.push(getPayloadData("firmware_version", firmwareVersion, groupID));

    return tempList;
}

function parse_port2_data(bytes:number[], contain_vlotage:boolean ,groupID:string):{ [key: string]: any }[] {
    const tempList: { [key: string]: any }[] = []; 
    var index = 0;
    var positionTypeCode = bytesToInt(bytes, index, 1);
    tempList.push(getPayloadData("position_type_code", positionTypeCode, groupID));
    const position_success_type = (positionTypeCode == 1) ? "Bluetooth positioning success" : "GPS positioning success";
    tempList.push(getPayloadData("position_success_type", position_success_type, groupID));
    index ++;

    const date = new Date(1000 * bytesToInt(bytes, index, 4));
    const time = date.toLocaleString();
    tempList.push(getPayloadData("time", time, groupID));
    index += 4;

    var sub_bytes = bytes.slice(index);
    if (positionTypeCode == 1) {
        //蓝牙
        var positionData = parse_position_data(sub_bytes, contain_vlotage,groupID);
        tempList.push(getPayloadData("mac_data", positionData, groupID));
    } else if (positionTypeCode == 3) {
        //GPS
        var latitude = Number(signedHexToInt(bytesToHexString(sub_bytes, 0, 4)) * 0.0000001).toFixed(7);
        var longitude = Number(signedHexToInt(bytesToHexString(sub_bytes, 4, 4)) * 0.0000001).toFixed(7);
        var pdop = Number(bytesToInt(sub_bytes, 8, 1) * 0.1).toFixed(1);
        tempList.push(getPayloadData("latitude", latitude, groupID));
        tempList.push(getPayloadData("longitude", longitude, groupID));
        tempList.push(getPayloadData("pdop", pdop, groupID));
    }
    return tempList;
}

function parse_port3_data(bytes:number[], groupID:string):{ [key: string]: any }[] {
    const tempList: { [key: string]: any }[] = []; 
    tempList.push(getPayloadData("low_power_percent", bytesToInt(bytes, 0, 1), groupID));
    tempList.push(getPayloadData("current_cicle_battery_total_consumer", bytesToInt(bytes, 1, 4), groupID));

    return tempList;
}

function parse_port4_data(bytes:number[], contain_vlotage:boolean ,groupID:string):{ [key: string]: any }[] {
    const tempList: { [key: string]: any }[] = []; 

    var failedTypeCode = bytesToInt(bytes, 0, 1);
    var dataLen = bytesToInt(bytes, 1, 1);
    var dataBytes = bytes.slice(2);
    if (failedTypeCode == 0 || failedTypeCode == 1 || failedTypeCode == 2
        || failedTypeCode == 3 || failedTypeCode == 4 || failedTypeCode == 5) {
        var sub_len = (contain_vlotage ? 9 : 7);
        var number = (dataLen / sub_len);
        var data_list: { [key: string]: any }[] = []; 
        for (var i = 0; i < number; i++) {
            var item: { [key: string]: any }[] = []; 
            var sub_bytes = dataBytes.slice((i * sub_len), (i * sub_len) + sub_len);
            var mac_address = bytesToHexString(sub_bytes, 0, 6);
            var rssi = (bytesToInt(sub_bytes, 6, 1) - 256).toString() + 'dBm';
            item.push(getPayloadData("mac_address", mac_address, groupID));
            item.push(getPayloadData("rssi", rssi, groupID));
            if (contain_vlotage) {
                const voltage = bytesToInt(sub_bytes, 7, 2).toString() + "mV";
                item.push(getPayloadData("voltage", voltage, groupID));
            }
            data_list.push(item);
        }
        tempList.push(getPayloadData("reasons_for_positioning_failure_code", failedTypeCode, groupID));
        tempList.push(getPayloadData("reasons_for_positioning_failure", posFailedReasonArray[failedTypeCode], groupID));
        tempList.push(getPayloadData("location_failure_data", data_list, groupID));
    } else {
        var data_list: { [key: string]: any }[] = []; 
        tempList.push(getPayloadData("pdop", (bytesToInt(dataBytes, 0, 1) / 10), groupID));
        var temp_sub = dataBytes.slice(1);
        for (var i = 0; i < dataLen - 1; i++) {
            const stringValue = bytesToInt(temp_sub, (i * 1), (i * 1) + 1);
            data_list.push(getPayloadData("C/N", stringValue, groupID));
        }
        tempList.push(getPayloadData("reasons_for_positioning_failure_code", failedTypeCode, groupID));
        tempList.push(getPayloadData("reasons_for_positioning_failure", posFailedReasonArray[failedTypeCode], groupID));
        tempList.push(getPayloadData("location_failure_data", data_list, groupID));
    }
    return tempList;
}

function parse_port9_data(bytes:number[], groupID:string):{ [key: string]: any }[] {
    const tempList: { [key: string]: any }[] = []; 
    var index = 0;
    const work_time = bytesToInt(bytes, index, 4);
    tempList.push(getPayloadData("work_time", work_time, groupID));
    index += 4;
    const adv_times = bytesToInt(bytes, index, 4);
    tempList.push(getPayloadData("adv_times", adv_times, groupID));
    index += 4;
    const axis_wakeup_time = bytesToInt(bytes, index, 4);
    tempList.push(getPayloadData("axis_wakeup_time", axis_wakeup_time, groupID));
    index += 4;
    const ble_position_time = bytesToInt(bytes, index, 4);
    tempList.push(getPayloadData("ble_position_time", ble_position_time, groupID));
    index += 4;
    const gps_position_time = bytesToInt(bytes, index, 4);
    tempList.push(getPayloadData("gps_position_time", gps_position_time, groupID));
    index += 4;
    const lora_send_times = bytesToInt(bytes, index, 4);
    tempList.push(getPayloadData("lora_send_times", lora_send_times, groupID));
    index += 4;
    const lora_power = bytesToInt(bytes, index, 4);
    tempList.push(getPayloadData("lora_power", lora_power, groupID));
    index += 4;
    const total_power = bytesToInt(bytes, index, 4);
    tempList.push(getPayloadData("total_power", total_power, groupID));
    index += 4;
    const position_report_times_during_stationary_in_motion_mode = bytesToInt(bytes, index, 4);
    tempList.push(getPayloadData("position_report_times_during_stationary_in_motion_mode", position_report_times_during_stationary_in_motion_mode, groupID));
    index += 4;
    const position_report_times_during_movement_in_motion_mode = bytesToInt(bytes, index, 4);
    tempList.push(getPayloadData("position_report_times_during_movement_in_motion_mode", position_report_times_during_movement_in_motion_mode, groupID));
    
    return tempList;
}

function parse_position_data(bytes:number[], contain_vlotage:boolean ,groupID:string):{ [key: string]: any }[] {
    const sub_len = (contain_vlotage ? 9 : 7);
    var number = (bytes.length / sub_len);
    var tempList: { [key: string]: any }[] = []; 
    for (var i = 0; i < number; i++) {
        var mac_data: { [key: string]: any }[] = []; 
        var sub_bytes = bytes.slice((i * sub_len), sub_len);
        var mac_address = bytesToHexString(sub_bytes, 0, 6);
        var rssi = (bytesToInt(sub_bytes, 6, 1) - 256).toString() + 'dBm';
        mac_data.push(getPayloadData("mac_address", mac_address, groupID));
        mac_data.push(getPayloadData("rssi", rssi, groupID));
        if (contain_vlotage) {
            const voltage = bytesToInt(sub_bytes, 7, 2).toString() + "mV";
            mac_data.push(getPayloadData("voltage", voltage, groupID));
        }
        tempList.push(mac_data);
    }
    return tempList;
}

/*********************Port Parse*************************/

/*
    整型数组指定部分转换成对应的Hex字符串
    bytes:里面全部为整数,
    start:开始转换的位置
    len:需要转换的长度
*/
function bytesToHexString(bytes: number[], start: number, len: number): string {
    if (bytes.length == 0 || start >= bytes.length || (start + len) > bytes.length) return '';
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
function bytesToInt(bytes: number[], start: number, len: number): number {
    if (bytes.length == 0 || start >= bytes.length || (start + len) > bytes.length) return 0;
    var value = 0;
    for (let i = 0; i < len; i++) {
        var m = ((len - 1) - i) * 8;
        value = value | bytes[start + i] << m;
    }
    return value;
}

function timezone_decode(tz: number): string {
    let tz_str = "UTC";
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

    tz_str += String(tz / 2);
    tz_str += ":"

    if (tz % 2) {
        tz_str += "30"
    } else {
        tz_str += "00"
    }

    return tz_str;
}

function parse_time(timestamp: number, timezone: number): string {
    timezone = timezone > 64 ? timezone - 128 : timezone;
    timestamp = timestamp + timezone * 3600;
    if (timestamp < 0) {
        timestamp = 0;
    }

    const d = new Date(timestamp * 1000);
    //d.setUTCSeconds(1660202724);

    let time_str = "";
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

function formatNumber(number: number): string {
    return number < 10 ? "0" + number.toString() : number.toString();
}

/*
    有符号十六进制字符串转十进制
*/
function signedHexToInt(hexStr: string): number {
    let twoStr = parseInt(hexStr, 16).toString(2); // 将十六转十进制，再转2进制
    // console.log(twoStr);
    let bitNum = hexStr.length * 4; // 1个字节 = 8bit ，0xff 一个 "f"就是4位
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
    let twoStr_unsign = "";
    let tempValue = parseInt(twoStr, 2) - 1; // 补码：(负数)反码+1，符号位不变；相对十进制来说也是 +1，但这里是负数，+1就是绝对值数据-1
    twoStr_unsign = tempValue.toString(2).substring(1, bitNum); // 舍弃首位(符号位)
    // 去除首字符，将0转为1，将1转为0   反码
    twoStr_unsign = twoStr_unsign.replace(/0/g, "z");
    twoStr_unsign = twoStr_unsign.replace(/1/g, "0");
    twoStr_unsign = twoStr_unsign.replace(/z/g, "1");
    return parseInt('-' + twoStr_unsign, 2);
}

function getPayloadData(type: string, value: any, groupID: string): { [key: string]: any } {
    return {
        "variable": type,
        "value": value,
        "group": groupID,
    };
}

const payloadd = payload.find((x) => ["payload_raw", "payload", "data"].includes(x.variable));
const portt = payload.find((x) => ["port", "fport", "f_port"].includes(x.variable));

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

function hexToNumberArray(hexString: string): number[] {
    const buffer = Buffer.from(hexString, "hex");
    return Array.from(buffer, (byte) => byte);
}