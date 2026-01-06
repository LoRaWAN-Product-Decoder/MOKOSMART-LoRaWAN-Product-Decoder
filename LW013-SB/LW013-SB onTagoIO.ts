
const eventTypeList:string[] = [
    'no event triggered',
    'event1 triggered',
    'event2 triggered',
    'event3 triggered'
];

const powerOffTypeList:string[] = [
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
function Decoder(bytes: number[], fPort: number, groupID: string):{ [key: string]: any }[] {
    const payloadList: { [key: string]: any }[] = [];
    if (fPort < 0 || fPort > 6) {
        return payloadList;
    }
    payloadList.push(getPayloadData("port", fPort, groupID));
    payloadList.push(getPayloadData("hex_format_payload", bytesToHexString(bytes, 0, bytes.length), groupID));

    var index = 0;
    
    if (fPort == 6) {
        const work_time = bytesToInt(bytes, index, 4);
        payloadList.push(getPayloadData("work_time", work_time, groupID));
        index += 4;

        const adv_times = bytesToInt(bytes, index, 4);
        payloadList.push(getPayloadData("adv_times", adv_times, groupID));
        index += 4;

        const red_led_working_time = bytesToInt(bytes, index, 4);
        payloadList.push(getPayloadData("red_led_working_time", red_led_working_time, groupID));
        index += 4;

        const red_green_working_time = bytesToInt(bytes, index, 4);
        payloadList.push(getPayloadData("red_green_working_time", red_green_working_time, groupID));
        index += 4;

        const red_blue_working_time = bytesToInt(bytes, index, 4);
        payloadList.push(getPayloadData("red_blue_working_time", red_blue_working_time, groupID));
        index += 4;

        const buzzer_working_normal_time = bytesToInt(bytes, index, 4);
        payloadList.push(getPayloadData("buzzer_working_normal_time", buzzer_working_normal_time, groupID));
        index += 4;

        const buzzer_alarm_normal_time = bytesToInt(bytes, index, 4);
        payloadList.push(getPayloadData("buzzer_alarm_normal_time", buzzer_alarm_normal_time, groupID));
        index += 4;

        const event1_trigger_times = bytesToInt(bytes, index, 4);
        payloadList.push(getPayloadData("event1_trigger_times", event1_trigger_times, groupID));
        index += 4;

        const event1_report_payload_times = bytesToInt(bytes, index, 4);
        payloadList.push(getPayloadData("event1_report_payload_times", event1_report_payload_times, groupID));
        index += 4;

        const event2_trigger_times = bytesToInt(bytes, index, 4);
        payloadList.push(getPayloadData("event2_trigger_times", event2_trigger_times, groupID));
        index += 4;

        const event2_report_payload_times = bytesToInt(bytes, index, 4);
        payloadList.push(getPayloadData("event2_report_payload_times", event2_report_payload_times, groupID));
        index += 4;

        const event3_trigger_times = bytesToInt(bytes, index, 4);
        payloadList.push(getPayloadData("event3_trigger_times", event3_trigger_times, groupID));
        index += 4;

        const event3_report_payload_times = bytesToInt(bytes, index, 4);
        payloadList.push(getPayloadData("event3_report_payload_times", event3_report_payload_times, groupID));
        index += 4;

        const lora_send_times = bytesToInt(bytes, index, 4);
        payloadList.push(getPayloadData("lora_send_times", lora_send_times, groupID));
        index += 4;

        const lora_power = bytesToInt(bytes, index, 4);
        payloadList.push(getPayloadData("lora_power", lora_power, groupID));
        index += 4;

        const battery_consumption = bytesToInt(bytes, index, 4);
        payloadList.push(getPayloadData("battery_consumption", battery_consumption, groupID));

        return payloadList;
    }
    const date = new Date(1000 * bytesToInt(bytes, index, 4));
    payloadList.push(getPayloadData("time", date.toLocaleString(), groupID));
    index += 4;

    payloadList.push(getPayloadData("timezone", signedHexToInt(bytesToHexString(bytes, index, 1)), groupID));
    index += 1;

    var temperature = signedHexToInt(bytesToHexString(bytes, index, 1)).toString() + '°C';
    payloadList.push(getPayloadData("temperature", temperature, groupID));
    index += 1;

    const voltage = bytesToInt(bytes, index, 2).toString() + 'mV';
    payloadList.push(getPayloadData("voltage", voltage, groupID));
    index += 1;

    if (fPort == 1 && bytes.length == 11) {
        const major_firmware_version = ((bytes[index] >> 6) & 0x03).toString();
        const minor_firmware_version = ((bytes[index] >> 4) & 0x03).toString();
        const patch_firmware_version = (bytes[index] & 0x0f).toString();
        const firmware_version = 'V' + major_firmware_version + '.' + minor_firmware_version + '.' + patch_firmware_version;
        payloadList.push(getPayloadData("firmware_version", firmware_version, groupID));
        index += 1;

        const major_hardware_version = ((bytes[index] >> 4) & 0x0f).toString();
        const patch_hardware_version = (bytes[index] & 0x0f).toString();
        const hard_version = 'V' + major_hardware_version + '.' + patch_hardware_version;
        payloadList.push(getPayloadData("hardware_version", hard_version, groupID));
        index += 1;

        payloadList.push(getPayloadData("event_type", eventTypeList[bytes[index]], groupID));
    }else if (fPort == 2 && bytes.length == 9) {
        payloadList.push(getPayloadData("event_type", eventTypeList[bytes[index]], groupID));
    }else if (fPort == 4 && bytes.length == 9) {
        payloadList.push(getPayloadData("shutdown_type", powerOffTypeList[bytes[index]], groupID));
    }else if (fPort == 5 && bytes.length == 9) {
        const event_type = (bytes[index] == 0) ? 'downlink trigger' : '';
        payloadList.push(getPayloadData("event_type", event_type, groupID));
    }

    return payloadList;
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
    
  }
}

function hexToNumberArray(hexString: string): number[] {
    const buffer = Buffer.from(hexString, "hex");
    return Array.from(buffer, (byte) => byte);
}