const operationModeArray:string[] = ["Standby mode"
    , "Timing mode"
    , "Periodic mode"
    , "Stationary in motion mode"
    , "Start of movement in motion mode"
    ,"Movement in motion mode"
    ,"End of movement in motion mode"
    ,"Timing + period mode"];
const deviceStatusArray:string[] = ["No auxiliary"
    ,"Man down"
    ,"Downlink for positioning"
    ,"Alert alarm"
    ,"SOS alarm"];
const shutdownTypeArray:string[] = ["Bluetooth command to turn off the device"
    , "LoRaWAN command to turn off the device"
    , "Magnetic to turn off the device"
    , "The battery run out"];
const lowPowerPercentArray:string[] = ["10%","20%","30%","40%","50%","60%"];
const eventTypeArray:string[] = ["Start movement"
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
const positionTypeArray:string[] = [
    "Positioning in working mode"
    , "ManDown positioning"
    , "Downlink for positioning"
    , "Alert positioning"
    , "SOS positioning"
];
const assistanceTypeArray:string[] = ["No auxiliary","Man down","Downlink for positioning","Alert alarm","SOS alarm"];


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
    const payloadList: { [key: string]: any }[] = [];
    if (fPort < 0 || fPort == 10 || fPort == 7 || fPort > 12) {
        return payloadList;
    }

    payloadList.push(getPayloadData("port", fPort, groupID));
    payloadList.push(getPayloadData("hex_format_payload", bytesToHexString(bytes, 0, bytes.length), groupID));

    if (fPort == 6) {
        var index = 0;
        const type_code = bytesToInt(bytes, index, 2);
        const position_type_code = (type_code >> 12) & 0x0f;

        payloadList.push(getPayloadData("position_type", positionTypeArray[position_type_code], groupID));
        payloadList.push(getPayloadData("age", (type_code & 0x0fff), groupID));
        index += 2;

        const latitude = Number(signedHexToInt(bytesToHexString(bytes, index, 4)) * 0.0000001).toFixed(7);
        payloadList.push(getPayloadData("latitude", latitude, groupID));
        index += 4;

        const longitude = Number(signedHexToInt(bytesToHexString(bytes, index, 4)) * 0.0000001).toFixed(7);
        payloadList.push(getPayloadData("longitude", longitude, groupID));
        index += 4;

        const pdop = Number(bytesToInt(bytes, index, 1) * 0.1).toFixed(1);
        payloadList.push(getPayloadData("pdop", pdop, groupID));
    }else {
        var index = 0;
        const charging_status = ((bytes[index] & 0x80) == 0x80) ? 'Charging' : 'No charging';
        payloadList.push(getPayloadData("charging_status", charging_status, groupID));
        const battery_percent = (bytes[index] & 0x7f).toString() + "%";
        payloadList.push(getPayloadData("battery_percent", battery_percent, groupID));
        index += 1;
        
        if (fPort == 1 && bytes.length == 8) {
            if (bytes[index] != 0x80) {
                //0x80代表温度关闭
                const temperature = signedHexToInt(bytesToHexString(bytes, index, 1)).toString() + '°C';
                payloadList.push(getPayloadData("temperature", temperature, groupID));
            } 
            index += 1;

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

            const work_mode = bytesToInt(bytes,index,1);
            payloadList.push(getPayloadData("work_mode", operationModeArray[work_mode], groupID));
            index += 1;

            const device_status = bytesToInt(bytes,index,1);
            payloadList.push(getPayloadData("device_status", deviceStatusArray[device_status], groupID));
            index += 1;

            const light_intensity = bytesToInt(bytes,index,2);
            if (light_intensity != 65535) {
                payloadList.push(getPayloadData("light_intensity", light_intensity, groupID));
            }
        }else if (fPort == 2 && bytes.length == 12) {
            if (bytes[index] != 0x80) {
                //0x80代表温度关闭
                const temperature = signedHexToInt(bytesToHexString(bytes, index, 1)).toString() + '°C';
                payloadList.push(getPayloadData("temperature", temperature, groupID));
            }
            index += 1;

            const date = new Date(1000 * bytesToInt(bytes, index, 4));
            payloadList.push(getPayloadData("time", date.toLocaleString(), groupID));
            index += 4;

            payloadList.push(getPayloadData("timezone", signedHexToInt(bytesToHexString(bytes, index, 1)), groupID));
            index += 1;

            const work_mode = bytesToInt(bytes,index,1);
            payloadList.push(getPayloadData("work_mode", operationModeArray[work_mode], groupID));
            index += 1;

            const device_status = bytesToInt(bytes,index,1);
            payloadList.push(getPayloadData("device_status", deviceStatusArray[device_status], groupID));
            index += 1;

            const shutdown_type = bytesToInt(bytes,index,1);
            payloadList.push(getPayloadData("shutdown_type", shutdownTypeArray[shutdown_type], groupID));
            index += 1;

            const light_intensity = bytesToInt(bytes,index,2);
            if (light_intensity != 65535) {
                payloadList.push(getPayloadData("light_intensity", light_intensity, groupID));
            }
        }else if (fPort == 3 && bytes.length == 11) {
            if (bytes[index] != 0x80) {
                //0x80代表温度关闭
                var temperature = signedHexToInt(bytesToHexString(bytes, index, 1)).toString() + '°C';
                payloadList.push(getPayloadData("temperature", temperature, groupID));
            }
            index += 1;

            const date = new Date(1000 * bytesToInt(bytes, index, 4));
            payloadList.push(getPayloadData("time", date.toLocaleString(), groupID));
            index += 4;

            payloadList.push(getPayloadData("timezone", signedHexToInt(bytesToHexString(bytes, index, 1)), groupID));
            index += 1;

            const work_mode = bytesToInt(bytes,index,1);
            payloadList.push(getPayloadData("work_mode", operationModeArray[work_mode], groupID));
            index += 1;

            const device_status = bytesToInt(bytes,index,1);
            payloadList.push(getPayloadData("device_status", deviceStatusArray[device_status], groupID));
            index += 1;

            const light_intensity = bytesToInt(bytes,index,2);
            if (light_intensity != 65535) {
                payloadList.push(getPayloadData("light_intensity", light_intensity, groupID));
            }
        }else if (fPort == 4 && bytes.length == 12) {
            if (bytes[index] != 0x80) {
                //0x80代表温度关闭
                var temperature = signedHexToInt(bytesToHexString(bytes, index, 1)).toString() + '°C';
                payloadList.push(getPayloadData("temperature", temperature, groupID));
            }
            index += 1;

            const date = new Date(1000 * bytesToInt(bytes, index, 4));
            payloadList.push(getPayloadData("time", date.toLocaleString(), groupID));
            index += 4;

            payloadList.push(getPayloadData("timezone", signedHexToInt(bytesToHexString(bytes, index, 1)), groupID));
            index += 1;

            const work_mode = bytesToInt(bytes,index,1);
            payloadList.push(getPayloadData("work_mode", operationModeArray[work_mode], groupID));
            index += 1;

            const device_status = bytesToInt(bytes,index,1);
            payloadList.push(getPayloadData("device_status", deviceStatusArray[device_status], groupID));
            index += 1;

            const low_power_percent = bytesToInt(bytes,index,1);
            payloadList.push(getPayloadData("low_power_percent", lowPowerPercentArray[low_power_percent], groupID));
            index += 1;
            
            const light_intensity = bytesToInt(bytes,index,2);
            if (light_intensity != 65535) {
                payloadList.push(getPayloadData("light_intensity", light_intensity, groupID));
            }
        }else if (fPort == 5 && bytes.length == 10) {
            const date = new Date(1000 * bytesToInt(bytes, index, 4));
            payloadList.push(getPayloadData("time", date.toLocaleString(), groupID));
            index += 4;

            payloadList.push(getPayloadData("timezone", signedHexToInt(bytesToHexString(bytes, index, 1)), groupID));
            index += 1;

            const event_type = bytesToInt(bytes,index,1);
            payloadList.push(getPayloadData("event_type", eventTypeArray[event_type], groupID));
            index += 1;

            if (bytes[index] != 0x80) {
                //0x80代表温度关闭
                const temperature = signedHexToInt(bytesToHexString(bytes, index, 1)).toString() + '°C';
                payloadList.push(getPayloadData("temperature", temperature, groupID));
            }
            index += 1;
            
            var light_intensity = bytesToInt(bytes,index,2);
            if (light_intensity != 65535) {
                payloadList.push(getPayloadData("light_intensity", light_intensity, groupID));
            }
        }else if (fPort == 8 && bytes.length > 6) {
            index += 2;

            const position_type_code = (bytes[index] >> 4) & 0x0f;
            payloadList.push(getPayloadData("position_type", positionTypeArray[position_type_code], groupID));
            const position_symbol = (bytes[index] & 0x0f);
            const position_string = (position_symbol == 0x01) ? "Bluetooth positioning success" : "GPS positioning success";
            payloadList.push(getPayloadData("position_symbol", position_string, groupID));
            index += 1;

            const work_mode = (bytes[index] >> 4) & 0x0f;
            payloadList.push(getPayloadData("work_mode", operationModeArray[work_mode], groupID));
            const device_status = (bytes[index] & 0x0f);
            payloadList.push(getPayloadData("device_status", deviceStatusArray[device_status], groupID));
            index += 1;

            const data_len = bytes[index];
            index += 1;

            const position_data = bytes.slice(index,index + data_len);
            index += data_len;

            if (position_symbol == 0x01) {
                //蓝牙定位
                const sub_bytes_len = (contain_vlotage ? 9 : 7);
                const data_list: { [key: string]: any }[] = [];
                for (var i = 0; i < (data_len / sub_bytes_len);i ++) {
                    const item: { [key: string]: any }[] = [];
                    const temp_sub = position_data.slice((i * sub_bytes_len),(i * sub_bytes_len) + sub_bytes_len);
                    item.push(getPayloadData("mac_address",bytesToHexString(temp_sub, 0, 6),groupID));
                    const rssi = signedHexToInt(bytesToHexString(temp_sub, 6, 1)).toString() + 'dBm';
                    item.push(getPayloadData("rssi",rssi,groupID));
                    if (contain_vlotage) {
                        const voltage = bytesToInt(temp_sub, 7, 2).toString() + "mV";
                        item.push(getPayloadData("voltage",voltage,groupID));
                    }
                    data_list.push(item);
                }
                payloadList.push(getPayloadData("position_data", data_list, groupID));
            }else if (position_symbol == 0x03) {
                //GPS定位
                const data_list: { [key: string]: any }[] = [];
                for (var i = 0; i < (data_len / 9);i ++) {
                    const item: { [key: string]: any }[] = [];
                    const temp_sub = position_data.slice((i * 9),(i * 9) + 9);
                    const latitude = Number(signedHexToInt(bytesToHexString(temp_sub, 0, 4)) * 0.0000001).toFixed(7) + '°';
                    item.push(getPayloadData("latitude",latitude,groupID));
                    const longitude = Number(signedHexToInt(bytesToHexString(temp_sub, 4, 4)) * 0.0000001).toFixed(7) + '°';
                    item.push(getPayloadData("longitude",longitude,groupID));
                    const pdop = (bytesToInt(temp_sub, 8, 1) * 0.1).toFixed(1).toString();
                    item.push(getPayloadData("pdop",pdop,groupID));
                    data_list.push(item);
                }
                payloadList.push(getPayloadData("position_data", data_list, groupID));
            }else {
                payloadList.push(getPayloadData("position_data", position_data, groupID));
            }

            if (bytes[index] != 0x80) {
                //0x80代表温度关闭
                const temperature = signedHexToInt(bytesToHexString(bytes, index, 1)).toString() + '°C';
                payloadList.push(getPayloadData("temperature", temperature, groupID));
            }
            index += 1;
            
            const light_intensity = bytesToInt(bytes,index,2);
            if (light_intensity != 65535) {
                payloadList.push(getPayloadData("light_intensity", light_intensity, groupID));
            }
            index += 2;

            const date = new Date(1000 * bytesToInt(bytes, index, 4));
            payloadList.push(getPayloadData("time", date.toLocaleString(), groupID));
        }else if (fPort == 9 && bytes.length > 7) {
            payloadList.push(getPayloadData("position_type", positionTypeArray[bytes[index]], groupID));
            index += 1;

            payloadList.push(getPayloadData("work_mode", operationModeArray[bytes[index]], groupID));
            index += 1;

            payloadList.push(getPayloadData("assistance_type", assistanceTypeArray[bytes[index]], groupID));
            index +=1;

            payloadList.push(getPayloadData("position_failed_type", parsePositionFailedCode(bytes[index]), groupID));
            index +=1;

            const data_len = bytes[index];
            index += 1;

            const failed_data = bytes.slice(index,index + data_len);
            index += data_len;

            const failed_type = bytes[index];
            index += 1;

            if (failed_type == 1) {
                //蓝牙定位
                const sub_bytes_len = (contain_vlotage ? 9 : 7);
                const data_list: { [key: string]: any }[] = [];
                for (var i = 0; i < (data_len / sub_bytes_len);i ++) {
                    const item: { [key: string]: any }[] = [];
                    const temp_sub = failed_data.slice((i * sub_bytes_len),(i * sub_bytes_len) + sub_bytes_len);
                    item.push(getPayloadData("mac_address",  bytesToHexString(temp_sub, 0, 6), groupID));
                    const rssi = signedHexToInt(bytesToHexString(temp_sub, 6, 1)).toString() + 'dBm';
                    item.push(getPayloadData("rssi",  rssi, groupID));
                    if (contain_vlotage) {
                        const voltage = bytesToInt(temp_sub, 7, 2).toString() + "mV";
                        item.push(getPayloadData("voltage",  voltage, groupID));
                    }
                    data_list.push(item);
                }
                payloadList.push(getPayloadData("position_failed_data", data_list, groupID));
            }else if (failed_type == 3) {
                //GPS定位
                const data_list: { [key: string]: any }[] = [];
                for (var i = 0; i < (data_len / 5);i ++) {
                    const item: { [key: string]: any }[] = [];
                    const temp_sub = failed_data.slice((i * 5),(i * 5) + 5);
                    const pdop = (bytesToInt(temp_sub, 0, 1) * 0.1).toFixed(1).toString();
                    item.push(getPayloadData("pdop", pdop, groupID));
                    const cn_list: number[] = [];
                    cn_list.push(bytesToInt(temp_sub, 1, 1));
                    cn_list.push(bytesToInt(temp_sub, 2, 1));
                    cn_list.push(bytesToInt(temp_sub, 3, 1));
                    cn_list.push(bytesToInt(temp_sub, 4, 1));
                    item.push(getPayloadData("cn_list", cn_list, groupID));
                    data_list.push(item);
                }
                payloadList.push(getPayloadData("position_failed_data", data_list, groupID));
            }else {
                payloadList.push(getPayloadData("position_failed_data", failed_data, groupID));
            }

            if (bytes[index] != 0x80) {
                //0x80代表温度关闭
                const temperature = signedHexToInt(bytesToHexString(bytes, index, 1)).toString() + '°C';
                payloadList.push(getPayloadData("temperature", temperature, groupID));
            }
            index += 1;
            
            const light_intensity = bytesToInt(bytes,index,2);
            if (light_intensity != 65535) {
                payloadList.push(getPayloadData("light_intensity", light_intensity, groupID));
            }
            index += 2;
        }else if (fPort == 11 && bytes.length == 12) {
            if (bytes[index] != 0x80) {
                //0x80代表温度关闭
                const temperature = signedHexToInt(bytesToHexString(bytes, index, 1)).toString() + '°C';
                payloadList.push(getPayloadData("temperature", temperature, groupID));
            }
            index += 1;

            const date = new Date(1000 * bytesToInt(bytes, index, 4));
            payloadList.push(getPayloadData("time", date.toLocaleString(), groupID));
            index += 4;

            payloadList.push(getPayloadData("timezone", signedHexToInt(bytesToHexString(bytes, index, 1)), groupID));
            index += 1;

            const work_mode = bytesToInt(bytes,index,1);
            payloadList.push(getPayloadData("work_mode", operationModeArray[work_mode], groupID));
            index += 1;

            const device_status = bytesToInt(bytes,index,1);
            payloadList.push(getPayloadData("device_status", deviceStatusArray[device_status], groupID));
            index += 1;

            payloadList.push(getPayloadData("shock_times", bytesToInt(bytes,index,1), groupID));
            index += 1;

            const light_intensity = bytesToInt(bytes,index,2);
            if (light_intensity != 65535) {
                payloadList.push(getPayloadData("light_intensity", light_intensity, groupID));
            }
        }else if (fPort == 12 && bytes.length == 53) {
            const work_time = bytesToInt(bytes, index, 4);
            payloadList.push(getPayloadData("work_time", work_time, groupID));
            index += 4;

            const adv_times = bytesToInt(bytes, index, 4);
            payloadList.push(getPayloadData("adv_times", adv_times, groupID));
            index += 4;

            const axis_wakeup_time = bytesToInt(bytes, index, 4);
            payloadList.push(getPayloadData("axis_wakeup_time", axis_wakeup_time, groupID));
            index += 4;

            const ble_position_time = bytesToInt(bytes, index, 4);
            payloadList.push(getPayloadData("ble_position_time", ble_position_time, groupID));
            index += 4;

            const gps_position_time = bytesToInt(bytes, index, 4);
            payloadList.push(getPayloadData("gps_position_time", gps_position_time, groupID));
            index += 4;

            const lora_send_times = bytesToInt(bytes, index, 4);
            payloadList.push(getPayloadData("lora_send_times", lora_send_times, groupID));
            index += 4;

            const lora_power = bytesToInt(bytes, index, 4);
            payloadList.push(getPayloadData("lora_power", lora_power, groupID));
            index += 4;

            const battery_consumption = bytesToInt(bytes, index, 4);
            payloadList.push(getPayloadData("battery_consumption", battery_consumption, groupID));
            index += 4;

            const position_report_times_during_stationary_in_motion_mode = bytesToInt(bytes, index, 4);
            payloadList.push(getPayloadData("position_report_times_during_stationary_in_motion_mode", position_report_times_during_stationary_in_motion_mode, groupID));
            index += 4;

            const position_report_times_during_movement_in_motion_mode = bytesToInt(bytes, index, 4);
            payloadList.push(getPayloadData("position_report_times_during_movement_in_motion_mode", position_report_times_during_movement_in_motion_mode, groupID));
            index += 4;

            const green_led_working_time = bytesToInt(bytes, index, 4);
            payloadList.push(getPayloadData("green_led_working_time", green_led_working_time, groupID));
            index += 4;

            const orange_led_working_time = bytesToInt(bytes, index, 4);
            payloadList.push(getPayloadData("orange_led_working_time", orange_led_working_time, groupID));
            index += 4;

            const blue_led_working_time = bytesToInt(bytes, index, 4);
            payloadList.push(getPayloadData("blue_led_working_time", blue_led_working_time, groupID));
            index += 4;
        }
    }
    
    return payloadList; 
}

function parsePositionFailedCode(byte:number):string {
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
        return "Interrupted positioning at end of movement (the movement restarted too quickly, resulting in not enough time to complete the positioning)";
    }
    if (byte == 12) {
        return "Interrupted positioning at start of movement (the movement ends too quickly, resulting in not enough time to complete the positioning)";
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