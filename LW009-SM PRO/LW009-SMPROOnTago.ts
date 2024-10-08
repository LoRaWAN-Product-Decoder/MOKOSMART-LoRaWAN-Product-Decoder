
const parkingDetectMode: string[] = ['Magnetic detection','Radar detection','Magnetic & Radar detection'];

const parkingInfo: string[] = ['Heartbeat','No parking','Occupied','Strong magnetic interference','Magnetic hardware destroyed','Radar mode destroyed'];

const dataTypeList: string[] = ['Hearbeat','Parking information','Parking beacon information','Low power','Power off','Event information'];

const powerOffMode: string[] = ['Bluetooth command','LoRaWAN command'];

function Decoder(bytes: number[], fPort: number, groupID: string):{ [key: string]: any }[] {
    
    const payloadList: { [key: string]: any }[] = [];

    payloadList.push(getPayloadData('port' , fPort, groupID));

    const data_type = dataTypeList[fPort - 1];
    payloadList.push(getPayloadData('data_type' , data_type, groupID));

    var index = 0;
    
    const low_power_state = (bytes[index] == 1) ? 'Low power' : 'Normal';
    payloadList.push(getPayloadData('low_power_state' , low_power_state, groupID));
    index ++;

    const battery_voltage = bytesToInt(bytes,index,2).toString() + 'mV';
    payloadList.push(getPayloadData('battery_voltage' , battery_voltage, groupID));
    index += 2;

	const timestamp = bytesToInt(bytes, index, 4);		//timestamp
    payloadList.push(getPayloadData('timestamp' , timestamp, groupID));
    index += 4;

    const timezone = timezone_decode(bytes[index]);		//timezone
    payloadList.push(getPayloadData('timezone' , timezone, groupID));
    index ++;

    const time = parse_time(timestamp, bytes[index] * 0.5);
    payloadList.push(getPayloadData('time' , time, groupID));

    const temperature = bytes[index];
    if (temperature == 0xff) {
        //无效数据
        payloadList.push(getPayloadData('temperature' , 'FF', groupID));
    }else {
        const temp_value = signedHexToInt(bytesToHexString(bytes, index, 1)).toString() + '°C';
        payloadList.push(getPayloadData('temperature' , temp_value, groupID));
    }
    index ++;

    const humidity = bytes[index];
    if (humidity == 0xff) {
        //无效数据
        payloadList.push(getPayloadData('humidity' , 'FF', groupID));
    }else {
        const temp_value = bytesToInt(bytes,index,1).toString() + '%';
        payloadList.push(getPayloadData('humidity' , temp_value, groupID));
    }
    index ++;

    if (fPort == 1) {
        const car_parking_state = (bytes[index] == 1) ? 'Parking' : 'No Parking'
        payloadList.push(getPayloadData('car_parking_state' , car_parking_state, groupID));
    } else if (fPort == 2 || fPort == 3) {
        const parking_detect_mode = parkingDetectMode[bytes[index]];
        payloadList.push(getPayloadData('parking_detect_mode' , parking_detect_mode, groupID));
        index ++;

        const car_parking_state = (bytes[index] == 1) ? 'Parking' : 'No Parking'
        payloadList.push(getPayloadData('car_parking_state' , car_parking_state, groupID));
        index ++;

        const parking_information = parkingInfo[bytes[index]];
        payloadList.push(getPayloadData('parking_information' , parking_information, groupID));
        index ++;

        const radar_data = bytesToHexString(bytes,index,2);
        payloadList.push(getPayloadData('radar_data' , radar_data, groupID));
        index += 2;

        const x_data = '0x' + bytesToHexString(bytes,index,2);
        index += 2;

        const y_data = '0x' + bytesToHexString(bytes,index,2);
        index += 2;

        const z_data = '0x' + bytesToHexString(bytes,index,2);
        index += 2;

        const axis_data = 'X:' + x_data + ' Y:' + y_data + ' Z:' + z_data;
        payloadList.push(getPayloadData('detection_data', axis_data, groupID));

        const parking_timestamp = bytesToInt(bytes, index, 4);		//timestamp
        payloadList.push(getPayloadData('parking_timestamp' , parking_timestamp, groupID));
        index += 4;

        if (fPort == 3 && bytes.length > 25) {
            const beacon_number = bytesToInt(bytes,index,1);
            index ++;

            for (var i = 0; i < beacon_number; i ++) {
                const mac_address = bytesToHexString(bytes,index,6);
                payloadList.push(getPayloadData('beacon_mac_' + i.toString() , mac_address, groupID));
                index += 6;

                const rssi = (bytes[index] - 256).toString() + 'dBm';
                payloadList.push(getPayloadData('beacon_rssi_' + i.toString() , rssi, groupID));
                index ++;

                const beacon_timestamp = bytesToInt(bytes, index, 4);		//timestamp
                payloadList.push(getPayloadData('beacon_timestamp_' + i.toString(), beacon_timestamp, groupID));
                index += 4;
            }
        }
    } else if (fPort == 5) {
        const power_off_mode = powerOffMode[bytes[index]];
        payloadList.push(getPayloadData('power_off_mode', power_off_mode, groupID));
    }else if (fPort == 6) {
        payloadList.push(getPayloadData('event', 'Downlink frame trigger reporting', groupID));
    }

    return payloadList;
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
    let tz_str = ' UTC' ;
    tz = tz > 128 ? tz - 256 : tz;
    if (tz < 0) {
        tz_str += ' -' ;
        tz = -tz;
    } else {
        tz_str += ' +' ;
    }

    if (tz < 20) {
        tz_str += ' 0' ;
    }

    tz_str += String(tz / 2);
    tz_str += ' :' 

    if (tz % 2) {
        tz_str += ' 30' 
    } else {
        tz_str += ' 00' 
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

    let time_str = ' ' ;
    time_str += d.getUTCFullYear();
    time_str += ' -' ;
    time_str += formatNumber(d.getUTCMonth() + 1);
    time_str += ' -' ;
    time_str += formatNumber(d.getUTCDate());
    time_str += '  ' ;

    time_str += formatNumber(d.getUTCHours());
    time_str += ' :' ;
    time_str += formatNumber(d.getUTCMinutes());
    time_str += ' :' ;
    time_str += formatNumber(d.getUTCSeconds());

    return time_str;
}

function formatNumber(number: number): string {
    return number < 10 ? ' 0'  + number.toString() : number.toString();
}

/*
    有符号十六进制字符串转十进制
*/
function signedHexToInt(hexStr: string): number {
    let twoStr = parseInt(hexStr, 16).toString(2); // 将十六转十进制，再转2进制
    // console.log(twoStr);
    let bitNum = hexStr.length * 4; // 1个字节 = 8bit ，0xff 一个 ' f' 就是4位
    if (twoStr.length < bitNum) {
        while (twoStr.length < bitNum) {
            twoStr = ' 0'  + twoStr;
        }
    }
    if (twoStr.substring(0, 1) == ' 0' ) {
        // 正数
        return parseInt(twoStr, 2); // 二进制转十进制
    }
    // 负数
    let twoStr_unsign = ' ' ;
    let tempValue = parseInt(twoStr, 2) - 1; // 补码：(负数)反码+1，符号位不变；相对十进制来说也是 +1，但这里是负数，+1就是绝对值数据-1
    twoStr_unsign = tempValue.toString(2).substring(1, bitNum); // 舍弃首位(符号位)
    // 去除首字符，将0转为1，将1转为0   反码
    twoStr_unsign = twoStr_unsign.replace(/0/g, ' z' );
    twoStr_unsign = twoStr_unsign.replace(/1/g, ' 0' );
    twoStr_unsign = twoStr_unsign.replace(/z/g, ' 1' );
    return parseInt('-' + twoStr_unsign, 2);
}

function getPayloadData(type: string, value: any, groupID: string): { [key: string]: any } {
    return {
        ' variable' : type,
        ' value' : value,
        ' group' : groupID,
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
    const buffer = Buffer.from(hexString, ' hex' );
    return Array.from(buffer, (byte) => byte);
}