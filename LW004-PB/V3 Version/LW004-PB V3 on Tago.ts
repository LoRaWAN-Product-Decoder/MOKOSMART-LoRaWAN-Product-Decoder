var payloadTypeArray:string[] = ['Event Message', 'Device Information', 'Shut Down', 'Heartbeat', 'Low Power', 'GPS Location Fixed', 'GPS Location Failure', 'Bluetooth Location Fixed', 'Bluetooth Location Failure', 'GPS Location Fixed of auxiliary operation', 'GPS Location Failure of auxiliary operation', 'Bluetooth Location Fixed of auxiliary operation', 'Bluetooth Location Failure of auxiliary operation'];
var deviceModeArray = [
	'Standby mode'
	, 'Timing mode'
	, 'Periodic mode'
	, 'Stationary state in motion mode'
	, 'Start of movement in motion mode'
	, 'In movement for motion mode'
	, 'End of movement in motion mode'
];
var auxiliaryOperationArray:string[] = [
	'No auxiliary operation'
	, 'Downlink for position'
	, 'Man Down status'
	, 'Alert alarm'
	, 'SOS alarm'];
var eventTypeArray:string[] = [
	'Start of movement'
	, 'In movement'
	, 'End of movement'
	, 'Start SOS alarm'
	, 'SOS alarm exit'
	, 'Start Alert alarm'
	, 'Alert alarm exit'
	, 'Come into Man Down status'
	, 'Exit Man Down status'
];
var shutdownTypeArray:string[] = ['Bluetooth command or App', 'LoRaWAN Command', 'Power button', 'Battery run out'];
var posFailedReasonArray:string[] = [
	'Hardware Error'
	, 'Interrupted by Downlink for Position'
	, 'Interrupted by Man Down Detection'
	, 'Interrupted by Alarm function'
	, 'GPS positioning timeout (Please increase GPS positioning time via MKLoRa APP)'
	, 'GPS positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)'
	, 'GPS positioning timeout of alert alarm (Please increase alert alarm report interval via MKLoRa APP)'
	, 'The reporting interval of SOS alarm is set too short (Please increase SOS alarm report interval via MKLoRa APP)'
	, 'GPS PDOP Limit(Please increase PDOP via MKLoRa APP)'
	, 'Interrupted positioning at start of movement(the movement ends too quickly, resulting in not enough time to complete the positioning)'
	, 'Interrupted positioning at end of movement(the movement restarted too quickly, resulting in not enough time to complete the positioning)'
	, 'Other reason'
];

var posFailedReasonArray2:string[] = [
	'Hardware Error'
	, 'Interrupted by Downlink for Position'
	, 'Interrupted by Man Down Detection'
	, 'Interrupted by Alarm function'
	, 'Bluetooth positioning timeout (Please increase positioning time of Bluetooth fix)'
	, 'Bluetooth broadcasting in progress (Please reduce the Bluetooth broadcast timeout or avoid Bluetooth positioning when Bluetooth broadcasting in process)'
	, 'Interrupted positioning at start of movement(the movement ends too quickly, resulting in not enough time to complete the positioning)'
	, 'Interrupted positioning at end of movement(the movement restarted too quickly, resulting in not enough time to complete the positioning)'
];


function Decoder(bytes: number[], fPort: number, groupID: string):{ [key: string]: any }[] {
    const payloadList: { [key: string]: any }[] = [];

    if (fPort == 0 || fPort == 100) {
        return payloadList;
    }

    payloadList.push(getPayloadData('port', fPort, groupID));

	const payload_type = payloadTypeArray[fPort - 1];
    payloadList.push(getPayloadData('payload_type', payload_type, groupID));

	const battery_charging_status = bytes[0] & 0x80 ? 'in charging' : 'no charging';	//Parse  Battery charging state 
    payloadList.push(getPayloadData('battery_charging_status', battery_charging_status, groupID));

	const battery_level = (bytes[0] & 0x7F).toString() + '%';  //Parse  Battery Level
    payloadList.push(getPayloadData('battery_level', battery_level, groupID));
    

    if (fPort == 1) {
		const timezone = timezone_decode(bytes[1]);					//timezone
        payloadList.push(getPayloadData('timezone', timezone, groupID));

		const timestamp = bytesToInt(bytes, 2, 4);		//timestamp
        payloadList.push(getPayloadData('timestamp', timestamp, groupID));

		var eventTypeCode = bytes[6] & 0xFF;
		const event_type = eventTypeArray[eventTypeCode];		//event
        payloadList.push(getPayloadData('event_type', event_type, groupID));
	} else if (fPort == 2) {
		const device_mode = deviceModeArray[(bytes[1] >> 4) & 0x0F - 1];	//work mode
        payloadList.push(getPayloadData('device_mode', device_mode, groupID));

		const auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
        payloadList.push(getPayloadData('auxiliary_operation', auxiliary_operation, groupID));

		const firmware_version = 'V' + bytes[2].toString() + '.' + bytes[3].toString() + '.' + bytes[4].toString();
        payloadList.push(getPayloadData('firmware_version', firmware_version, groupID));

		const hardware_version = 'V' + bytes[5] + '.' + bytes[6];
        payloadList.push(getPayloadData('hardware_version', hardware_version, groupID));

		const timezone = timezone_decode(bytes[7]);		//timezone
        payloadList.push(getPayloadData('timezone', timezone, groupID));
		// const alarm_error = bytes[8];	//error state
	} else if (fPort == 3) {
		const device_mode = deviceModeArray[(bytes[1] >> 4) & 0x0F - 1];	//work mode
        payloadList.push(getPayloadData('device_mode', device_mode, groupID));

		const auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
        payloadList.push(getPayloadData('auxiliary_operation', auxiliary_operation, groupID));

		const timezone = timezone_decode(bytes[2]);		//timezone
        payloadList.push(getPayloadData('timezone', timezone, groupID));

		const timestamp = bytesToInt(bytes, 3, 4);		//timestamp
        payloadList.push(getPayloadData('timestamp', timestamp, groupID));

		const shutdown_type = shutdownTypeArray[bytes[7]];
        payloadList.push(getPayloadData('shutdown_type', shutdown_type, groupID));

	} else if (fPort == 4) {
		const device_mode = deviceModeArray[(bytes[1] >> 4) & 0x0F - 1];	//work mode
        payloadList.push(getPayloadData('device_mode', device_mode, groupID));

		const auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
        payloadList.push(getPayloadData('auxiliary_operation', auxiliary_operation, groupID));

		const timezone = timezone_decode(bytes[2]);		//timezone
        payloadList.push(getPayloadData('timezone', timezone, groupID));

		const timestamp = bytesToInt(bytes, 3, 4);		//timestamp
        payloadList.push(getPayloadData('timestamp', timestamp, groupID));
	} else if (fPort == 5) {
		const device_mode = deviceModeArray[(bytes[1] >> 4) & 0x0F - 1];	//work mode
        payloadList.push(getPayloadData('device_mode', device_mode, groupID));

		const auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
        payloadList.push(getPayloadData('auxiliary_operation', auxiliary_operation, groupID));

		const timezone = timezone_decode(bytes[2]);		//timezone
        payloadList.push(getPayloadData('timezone', timezone, groupID));

		const timestamp = bytesToInt(bytes, 3, 4);		//timestamp
        payloadList.push(getPayloadData('timestamp', timestamp, groupID));

		const low_power_prompt_percent = (bytes[7] & 0xFF) + '%';		//low power level
        payloadList.push(getPayloadData('low_power_prompt_percent', low_power_prompt_percent, groupID));
	} else if (fPort == 6 || fPort == 10) {
		const device_mode = deviceModeArray[(bytes[1] >> 5) & 0x07 - 1];	//work mode
        payloadList.push(getPayloadData('device_mode', device_mode, groupID));

		const auxiliary_operation = auxiliaryOperationArray[bytes[1] >> 2 & 0x07];	//device status
        payloadList.push(getPayloadData('auxiliary_operation', auxiliary_operation, groupID));

		const age = ((bytes[1] & 0x01) << 8 | bytes[2]).toString() + 's';
        payloadList.push(getPayloadData('age', age, groupID));

		var lon = bytesToInt(bytes, 3, 4);
		var lat = bytesToInt(bytes, 7, 4);

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
        
        payloadList.push(location);
	} else if (fPort == 7 || fPort == 11) {
		var gps_fix_false_reason = ['hardware_error', 'down_request_fix_interrupt', 'mandown_fix_interrupt', 'alarm_fix_interrupt', 'gps_fix_tech_timeout', 'gps_fix_timeout', 'alert_short_time', 'sos_short_time', 'pdop_limit', 'motion_start_interrupt', 'motion_stop_interrupt'];
		const device_mode = deviceModeArray[(bytes[1] >> 4) & 0x0F - 1];	//work mode
        payloadList.push(getPayloadData('device_mode', device_mode, groupID));

		const auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
        payloadList.push(getPayloadData('auxiliary_operation', auxiliary_operation, groupID));

		const reasons_for_positioning_failure = posFailedReasonArray[bytes[2] - 1];
        payloadList.push(getPayloadData('reasons_for_positioning_failure', reasons_for_positioning_failure, groupID));

		const location_failure_cn0 = bytes[3];
        payloadList.push(getPayloadData('location_failure_cn0', location_failure_cn0, groupID));

		const location_failure_cn1 = bytes[4];
        payloadList.push(getPayloadData('location_failure_cn1', location_failure_cn1, groupID));

		const location_failure_cn2 = bytes[5];
        payloadList.push(getPayloadData('location_failure_cn2', location_failure_cn2, groupID));

		const location_failure_cn3 = bytes[6];
        payloadList.push(getPayloadData('location_failure_cn3', location_failure_cn3, groupID));
	} else if (fPort == 8 || fPort == 12) {
		const device_mode = deviceModeArray[(bytes[1] >> 4) & 0x0F - 1];	//work mode
        payloadList.push(getPayloadData('device_mode', device_mode, groupID));

		const auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
        payloadList.push(getPayloadData('auxiliary_operation', auxiliary_operation, groupID));

		const age = ((bytes[2]) << 8 | bytes[3]).toString() + 's';	//age
        payloadList.push(getPayloadData('age', age, groupID));

		var parse_len = 4;
		for (var i = 0; i < ((bytes.length - 4) / 7); i++) {
			const mac = bytesToHexString(bytes,parse_len,6);
            payloadList.push(getPayloadData('ble_mac_' + i.toString(), mac, groupID));
			parse_len += 6;
			const rssi = (bytes[parse_len++] - 256).toString() + 'dBm';
            payloadList.push(getPayloadData('ble_rssi_' + i.toString(), rssi, groupID));
		}

	} else if (fPort == 9 || fPort == 13) {
		var ble_fix_false_reason = ['none', 'hardware_error', 'down_request_fix_interrupt', 'mandown_fix_interrupt', 'alarm_fix_interrupt', 'ble_fix_timeout', 'ble_adv', 'motion_start_interrupt', 'motion_stop_interrupt'];
		const device_mode = deviceModeArray[(bytes[1] >> 4) & 0x0F - 1];	//work mode
        payloadList.push(getPayloadData('device_mode', device_mode, groupID));

		const auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
        payloadList.push(getPayloadData('auxiliary_operation', auxiliary_operation, groupID));

		const reasons_for_positioning_failure = posFailedReasonArray2[bytes[2] - 1];
        payloadList.push(getPayloadData('reasons_for_positioning_failure', reasons_for_positioning_failure, groupID));

		parse_len = 3;
		for (var j = 0; j < ((bytes.length - 3) / 7); j++) {
			const mac = bytesToHexString(bytes,parse_len,6);
            payloadList.push(getPayloadData('ble_mac_' + j.toString(), mac, groupID));
			parse_len += 6;
			const rssi = (bytes[parse_len++] - 256).toString() + 'dBm';
            payloadList.push(getPayloadData('ble_rssi_' + j.toString(), rssi, groupID));
		}
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
    let tz_str = 'UTC';
    tz = tz > 128 ? tz - 256 : tz;
    if (tz < 0) {
        tz_str += '-';
        tz = -tz;
    } else {
        tz_str += '+';
    }

    if (tz < 20) {
        tz_str += '0';
    }

    tz_str += String(tz / 2);
    tz_str += ':'

    if (tz % 2) {
        tz_str += '30'
    } else {
        tz_str += '00'
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

    let time_str = '';
    time_str += d.getUTCFullYear();
    time_str += '-';
    time_str += formatNumber(d.getUTCMonth() + 1);
    time_str += '-';
    time_str += formatNumber(d.getUTCDate());
    time_str += ' ';

    time_str += formatNumber(d.getUTCHours());
    time_str += ':';
    time_str += formatNumber(d.getUTCMinutes());
    time_str += ':';
    time_str += formatNumber(d.getUTCSeconds());

    return time_str;
}

function formatNumber(number: number): string {
    return number < 10 ? '0' + number.toString() : number.toString();
}

/*
    有符号十六进制字符串转十进制
*/
function signedHexToInt(hexStr: string): number {
    let twoStr = parseInt(hexStr, 16).toString(2); // 将十六转十进制，再转2进制
    // console.log(twoStr);
    let bitNum = hexStr.length * 4; // 1个字节 = 8bit ，0xff 一个 'f'就是4位
    if (twoStr.length < bitNum) {
        while (twoStr.length < bitNum) {
            twoStr = '0' + twoStr;
        }
    }
    if (twoStr.substring(0, 1) == '0') {
        // 正数
        return parseInt(twoStr, 2); // 二进制转十进制
    }
    // 负数
    let twoStr_unsign = '';
    let tempValue = parseInt(twoStr, 2) - 1; // 补码：(负数)反码+1，符号位不变；相对十进制来说也是 +1，但这里是负数，+1就是绝对值数据-1
    twoStr_unsign = tempValue.toString(2).substring(1, bitNum); // 舍弃首位(符号位)
    // 去除首字符，将0转为1，将1转为0   反码
    twoStr_unsign = twoStr_unsign.replace(/0/g, 'z');
    twoStr_unsign = twoStr_unsign.replace(/1/g, '0');
    twoStr_unsign = twoStr_unsign.replace(/z/g, '1');
    return parseInt('-' + twoStr_unsign, 2);
}

function getPayloadData(type: string, value: any, groupID: string): { [key: string]: any } {
    return {
        'variable': type,
        'value': value,
        'group': groupID,
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
    const buffer = Buffer.from(hexString, 'hex');
    return Array.from(buffer, (byte) => byte);
}