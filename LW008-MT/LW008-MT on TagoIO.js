const payloadTypeArray = [
    "Heartbeat"
    , "Location Fixed"
    , "Location Failure"
    , "Shutdown"
    , "Shock"
    , "Man Down detection"
    , "Event Message"
    , "Battery Consumption"
    , "GPS Limit"];
const operationModeArray = ["Standby mode", "Periodic mode", "Timing mode", "Motion mode"];
const rebootReasonArray = ["Restart after power failure", "Bluetooth command request", "LoRaWAN command request", "Power on after normal power off"];
const positionTypeArray = [
    "WIFI positioning success (Customized Format)"
    , "WIFI positioning success (LoRa Cloud DAS Format, the positioning date would be upload to LoRa Cloud on Port199)"
    , "Bluetooth positioning success"
    , "GPS positioning success (LW008-MTP)"
    , "GPS positioning success (LW008-MT Customized Format)"
    , "GPS positioning success (LW008-MT LoRa Cloud DAS Format, the positioning date would be upload to LoRa Cloud on Port199)"
];
const posFailedReasonArray = [
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
const shutdownTypeArray = ["Bluetooth command to turn off the device", "LoRaWAN command to turn off the device", "Magnetic to turn off the device", "The battery run out"];
const eventTypeArray = [
    "Start of movement"
    , "In movement"
    , "End of movement"
    , "Uplink Payload triggered by downlink message"
    , "Notify of ephemeris update start"
    , "Notify of ephemeris update end"
];

function Decoder(bytes) {
    const fPort = port.value;
    const data = [];
    if (fPort == 0 || fPort == 10 || fPort == 11) {
        return;
    }
    const operationModeCode = bytes[0] & 0x03;
    // const operation_mode_code = operationModeCode;
    const operation_mode = operationModeArray[operationModeCode];
    addPayloadArray("operation_mode", operation_mode);

    const batteryLevelCode = bytes[0] & 0x04;
    // const battery_level_code = batteryLevelCode;
    const battery_level = batteryLevelCode == 0 ? "Normal" : "Low battery";
    addPayloadArray("battery_level", battery_level);

    const manDownStatusCode = bytes[0] & 0x08;
    // const mandown_status_code = manDownStatusCode;
    const mandown_status = manDownStatusCode == 0 ? "Not in idle" : "In idle";
    addPayloadArray("mandown_status", mandown_status);

    const motionStateSinceLastPaylaodCode = bytes[0] & 0x10;
    // const motion_state_since_last_paylaod_code = motionStateSinceLastPaylaodCode;
    const motion_state_since_last_paylaod = motionStateSinceLastPaylaodCode == 0 ? "No" : "Yes";
    addPayloadArray("motion_state_since_last_paylaod", motion_state_since_last_paylaod);


    const positioningTypeCode = bytes[0] & 0x20;
    // const positioning_type_code = positioningTypeCode;
    const positioning_type = positioningTypeCode == 0 ? "Normal" : "Downlink for position";
    addPayloadArray("positioning_type", positioning_type);

    const date = new Date();
    const timestamp = Math.trunc(date.getTime() / 1000);
    addPayloadArray("timestamp", timestamp);
    const offsetHours = Math.abs(Math.floor(date.getTimezoneOffset() / 60));
    addPayloadArray("time", parse_time(timestamp, offsetHours));
    addPayloadArray("timezone", timezone_decode(offsetHours * 2));

    if (fPort == 12 && bytes.length == 11) {
        parse_port12_data(bytes);
        return;
    }
    const temperature = signedHexToInt(bytesToHexString(bytes, 1, 1)) + '°C';
    addPayloadArray("temperature", temperature);

    addPayloadArray("ack", bytes[2] & 0x0f);
    if (fPort == 1 && bytes.length == 9) {
        addPayloadArray("payload_type", payloadTypeArray[0]);
        parse_port1_data(bytes.slice(3));
    } else if (fPort == 2 && bytes.length >= 7) {
        addPayloadArray("payload_type", payloadTypeArray[1]);
        parse_port2_data(bytes.slice(3));
    } else if (fPort == 4 && bytes.length >= 5) {
        addPayloadArray("payload_type", payloadTypeArray[2]);
        parse_port4_data(bytes.slice(3));
    } else if (fPort == 5 && bytes.length == 4) {
        addPayloadArray("payload_type", payloadTypeArray[3]);
        const shutdownTypeCode = bytesToInt(bytes, 3, 1);
        //addPayloadArray("shutdown_type_code",shutdownTypeCode);
        addPayloadArray("shutdown_type", shutdownTypeArray[shutdownTypeCode]);
    } else if (fPort == 6 && bytes.length == 5) {
        addPayloadArray("payload_type", payloadTypeArray[4]);
        addPayloadArray("number_of_shocks", bytesToInt(bytes, 3, 2));
    } else if (fPort == 7 && bytes.length == 5) {
        addPayloadArray("payload_type", payloadTypeArray[5]);
        addPayloadArray("total_idle_time", bytesToInt(bytes, 3, 2));
    } else if (fPort == 8 && bytes.length == 4) {
        addPayloadArray("payload_type", payloadTypeArray[6]);
        const eventTypeCode = bytesToInt(bytes, 3, 1);
        //addPayloadArray("event_type_code = eventTypeCode;
        addPayloadArray("event_type", eventTypeArray[eventTypeCode]);
    } else if (fPort == 9 && bytes.length == 43) {
        addPayloadArray("payload_type", payloadTypeArray[7]);
        parse_port9_data(bytes.slice(3));
    }
}
/*********************Port Parse*************************/
function parse_port1_data(bytes) {
    const rebootReasonCode = bytesToInt(bytes, 0, 1);
    // data.obj.reboot_reason_code = rebootReasonCode;
    addPayloadArray("reboot_reason", rebootReasonArray[rebootReasonCode]);
    const majorVersion = (bytes[1] >> 6) & 0x03;
    const minorVersion = (bytes[1] >> 4) & 0x03;
    const patchVersion = bytes[1] & 0x0f;
    const firmwareVersion = 'V' + majorVersion + '.' + minorVersion + '.' + patchVersion;
    addPayloadArray("firmware_version", firmwareVersion);
    const activityCount = bytesToInt(bytes, 2, 4);
    addPayloadArray("activity_count", activityCount);
}

function parse_port2_data(bytes) {
    const age = bytesToInt(bytes, 0, 2);
    addPayloadArray("age", age + "s");
    const positionTypeCode = bytesToInt(bytes, 2, 1);
    addPayloadArray("position_type_code", positionTypeCode);
    addPayloadArray("position_success_type", positionTypeArray[positionTypeCode]);
    if (positionTypeCode < 5) {
        const sub_bytes = bytes.slice(4);
        if (positionTypeCode == 0 || positionTypeCode == 2) {
            const positionData = parse_position_data(sub_bytes, positionTypeCode);
            // obj.location_fixed_data_str = JSON.stringify(positionData);
            addPayloadArray("mac_data", positionData);
        } else if (positionTypeCode == 3) {
            const latitude = Number(signedHexToInt(bytesToHexString(sub_bytes, 0, 4)) * 0.0000001).toFixed(7);
            const longitude = Number(signedHexToInt(bytesToHexString(sub_bytes, 4, 4)) * 0.0000001).toFixed(7);
            const pdop = Number(bytesToInt(sub_bytes, 8, 1) * 0.1).toFixed(1);
            addPayloadArray("latitude", latitude);
            addPayloadArray("longitude", longitude);
            addPayloadArray("pdop", pdop);
        } else if (positionTypeCode == 4) {
            addPayloadArray("bytes", sub_bytes);
        }
    } else {
        addPayloadArray("location_fixed_data", "Latitude and longitude data will return by the LoRa Cloud server");
    }
}

function parse_port4_data(bytes) {
    const failedTypeCode = bytesToInt(bytes, 0, 1);
    const dataLen = bytesToInt(bytes, 1, 1);
    const dataBytes = bytes.slice(2);
    if (failedTypeCode == 0 || failedTypeCode == 1 || failedTypeCode == 2
        || failedTypeCode == 3 || failedTypeCode == 4 || failedTypeCode == 5) {
        const number = (dataLen / 7);
        for (let i = 0; i < number; i++) {
            const item = {};
            const sub_bytes = dataBytes.slice((i * 7), (i * 7 + 8));
            const mac_address = bytesToHexString(sub_bytes, 0, 6);
            const rssi = bytesToInt(sub_bytes, 6, 1) - 256 + 'dBm';
            addPayloadArray("mac_address" + i, mac_address);
            addPayloadArray("rssi" + i, rssi);
        }
        addPayloadArray("reasons_for_positioning_failure_code", failedTypeCode);
        addPayloadArray("reasons_for_positioning_failure", posFailedReasonArray[failedTypeCode]);
    } else {
        const data_list = [];
        for (let i = 0; i < dataLen; i++) {
            const stringValue = bytesToHexString(dataBytes, (i * 1), 1);
            // data_list.push(stringValue);
            addPayloadArray("stringValue" + i, stringValue);
        }
        addPayloadArray("reasons_for_positioning_failure_code", failedTypeCode);
        addPayloadArray("reasons_for_positioning_failure", posFailedReasonArray[failedTypeCode]);
    }
}

function parse_port9_data(bytes) {
    addPayloadArray("work_times", bytesToInt(bytes, 0, 4));
    addPayloadArray("adv_times", bytesToInt(bytes, 4, 4));
    addPayloadArray("flash_write_times", bytesToInt(bytes, 8, 4));
    addPayloadArray("axis_wakeup_times", bytesToInt(bytes, 12, 4));
    addPayloadArray("ble_position_times", bytesToInt(bytes, 16, 4));
    addPayloadArray("wifi_position_times", bytesToInt(bytes, 20, 4));
    addPayloadArray("gps_position_times", bytesToInt(bytes, 24, 4));
    addPayloadArray("lora_send_times", bytesToInt(bytes, 28, 4));
    addPayloadArray("lora_power", bytesToInt(bytes, 32, 4));
    addPayloadArray("battery_value", bytesToInt(bytes, 36, 4));
}

function parse_port12_data(bytes) {
    addPayloadArray("ack", bytes[1] & 0x0f);
    addPayloadArray("battery_value", ((bytes[1] & 0xf0) * 0.1) + "V");
    addPayloadArray("latitude", Number(signedHexToInt(bytesToHexString(bytes, 2, 4)) * 0.0000001).toFixed(7)
        + '°');
    addPayloadArray("longitude", Number(signedHexToInt(bytesToHexString(bytes, 6, 4)) * 0.0000001).toFixed(7)
        + '°');
    addPayloadArray("pdop", bytesToInt(bytes, 10, 1));
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

String.prototype.format = function () {
    if (arguments.length == 0)
        return this;
    for (let s = this, i = 0; i < arguments.length; i++)
        s = s.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i]);
    return s;
};

// convert a byte value to signed int8
function int8(byte) {
    const sign = byte & (1 << 7);
    if (sign) {
        return 0xFFFFFF00 | byte;
    }
    return byte;
}

function addPayloadArray(variable, value) {
    return payload.push({ variable: variable, value: value, group: String(payload_raw.group)});
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