const payloadTypeArray:string[] = [
    "Heartbeat"
    , "Location Fixed"
    , "Location Failure"
    , "Shutdown"
    , "Shock"
    , "Man Down detection"
    , "Event Message"
    , "Battery Consumption"
    , "GPS Limit"];
const operationModeArray:string[] = ["Standby mode", "Periodic mode", "Timing mode", "Motion mode"];
const rebootReasonArray:string[] = ["Restart after power failure", "Bluetooth command request", "LoRaWAN command request", "Power on after normal power off","Factory reset"];
const positionTypeArray:string[] = [
    "WIFI positioning success (Customized Format)"
    , "WIFI positioning success (LoRa Cloud DAS Format, the positioning date would be upload to LoRa Cloud on Port199)"
    , "Bluetooth positioning success"
    , "GPS positioning success"
];
const posFailedReasonArray:string[] = [
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
    , "Notify of ephemeris update start"
    , "Notify of ephemeris update end"
];


function Decoder(bytes: number[], fPort: number, groupID: string):{ [key: string]: any }[] {
    var contain_vlotage = 0;
    const payloadList: { [key: string]: any }[] = [];

    if (bytes.length < 4 || fPort == 0 || fPort == 10 || fPort == 11) {
        return payloadList;
    }

    payloadList.push(getPayloadData("port", fPort, groupID));
    payloadList.push(getPayloadData("hex_format_payload", bytesToHexString(bytes, 0, bytes.length), groupID));

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

    const temperature = signedHexToInt(bytesToHexString(bytes, 1, 1)).toString() + '°C';
    payloadList.push(getPayloadData("temperature", temperature, groupID));

    payloadList.push(getPayloadData("ack", bytes[2] & 0x0f, groupID));
    payloadList.push(getPayloadData("battery_value", (2.2 + (bytes[2] & 0xf0) * 0.1).toString() + "V", groupID));

    const date = new Date();
    const timestamp = Math.trunc(date.getTime() / 1000);
    payloadList.push(getPayloadData("timestamp", timestamp, groupID));
    const offsetHours = Math.abs(Math.floor(date.getTimezoneOffset() / 60));
    payloadList.push(getPayloadData("time", parse_time(timestamp, offsetHours), groupID));
    payloadList.push(getPayloadData("timezone", timezone_decode(offsetHours * 2), groupID));


    if (fPort == 1 && bytes.length == 9) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[0], groupID));

        return [...payloadList, ...parse_port1_data(bytes.slice(3),groupID)];
    }

    if (fPort == 2 && bytes.length >= 7) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[1], groupID));
        return [...payloadList, ...parse_port2_data(bytes.slice(3),groupID,contain_vlotage)];
    }

    if (fPort == 3 && bytes.length == 8) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[7], groupID));
        return [...payloadList, ...parse_port3_data(bytes.slice(3),groupID)];
    }

    if (fPort == 4 && bytes.length >= 5) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[2], groupID));
        return [...payloadList, ...parse_port4_data(bytes.slice(3),groupID,contain_vlotage)];
    } 

    if (fPort == 5 && bytes.length == 4) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[3], groupID));
        var shutdownTypeCode = bytesToInt(bytes, 3, 2);
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
        const eventTypeCode = bytesToInt(bytes, 3, 1);
        //addPayloadArray("event_type_code = eventTypeCode;
        payloadList.push(getPayloadData("event_type", eventTypeArray[eventTypeCode], groupID));
        return payloadList;
    } 
    if (fPort == 9 && bytes.length == 43) {
        payloadList.push(getPayloadData("payload_type", payloadTypeArray[7], groupID));
        return [...payloadList, ...parse_port9_data(bytes.slice(3),groupID)];
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

function parse_port2_data(bytes:number[], groupID:string, contain_vlotage:number):{ [key: string]: any }[] {
    const tempList: { [key: string]: any }[] = []; 
    const positionTypeCode = bytesToInt(bytes, 2, 1);
    tempList.push(getPayloadData("position_type_code", positionTypeCode, groupID));
    tempList.push(getPayloadData("position_success_type", positionTypeArray[positionTypeCode], groupID));
    
    const sub_bytes = bytes.slice(4,4 + bytes[3]);
    if (positionTypeCode == 2) {
        const positionData = parse_position_data(sub_bytes,contain_vlotage);
        tempList.push(getPayloadData("mac_data", positionData, groupID));
    } else if (positionTypeCode == 3) {
        const latitude = Number(signedHexToInt(bytesToHexString(sub_bytes, 0, 4)) * 0.0000001).toFixed(7);
        const longitude = Number(signedHexToInt(bytesToHexString(sub_bytes, 4, 4)) * 0.0000001).toFixed(7);
        const pdop = Number(bytesToInt(sub_bytes, 8, 1) * 0.1).toFixed(1);
        tempList.push(getPayloadData("latitude", latitude, groupID));
        tempList.push(getPayloadData("longitude", longitude, groupID));
        tempList.push(getPayloadData("pdop", pdop, groupID));
    }

    const dateArr = bytes.slice(-4);
    const date = new Date(1000 * bytesToInt(dateArr, 0, dateArr.length));

    tempList.push(getPayloadData("time", date.toLocaleString(), groupID));

    return tempList;
}

function parse_port3_data(bytes:number[], groupID:string):{ [key: string]: any }[] {
    const tempList: { [key: string]: any }[] = []; 
    tempList.push(getPayloadData("low_power_percent", bytesToInt(bytes, 0, 1), groupID));
    tempList.push(getPayloadData("current_cicle_battery_total_consumer", bytesToInt(bytes, 1, 4), groupID));
    return tempList;
}

function parse_port4_data(bytes:number[], groupID:string,contain_vlotage:number):{ [key: string]: any }[] {
    const tempList: { [key: string]: any }[] = []; 
    const failedTypeCode = bytesToInt(bytes, 0, 1);
    const dataLen = bytesToInt(bytes, 1, 1);
    const dataBytes = bytes.slice(2);
    if (failedTypeCode == 0 || failedTypeCode == 1 || failedTypeCode == 2
        || failedTypeCode == 3 || failedTypeCode == 4 || failedTypeCode == 5) {
        const length = (contain_vlotage == 0 ? 7 : 9);
        const number = (dataLen / length);
        for (let i = 0; i < number; i++) {
            const item = {};
            const sub_bytes = dataBytes.slice((i * length), (i * length + length));
            const mac_address = bytesToHexString(sub_bytes, 0, 6);
            const rssi = (bytesToInt(sub_bytes, 6, 1) - 256).toString() + 'dBm';
            tempList.push(getPayloadData("mac_address" + i.toString(), mac_address, groupID));
            tempList.push(getPayloadData("rssi" + i.toString(), rssi, groupID));
            if (contain_vlotage) {
                const voltage = bytesToInt(sub_bytes, 7, 2).toString() + "mV";
                tempList.push(getPayloadData("voltage",voltage,groupID));
            }
        }
        tempList.push(getPayloadData("reasons_for_positioning_failure_code", failedTypeCode, groupID));
        tempList.push(getPayloadData("reasons_for_positioning_failure", posFailedReasonArray[failedTypeCode], groupID));
    } else {
        const data_list = [];
        tempList.push(getPayloadData("pdop", bytesToInt(dataBytes, 0, 1) / 10, groupID));
        var temp_sub = dataBytes.slice(1);
        for (let i = 0; i < dataLen; i++) {
            const stringValue = bytesToInt(temp_sub, (i * 1), 1);
            // data_list.push(stringValue);
            tempList.push(getPayloadData("satellite" + i.toString(), stringValue, groupID));
        }
        tempList.push(getPayloadData("reasons_for_positioning_failure_code", failedTypeCode, groupID));
        tempList.push(getPayloadData("reasons_for_positioning_failure", posFailedReasonArray[failedTypeCode], groupID));
    }
    return tempList;
}

function parse_port9_data(bytes:number[], groupID:string):{ [key: string]: any }[] {
    const tempList: { [key: string]: any }[] = []; 
    var index = 0;
    tempList.push(getPayloadData("work_time", bytesToInt(bytes, index, 4), groupID));
    index += 4;
    tempList.push(getPayloadData("adv_times", bytesToInt(bytes, index, 4), groupID));
    index += 4;
    index += 4;
    tempList.push(getPayloadData("axis_wakeup_time", bytesToInt(bytes, index, 4), groupID));
    index += 4;
    tempList.push(getPayloadData("ble_position_time", bytesToInt(bytes, index, 4), groupID));
    index += 4;
    index += 4;
    tempList.push(getPayloadData("gps_position_time", bytesToInt(bytes, index, 4), groupID));
    index += 4;
    tempList.push(getPayloadData("lora_send_times", bytesToInt(bytes, index, 4), groupID));
    index += 4;
    tempList.push(getPayloadData("lora_power", bytesToInt(bytes, index, 4), groupID));
    index += 4;
    tempList.push(getPayloadData("total_power", bytesToInt(bytes, index, 4), groupID));
    return tempList;
}

function parse_position_data(bytes: number[], contain_vlotage:number):{ [key: string]: string }[] {
    const length = (contain_vlotage == 0 ? 7 : 9);
    const number = (bytes.length / length);
    const mac_data: { [key: string]: string }[] = [];
    for (let i = 0; i < number; i++) {
        const sub_bytes = bytes.slice((i * length), (i * length + length));
        const mac_address = bytesToHexString(sub_bytes, 0, 6);
        const rssi = (bytesToInt(sub_bytes, 6, 1) - 256).toString + 'dBm';
        const data_dic = {
            'mac': mac_address,
            'rssi': rssi
        };
        if (contain_vlotage > 0) {
            const voltage = bytesToInt(sub_bytes, 7, 2).toString() + "mV";
            data_dic['voltage'] = voltage;
        }
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