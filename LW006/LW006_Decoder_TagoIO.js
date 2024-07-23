const turnOffMode = ["Bluetooth", "LoRa", "Button", "Low Battery"];
const deviceMode = ["Standby Mode", "Timing Mode", "Periodic Mode", "Motion Mode On Stationary", "Motion Mode On Start", "Motion Mode In Trip", "Motion Mode On End"];
const deviceStatus = ["No auxiliary", "Man Down", "Downlink", "Alert", "SOS"];
const lowPower = ["10%", "20%", "30%", "40%", "50%", "60%"];
const eventType = ["Motion On Start", "Motion In Trip", "Motion On End", "Man Down Start", "Man Down End", "SOS Start", "SOS End", "Alert Start", "Alert End", "Ephemeris Start", "Ephemeris End", "Downlink Report"];
const posType = ["Working Mode", "Man Down", "Downlink", "Alert", "SOS"];
const posDataSign = ["WIFI Pos Success", "BLE Pos Success", "LR1110 GPS Pos Success", "L76 Pos Success", "WIFI Pos Success(No Data)", "LR1110 GPS Pos Success(No Data)"];
const fixFailedReason = [
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
function Decoder(bytes) {
    const fPort = port.value;
    const data = {};
    data.port = fPort;
    data.hex_format_payload = bytesToHexString(bytes, 0, bytes.length);

    if (fPort == 1 || fPort == 2 || fPort == 3 || fPort == 4
        || fPort == 5 || fPort == 8 || fPort == 9) {
        const chargingstatus = bytes[0] & 0x80 ;
        const charging_status = chargingstatus == 1 ? "charging" : "no charging";
        addPayloadArray("charging status",charging_status);
        const batt_level = (bytes[0] & 0x7F) + "%";
        addPayloadArray("battery_level",batt_level);
    }
    if (fPort == 1) {
        // Device info
        const date = new Date();
        const timestamp = Math.trunc(date.getTime() / 1000);
        const offsetHours = Math.abs(Math.floor(date.getTimezoneOffset() / 60));
        addPayloadArray("timestamp",timestamp);
        addPayloadArray("time",parse_time(timestamp, offsetHours));
        addPayloadArray("timezone",timezone_decode(offsetHours * 2));
        const temp = bytes[1];
        if (temp > 0x80){
            const temperature = "-" + (0x100 - temp) + "°C";
            addPayloadArray("temperature",temperature);
        }
        else{
            const temperature = temp + "°C";
            addPayloadArray("temperature",temperature);
        const firmware_ver_major = (bytes[2] >> 6) & 0x03;
        const firmware_ver_minor = (bytes[2] >> 4) & 0x03;
        const firmware_ver_patch = bytes[2] & 0x0f;
        const firmware_version = "V" + firmware_ver_major + "." + firmware_ver_minor + "." + firmware_ver_patch;
        addPayloadArray("firmware_version",firmware_version);
        const hardware_ver_major = (bytes[3] >> 4) & 0x0f;
        const hardware_ver_patch = bytes[3] & 0x0f;
        const hardware_version = "V" + hardware_ver_major + "." + hardware_ver_patch;
        addPayloadArray("hardware_version",hardware_version);
        const device_mode = deviceMode[bytes[4]];
        addPayloadArray("device_mode",device_mode);
        const device_status_code = bytes[5];
        addPayloadArray("device_status_code",device_status_code);
        const device_status = deviceStatus[device_status_code];
        addPayloadArray("device_status",device_status);
        const vibration_status = bytes[6] > 0 ? "Abnormal" : "Normal";
        addPayloadArray("viberation_status",vibration_status);
        }

    } else if (fPort == 2 || fPort == 3 || fPort == 4) {
        // 2:Turn off info;3:Heartbeat;4:LowPower;
        const temp = bytes[1];
        if (temp > 0x80){
            const temperature = "-" + (0x100 - temp) + "°C";
            addPayloadArray("temperature",temperature);
        }
        else{
            const temperature = temp + "°C";
            addPayloadArray("temperature",temperature);
        addPayloadArray("time", parse_time(bytesToInt(bytes, 2, 4), bytes[6] * 0.5));
        addPayloadArray("timestamp",bytesToInt(bytes, 2, 4));
        addPayloadArray("timezone",timezone_decode(bytes[6]));
        addPayloadArray("device_mode",deviceMode[bytes[7]]);
        addPayloadArray("device_status",deviceStatus[bytes[8]]);
        }
        if (fPort == 2) {
            addPayloadArray("turn_off_mode",turnOffMode[bytes[9]]);
        } else if (fPort == 4) {
            addPayloadArray("low_power_prompt", lowPower[bytes[9]]);
        }
        // data.batt_v = bytesToInt(bytes, 1, 2) + "mV";
    } else if (fPort == 5) {
        // Event info
        addPayloadArray("payload_type", 'Event info');
        addPayloadArray("time", parse_time(bytesToInt(bytes, 1, 4), bytes[5] * 0.5));
        addPayloadArray("timestamp" , bytesToInt(bytes, 1, 4));
        addPayloadArray("timezone" , timezone_decode(bytes[5]));
        addPayloadArray("event_type_code", bytes[6] & 0xFF);
        addPayloadArray("event_type", eventType[bytes[6]]);
    } else if (fPort == 6) {
        // L76_GPS data
        addPayloadArray("pos_type" , posType[bytesToInt(bytes, 0, 2) >> 12]);
        addPayloadArray("age" . bytesToInt(bytes, 0, 2) + "s");
        const latitude = Number(signedHexToInt(bytesToHexString(bytes, 2, 4)) * 0.0000001).toFixed(7) + '°';
        const longitude = Number(signedHexToInt(bytesToHexString(bytes, 6, 4)) * 0.0000001).toFixed(7) + '°';
        const pdop = (bytes[10] & 0xFF) * 0.1;
        addPayloadArray("latitude", latitude);
        addPayloadArray("longitude", longitude);
        addPayloadArray("pdop" , pdop);
    } else if (fPort == 7) {
        // Saved data
        data.length = bytes[0] & 0xFF;
        const length = data.length;
        if (length == 2) {
            addPayloadArray("packet_sum" , bytesToInt(bytes, 1, 2));
        } else {
            addPayloadArray("time" , parse_time(bytesToInt(bytes, 1, 4), bytes[5] * 0.5));
            addPayloadArray("timestamp" , bytesToInt(bytes, 1, 4));
            addPayloadArray("timezone" , timezone_decode(bytes[5]));
            addPayloadArray("data_port" , bytes[6] & 0xFF);
            const data_len = length - 6;
            addPayloadArray("rawData" , bytesToHexString(bytes, 7, data_len).toUpperCase());
        }
    } else if (fPort == 8) {
        const date = new Date();
        const timestamp = Math.trunc(date.getTime() / 1000);
        const offsetHours = Math.abs(Math.floor(date.getTimezoneOffset() / 60));
        addPayloadArray("timestamp" , timestamp);
        addPayloadArray("time" , parse_time(timestamp, offsetHours));
        addPayloadArray("timezone" , timezone_decode(offsetHours * 2));
        // Pos Success
        // data.payload_type = 'Pos Success';
        addPayloadArray("age" , bytesToInt(bytes, 1, 2) + "s");
        addPayloadArray("pos_type" , posType[bytes[3] >> 4]);
        const pos_data_sign = bytes[3] & 0x0F;
        addPayloadArray("payload_type" , posDataSign[pos_data_sign]);
        addPayloadArray("pos_data_sign_code" , pos_data_sign);
        addPayloadArray("device_mode" , deviceMode[bytes[4] >> 4]);
        //addPayloadArray("device_status_code" , bytes[4] & 0x0f);
        addPayloadArray("device_status" , deviceStatus[bytes[4] & 0x0f]);
        const pos_data_length = bytes[5] & 0xFF;
        //data.pos_data_length = pos_data_length;
        if ((pos_data_sign == 0 || pos_data_sign == 1) && pos_data_length > 0) {
            // WIFI BLE
            const datas = [];
            const count = pos_data_length / 7;
            const index = 6;
            for (let i = 0; i < count; i++) {
                const item = {};
                item.rssi = bytes[index++] - 256 + "dBm";
                item.mac = bytesToHexString(bytes, index, 6).toLowerCase();
                index += 6;
                addPayloadArray("mac_address"+i , item.mac);
                addPayloadArray("rssi"+i , item.rssi);
            }
        }
        if (pos_data_sign == 3 && pos_data_length > 0) {
            // L76 GPS
            const datas = [];
            const count = pos_data_length / 9;
            const index = 6;
            // for (let i = 0; i < count; i++) {
            // const item = {};
            const latitude = Number(signedHexToInt(bytesToHexString(bytes, index, 4)) * 0.0000001).toFixed(7) + '°';
            index += 4;
            const longitude = Number(signedHexToInt(bytesToHexString(bytes, index, 4)) * 0.0000001).toFixed(7) + '°';
            index += 4;
            const pdop = Number(bytes[index++] & 0xFF * 0.1).toFixed(1);
            // item.latitude = latitude;
            // item.longitude = longitude;
            // item.pdop = pdop;
            // datas.push(item);
            // }
            // data.pos_data = datas;
            addPayloadArray("latitude" , latitude);
            addPayloadArray("longitude" , longitude);
            addPayloadArray("pdop" , pdop);
        }
    } else if (fPort == 9) {
        const date = new Date();
        const timestamp = Math.trunc(date.getTime() / 1000);
        const offsetHours = Math.abs(Math.floor(date.getTimezoneOffset() / 60));
        addPayloadArray("timestep" , timestamp);
        addPayloadArray("time" , parse_time(timestamp, offsetHours));
        addPayloadArray("timezone" , timezone_decode(offsetHours * 2));
        // Pos Failed
        addPayloadArray("payload_type" , 'Pos Failed');
        addPayloadArray("pos_type" , posType[bytes[1]]);
        addPayloadArray("device_mode" , deviceMode[bytes[2]]);
        addPayloadArray("device_status_code" , bytes[3]);
        const device_status_code = bytes[3];
        addPayloadArray("device_status" , deviceStatus[device_status_code]);
        const pos_data_sign = bytes[4] & 0x0F;
        //data.pos_data_sign = pos_data_sign;
        addPayloadArray("failed_reason" , fixFailedReason[pos_data_sign]);
        const pos_data_length = bytes[5] & 0xFF;
        //data.pos_data_length = pos_data_length;
        if (pos_data_length % 7 == 0) {
            // WIFI/BLE Failed
            const datas = [];
            const count = pos_data_length / 7;
            const index = 6;
            for (let i = 0; i < count; i++) {
                const item = {};
                item.rssi = bytes[index++];
                item.mac = bytesToHexString(bytes, index, 6).toLowerCase();
                index += 6;
                addPayloadArray("mac_address"+i , item.mac);
                addPayloadArray("rssi"+i , item.rssi);
            }
            //data.pos_data = datas;
        } else if (pos_data_length == 5) {
            // L76 GPS Failed
            const pdop = Number(bytes[6] & 0xFF * 0.1).toFixed(1);
            addPayloadArray("pdop" , pdop);
            if (pdop == 0xFF) {
                addPayloadArray("pdop" ,'unknow');
            }
            const datas = [];
            const index = 7;
            for (let i = 0; i < 4; i++) {
                const item = bytesToHexString(bytes, index++, 1).toLowerCase();
                datas.push(item);
            }
            addPayloadArray("pos_data" , datas);
        } else if (pos_data_length == 4) {
            // LR1110 GPS Failed
            const datas = [];
            const index = 6;
            for (let i = 0; i < 4; i++) {
                const item = bytesToHexString(bytes, index++, 1).toLowerCase();
                datas.push(item);
            }
            addPayloadArray("pos_data" , datas);
        }
    }
    //dev_info.data = data;
    //return dev_info;
}


function bytesToHexString(bytes, start, len) {
    const char = [];
    for (let i = 0; i < len; i++) {
        const data = bytes[start + i].toString(16);
        const dataHexStr = ("0x" + data) < 0x10 ? ("0" + data) : data;
        char.push(dataHexStr);
    }
    return char.join("");
}

function bytesToString(bytes, start, len) {
    const char = [];
    for (let i = 0; i < len; i++) {
        char.push(String.fromCharCode(bytes[start + i]));
    }
    return char.join("");
}

function bytesToInt(bytes, start, len) {
    let value = 0;
    for (let i = 0; i < len; i++) {
        const m = ((len - 1) - i) * 8;
        value = value | bytes[start + i] << m;
    }
    // const value = ((bytes[start] << 24) | (bytes[start + 1] << 16) | (bytes[start + 2] << 8) | (bytes[start + 3]));
    return value;
}

function timezone_decode(tz) {
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

function formatNumber(number) {
    return number < 10 ? "0" + number : number;
}

String.prototype.format = function () {
    if (arguments.length == 0)
        return this;
    for (let s = this, i = 0; i < arguments.length; i++)
        s = s.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i]);
    return s;
};

function signedHexToInt(hexStr) {
    let twoStr = parseInt(hexStr, 16).toString(2); // 将十六转十进制，再转2进制
    const bitNum = hexStr.length * 4; // 1个字节 = 8bit ，0xff 一个 "f"就是4位
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
    let twoStr_unsign = "";
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


function getData(hex) {
    const length = hex.length;
    const datas = [];
    for (let i = 0; i < length; i += 2) {
        const start = i;
        const end = i + 2;
        const data = parseInt("0x" + hex.substring(start, end));
        datas.push(data);
    }
    return datas;

}
function addPayloadArray(variable, value) {
    return payload.push({ variable: variable, value: value, group: String(payload_raw.group), serie: String(payload_raw.serie), });
}
const payload_raw = payload.find((x) => x.variable === "payload");
const port = payload.find((x) => x.variable === "fport");
if (payload_raw && port) {
    try {
        // Convert the data from Hex to Javascript Buffer.
        const buffer = Buffer.from(payload_raw.value, "hex");
        Decoder(buffer);
    } catch (e) {
        // Print the error to the Live Inspector.
        console.error(e);
        // Return the variable parse_error for debugging.
        payload = [{ variable: "parse_error", value: e.message }];
    }
}