const turnOffMode: string[] = ["Bluetooth", "LoRa", "Button", "Low Battery"];
const deviceMode: string[] = ["Standby Mode", "Timing Mode", "Periodic Mode", "Motion Mode On Stationary", "Motion Mode On Start", "Motion Mode In Trip", "Motion Mode On End"];
const deviceStatus: string[] = ["No auxiliary", "Man Down", "Downlink", "Alert", "SOS"];
const lowPower: string[] = ["10%", "20%", "30%", "40%", "50%", "60%"];
const eventType: string[] = ["Motion On Start", "Motion In Trip", "Motion On End", "Man Down Start", "Man Down End", "SOS Start", "SOS End", "Alert Start", "Alert End", "Ephemeris Start", "Ephemeris End", "Downlink Report"];
const posType: string[] = ["Working Mode", "Man Down", "Downlink", "Alert", "SOS"];
const posDataSign: string[] = ["WIFI Pos Success", "BLE Pos Success", "LR1110 GPS Pos Success", "L76 Pos Success", "WIFI Pos Success(No Data)", "LR1110 GPS Pos Success(No Data)"];
const fixFailedReason: string[] = [
    "WIFI positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)"
    , "WIFI positioning strategies timeout (Please increase the WIFI positioning timeout via MKLoRa app)"
    , "Bluetooth broadcasting in progress causes WIFI location failure (Please reduce the Bluetooth broadcast timeout or avoid Bluetooth positioning when Bluetooth broadcasting in process via MKLoRa app)"
    , "Bluetooth positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)"
    , "Bluetooth positioning strategies timeout (Please increase the Bluetooth positioning timeout via MKLoRa app)"
    , "Bluetooth broadcasting in progress (Please reduce the Bluetooth broadcast timeout or avoid Bluetooth positioning when Bluetooth broadcasting in process via MKLoRa app)"
    , "GPS positioning timeout (Pls increase GPS positioning timeout via MKLoRa app)"
    , "GPS positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)"
    , "GPS aiding positioning timeout (Please adjust GPS autonomous latitude and autonomous longitude)"
    , "The ephemeris of GPS aiding positioning is too old, need to be updated"
    , "PDOP limit (Please increase the POP value via MKLoRa app)"
    , "Interrupted positioning at start of movement (the movement ends too quickly, resulting in not enough time to complete the positioning)"
    , "Interrupted positioning at end of movement (the movement restarted too quickly, resulting in not enough time to complete the positioning)"
    , "Interrupted by Man Down Detection State"
    , "Interrupted by Downlink for Position"
    , "Interrupted by Alarm Function"
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
    const payloadList: { [key: string]: any }[] = [];
    if (fPort == 1 || fPort == 2 || fPort == 3 || fPort == 4
        || fPort == 5 || fPort == 8 || fPort == 9) {
        const chargingstatus = bytes[0] & 0x80;
        const charging_status = chargingstatus == 1 ? "charging" : "no charging";
        payloadList.push(getPayloadData("charging status", charging_status, groupID));

        const batt_level = (bytes[0] & 0x7F).toString() + "%";
        payloadList.push(getPayloadData("battery_level", batt_level, groupID));
    }
    if (fPort == 1) {
        // Device info
        const date = new Date();
        const timestamp = Math.trunc(date.getTime() / 1000);
        const offsetHours = Math.abs(Math.floor(date.getTimezoneOffset() / 60));
        payloadList.push(getPayloadData("timestamp", timestamp, groupID));
        payloadList.push(getPayloadData("time", parse_time(timestamp, offsetHours), groupID));
        payloadList.push(getPayloadData("timezone", timezone_decode(offsetHours * 2), groupID));
        const temp = bytes[1];
        if (temp > 0x80) {
            const temperature = "-" + (0x100 - temp).toString() + "°C";
            payloadList.push(getPayloadData("temperature", temperature, groupID));
        }
        else {
            const temperature = temp.toString() + "°C";
            payloadList.push(getPayloadData("temperature", temperature, groupID));
            const firmware_ver_major = (bytes[2] >> 6) & 0x03;
            const firmware_ver_minor = (bytes[2] >> 4) & 0x03;
            const firmware_ver_patch = bytes[2] & 0x0f;
            const firmware_version = "V" + firmware_ver_major.toString() + "." + firmware_ver_minor.toString() + "." + firmware_ver_patch.toString();
            payloadList.push(getPayloadData("firmware_version", firmware_version, groupID));
            const hardware_ver_major = (bytes[3] >> 4) & 0x0f;
            const hardware_ver_patch = bytes[3] & 0x0f;
            const hardware_version = "V" + hardware_ver_major.toString() + "." + hardware_ver_patch.toString();
            payloadList.push(getPayloadData("hardware_version", hardware_version, groupID));
            const device_mode = deviceMode[bytes[4]];
            payloadList.push(getPayloadData("device_mode", device_mode, groupID));
            const device_status_code = bytes[5];
            payloadList.push(getPayloadData("device_status_code", device_status_code, groupID));
            const device_status = deviceStatus[device_status_code];
            payloadList.push(getPayloadData("device_status", device_status, groupID));
            const vibration_status = bytes[6] > 0 ? "Abnormal" : "Normal";
            payloadList.push(getPayloadData("viberation_status", vibration_status, groupID));
        }

        return payloadList;

    } 
    if (fPort == 2 || fPort == 3 || fPort == 4) {
        // 2:Turn off info;3:Heartbeat;4:LowPower;
        const temp = bytes[1];
        if (temp > 0x80) {
            const temperature = "-" + (0x100 - temp).toString() + "°C";
            payloadList.push(getPayloadData("temperature", temperature, groupID));
        }
        else {
            const temperature = temp.toString() + "°C";
            payloadList.push(getPayloadData("temperature", temperature, groupID));
            payloadList.push(getPayloadData("time", parse_time(bytesToInt(bytes, 2, 4), bytes[6] * 0.5), groupID));
            payloadList.push(getPayloadData("timestamp", bytesToInt(bytes, 2, 4), groupID));
            payloadList.push(getPayloadData("timezone", timezone_decode(bytes[6]), groupID));
            payloadList.push(getPayloadData("device_mode", deviceMode[bytes[7]], groupID));
            payloadList.push(getPayloadData("device_status", deviceStatus[bytes[8]], groupID));
        }
        if (fPort == 2) {
            payloadList.push(getPayloadData("turn_off_mode", turnOffMode[bytes[9]], groupID));
        } else if (fPort == 4) {
            payloadList.push(getPayloadData("low_power_prompt", lowPower[bytes[9]], groupID));
        }
        
        return payloadList;
    } 
    if (fPort == 5) {
        // Event info
        payloadList.push(getPayloadData("payload_type", 'Event info', groupID));
        payloadList.push(getPayloadData("time", parse_time(bytesToInt(bytes, 1, 4), bytes[5] * 0.5), groupID));
        payloadList.push(getPayloadData("timestamp", bytesToInt(bytes, 1, 4), groupID));
        payloadList.push(getPayloadData("timezone", timezone_decode(bytes[5]), groupID));
        payloadList.push(getPayloadData("event_type_code", bytes[6] & 0xFF, groupID));
        payloadList.push(getPayloadData("event_type", eventType[bytes[6]], groupID));

        return payloadList;
    } 
    if (fPort == 6) {
        // L76_GPS data
        payloadList.push(getPayloadData("pos_type", posType[bytesToInt(bytes, 0, 2) >> 12], groupID));
        payloadList.push(getPayloadData("age", bytesToInt(bytes, 0, 2).toString() + "s", groupID));
        const latitude = Number(signedHexToInt(bytesToHexString(bytes, 2, 4)) * 0.0000001).toFixed(7) + '°';
        const longitude = Number(signedHexToInt(bytesToHexString(bytes, 6, 4)) * 0.0000001).toFixed(7) + '°';
        const pdop = (bytes[10] & 0xFF) * 0.1;
        payloadList.push(getPayloadData("latitude", latitude, groupID));
        payloadList.push(getPayloadData("longitude", longitude, groupID));
        payloadList.push(getPayloadData("pdop", pdop, groupID));

        return payloadList;
    } 
    if (fPort == 7) {
        // Saved data
        const length = bytes[0] & 0xFF;
        if (length == 2) {
            payloadList.push(getPayloadData("packet_sum", bytesToInt(bytes, 1, 2), groupID));
        } else {
            payloadList.push(getPayloadData("time", parse_time(bytesToInt(bytes, 1, 4), bytes[5] * 0.5), groupID));
            payloadList.push(getPayloadData("timestamp", bytesToInt(bytes, 1, 4), groupID));
            payloadList.push(getPayloadData("timezone", timezone_decode(bytes[5]), groupID));
            payloadList.push(getPayloadData("data_port", bytes[6] & 0xFF, groupID));
            const data_len = length - 6;
            payloadList.push(getPayloadData("rawData", bytesToHexString(bytes, 7, data_len).toUpperCase(), groupID));
        }

        return payloadList;
    } 
    if (fPort == 8) {
        const date = new Date();
        const timestamp = Math.trunc(date.getTime() / 1000);
        const offsetHours = Math.abs(Math.floor(date.getTimezoneOffset() / 60));
        payloadList.push(getPayloadData("timestamp", timestamp, groupID));
        payloadList.push(getPayloadData("time", parse_time(timestamp, offsetHours), groupID));
        payloadList.push(getPayloadData("timezone", timezone_decode(offsetHours * 2), groupID));
        // Pos Success
        // data.payload_type = 'Pos Success';
        payloadList.push(getPayloadData("age", bytesToInt(bytes, 1, 2).toString() + "s", groupID));
        payloadList.push(getPayloadData("pos_type", posType[bytes[3] >> 4], groupID));
        const pos_data_sign = bytes[3] & 0x0F;
        payloadList.push(getPayloadData("payload_type", posDataSign[pos_data_sign], groupID));
        payloadList.push(getPayloadData("pos_data_sign_code", pos_data_sign, groupID));
        payloadList.push(getPayloadData("device_mode", deviceMode[bytes[4] >> 4], groupID));
        //addPayloadArray("device_status_code" , bytes[4] & 0x0f);
        payloadList.push(getPayloadData("device_status", deviceStatus[bytes[4] & 0x0f], groupID));
        const pos_data_length = bytes[5] & 0xFF;
        //data.pos_data_length = pos_data_length;
        if ((pos_data_sign == 0 || pos_data_sign == 1) && pos_data_length > 0) {
            // WIFI BLE
            const datas = [];
            const count = pos_data_length / 7;
            let index = 6;
            for (let i = 0; i < count; i++) {
                const item = {};
                item['rssi'] = (bytes[index++] - 256).toString() + "dBm";
                item['mac'] = bytesToHexString(bytes, index, 6).toLowerCase();
                index += 6;
                payloadList.push(getPayloadData("mac_address" + i.toString(), item['mac'], groupID));
                payloadList.push(getPayloadData("rssi" + i.toString(), item['rssi'], groupID));
            }
        }
        if (pos_data_sign == 3 && pos_data_length > 0) {
            // L76 GPS
            const datas = [];
            const count = pos_data_length / 9;
            let index = 6;
            const latitude = Number(signedHexToInt(bytesToHexString(bytes, index, 4)) * 0.0000001).toFixed(7) + '°';
            index += 4;
            const longitude = Number(signedHexToInt(bytesToHexString(bytes, index, 4)) * 0.0000001).toFixed(7) + '°';
            index += 4;
            const pdop = Number(bytes[index++] & 0xFF * 0.1).toFixed(1);
            payloadList.push(getPayloadData("latitude", latitude, groupID));
            payloadList.push(getPayloadData("longitude", longitude, groupID));
            payloadList.push(getPayloadData("pdop", pdop, groupID));
        }

        return payloadList;
    } 
    if (fPort == 9) {
        const date = new Date();
        const timestamp = Math.trunc(date.getTime() / 1000);
        const offsetHours = Math.abs(Math.floor(date.getTimezoneOffset() / 60));
        payloadList.push(getPayloadData("timestep", timestamp, groupID));
        payloadList.push(getPayloadData("time", parse_time(timestamp, offsetHours), groupID));
        payloadList.push(getPayloadData("timezone", timezone_decode(offsetHours * 2), groupID));
        // Pos Failed
        payloadList.push(getPayloadData("payload_type", 'Pos Failed', groupID));
        payloadList.push(getPayloadData("pos_type", posType[bytes[1]], groupID));
        payloadList.push(getPayloadData("device_mode", deviceMode[bytes[2]], groupID));
        payloadList.push(getPayloadData("device_status_code", bytes[3], groupID));
        const device_status_code = bytes[3];
        payloadList.push(getPayloadData("device_status", deviceStatus[device_status_code], groupID));
        const pos_data_sign = bytes[4] & 0x0F;
        //data.pos_data_sign = pos_data_sign;
        payloadList.push(getPayloadData("failed_reason", fixFailedReason[pos_data_sign], groupID));
        const pos_data_length = bytes[5] & 0xFF;
        //data.pos_data_length = pos_data_length;
        if (pos_data_length % 7 == 0) {
            // WIFI/BLE Failed
            const datas = [];
            const count = pos_data_length / 7;
            let index = 6;
            for (let i = 0; i < count; i++) {
                const item = {};
                item['rssi'] = (bytes[index++] - 256).toString() + "dBm";
                item['mac'] = bytesToHexString(bytes, index, 6).toLowerCase();
                index += 6;
                payloadList.push(getPayloadData("mac_address" + i.toString(), item['mac'], groupID));
                payloadList.push(getPayloadData("rssi" + i.toString(), item['rssi'], groupID));
            }
            //data.pos_data = datas;
        } else if (pos_data_length == 5) {
            // L76 GPS Failed
            const pdop = Number(bytes[6] & 0xFF * 0.1).toFixed(1);
            payloadList.push(getPayloadData("pdop", pdop, groupID));
            if (parseFloat(pdop) == 0xFF) {
                payloadList.push(getPayloadData("pdop", 'unknow', groupID));
            }
            const datas: string[] = [];
            let index = 7;
            for (let i = 0; i < 4; i++) {
                const item = bytesToHexString(bytes, index++, 1).toLowerCase();
                datas.push(item);
            }
            payloadList.push(getPayloadData("pos_data", datas, groupID));
        } else if (pos_data_length == 4) {
            // LR1110 GPS Failed
            const datas: string[] = [];
            let index = 6;
            for (let i = 0; i < 4; i++) {
                const item = bytesToHexString(bytes, index++, 1).toLowerCase();
                datas.push(item);
            }
            payloadList.push(getPayloadData("pos_data", datas, groupID));
        }
        return payloadList;
    }
    return [];
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

const payload_raw = payload.find((x) => x.variable === "payload");
const port = payload.find((x) => x.variable === "fport");
if (payload_raw && port) {
    try {
        // Convert the data from Hex to Javascript Buffer.
        const buffer = hexToNumberArray(payload_raw.value as string);
        // payload.push(...Decoder(buffer, port.value, payload_raw.group));
        payload.concat(Decoder(buffer, port.value, payload_raw.group))
    } catch (e) {
        // Print the error to the Live Inspector.
        console.error(e);
        // Return the variable parse_error for debugging.
        // payload = [{ variable: "parse_error", value: e.message }];
    }
}

function hexToNumberArray(hexString: string): number[] {
    const buffer = Buffer.from(hexString, "hex");
    return Array.from(buffer, (byte) => byte);
}