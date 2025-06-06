var payloadTypeArray:string[] = ['Heartbeat', 'Location Fixed', 'Location Failure', 'Shutdown', 'Shock', 'Man Down detection', 'Tamper Alarm', 'Event Message', 'Battery Consumption', '', '', 'GPS Limit'];
var operationModeArray:string[] = ['Standby mode', 'Periodic mode', 'Timing mode', 'Motion mode'];
var rebootReasonArray:string[] = ['Restart after power failure', 'Bluetooth command request', 'LoRaWAN command request', 'Power on after normal power off'];
var positionTypeArray:string[] = ['WIFI positioning success', 'Bluetooth positioning success', 'GPS positioning success'];
var posFailedReasonArray:string[] = [
	'WIFI positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)'
	, 'WIFI positioning strategies timeout (Please increase the WIFI positioning timeout via MKLoRa app)'
	, 'WIFI module is not detected, the WIFI module itself works abnormally'
	, 'Bluetooth positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)'
	, 'Bluetooth positioning strategies timeout (Please increase the Bluetooth positioning timeout via MKLoRa app)'
	, 'Bluetooth broadcasting in progress (Please reduce the Bluetooth broadcast timeout or avoid Bluetooth positioning when Bluetooth broadcasting in process via MKLoRa app)'
	, 'GPS position time budget over (Pls increase the GPS budget via MKLoRa app)'
	, 'GPS coarse positioning timeout (Pls increase coarse positioning timeout or increase coarse accuracy target via MKLoRa app)'
	, 'GPS fine positioning timeout (Pls increase fine positioning timeout or increase fine accuracy target via MKLoRa app)'
	, 'GPS positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)'
	, 'GPS aiding positioning timeout (Please adjust GPS autonomous latitude and autonomous longitude)'
	, 'GPS cold start positioning timeout (The gps signal current environment isn’t very good, please leave the device in a more open area)'
	, 'Interrupted by Downlink for Position'
	, 'Interrupted positioning at start of movement(the movement ends too quickly, resulting in not enough time to complete the positioning)'
	, 'Interrupted positioning at end of movement(the movement restarted too quickly, resulting in not enough time to complete the positioning)'
];
var shutdownTypeArray:string[] = ['Bluetooth command to turn off the device', 'LoRaWAN command to turn off the device', 'Magnetic to turn off the device'];
var eventTypeArray:string[] = [
	'Start of movement'
	, 'In movement'
	, 'End of movement'
	, 'Uplink Payload triggered by downlink message'
];


function Decoder(bytes: number[], fPort: number, groupID: string):{ [key: string]: any }[] {
    const payloadList: { [key: string]: any }[] = [];

    const payload_type = payloadTypeArray[fPort - 1];
    payloadList.push(getPayloadData('payload_type', payload_type, groupID));

    if (fPort <= 10) {
        var operationModeCode = bytes[0] & 0x03;
		const operation_mode = operationModeArray[operationModeCode];
        payloadList.push(getPayloadData('operation_mode', operation_mode, groupID));

		var batteryLevelCode = bytes[0] & 0x04;
		const battery_level = batteryLevelCode == 0 ? 'Normal' : 'Low battery';
        payloadList.push(getPayloadData('battery_level', battery_level, groupID));

		var tamperAlarmCode = bytes[0] & 0x08;
		const tamper_alarm = tamperAlarmCode == 0 ? 'Not triggered' : 'Triggered';
        payloadList.push(getPayloadData('tamper_alarm', tamper_alarm, groupID));

		var manDownStatusCode = bytes[0] & 0x10;
		const mandown_status = manDownStatusCode == 0 ? 'Not in idle' : 'In idle';
        payloadList.push(getPayloadData('mandown_status', mandown_status, groupID));

		var motionStateSinceLastPaylaodCode = bytes[0] & 0x20;
		const motion_state_since_last_paylaod = motionStateSinceLastPaylaodCode == 0 ? 'No' : 'Yes';
        payloadList.push(getPayloadData('motion_state_since_last_paylaod', motion_state_since_last_paylaod, groupID));

        if (fPort == 2 || fPort == 3) {
			var positioningTypeCode = bytes[0] & 0x40;
			const positioning_type = positioningTypeCode == 0 ? 'Normal' : 'Downlink for position';
            payloadList.push(getPayloadData('positioning_type', positioning_type, groupID));
		}

        const temperature = signedHexToInt(bytesToHexString(bytes, 1, 1)).toString() + '°C';
		payloadList.push(getPayloadData('temperature', temperature, groupID));

		const ack = bytes[2] & 0x0f;
        payloadList.push(getPayloadData('ack', ack, groupID));

		const battery_voltage = ((22 + ((bytes[2] >> 4) & 0x0f)) / 10).toString() + 'V';
        payloadList.push(getPayloadData('battery_voltage', battery_voltage, groupID));
    }

    if (fPort == 1) {
		var rebootReasonCode = bytesToInt(bytes, 3, 1);
		// dev_info.reboot_reason_code = rebootReasonCode;
		const reboot_reason = rebootReasonArray[rebootReasonCode];
        payloadList.push(getPayloadData('reboot_reason', reboot_reason, groupID));

		var majorVersion = (bytes[4] >> 6) & 0x03;
		var minorVersion = (bytes[4] >> 4) & 0x03;
		var patchVersion = bytes[4] & 0x0f;
		var firmwareVersion = 'V' + majorVersion.toString() + '.' + minorVersion.toString() + '.' + patchVersion.toString();
		const firmware_version = firmwareVersion;
        payloadList.push(getPayloadData('firmware_version', firmware_version, groupID));

		var activityCount = bytesToInt(bytes, 5, 4);
		const activity_count = activityCount;
        payloadList.push(getPayloadData('activity_count', activity_count, groupID));
	} else if (fPort == 2) {
		var parse_len = 3; // common head is 3 byte
		const positionTypeCode = bytes[parse_len++];
		const position_success_type = positionTypeArray[positionTypeCode];
        payloadList.push(getPayloadData('position_success_type', position_success_type, groupID));

		const year = bytes[parse_len] * 256 + bytes[parse_len + 1];
		parse_len += 2;
		const mon = bytes[parse_len++];
		const days = bytes[parse_len++];
		const hour = bytes[parse_len++];
		const minute = bytes[parse_len++];
		const sec = bytes[parse_len++];
		const timezone = bytes[parse_len++];
        payloadList.push(getPayloadData('timezone', timezone, groupID));

        var timestamp = '';
		if (timezone > 0x80) {
			timestamp = year.toString() + '-' + mon.toString() + '-' + days.toString() + ' ' + hour.toString() + ':' + minute.toString() + ':' + sec.toString()
             + '  TZ:' + (timezone - 0x100).toString();
		}
		else {
			timestamp = year.toString() + '-' + mon.toString() + '-' + days.toString() + ' ' + hour.toString() + ':' + minute.toString() + ':' 
            + sec.toString() + '  TZ:' + timezone.toString();
		}
        payloadList.push(getPayloadData('timestamp', timestamp, groupID));

		const datalen = bytes[parse_len++];

		if (positionTypeCode == 0 || positionTypeCode == 1) {
			for (var i = 0; i < (datalen / 7); i++) {
				const mac = bytesToHexString(bytes,parse_len,6);
                payloadList.push(getPayloadData('positioning_success_mac' + i.toString(), mac, groupID));
				parse_len += 6;
				const rssi = (bytes[parse_len++] - 256).toString() + 'dBm';
                payloadList.push(getPayloadData('positioning_success_rssi' + i.toString(), rssi, groupID));
			}
		} else {
			var lat = bytesToInt(bytes, parse_len, 4);
			parse_len += 4;
			var lon = bytesToInt(bytes, parse_len, 4);
			parse_len += 4;

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

			const pdop = (bytes[parse_len] / 10).toFixed(1).toString();
            payloadList.push(getPayloadData('pdop', pdop, groupID));

		}
	} else if (fPort == 3) {
		var parse_len = 3;
		var failedTypeCode = bytesToInt(bytes, parse_len++, 1);
		const reasons_for_positioning_failure = posFailedReasonArray[failedTypeCode];
        payloadList.push(getPayloadData('reasons_for_positioning_failure', reasons_for_positioning_failure, groupID));

		const datalen = bytes[parse_len++];
		if (failedTypeCode <= 5) //wifi and ble reason
		{
			if (datalen) {
				for (var i = 0; i < (datalen / 7); i++) {
					const mac = bytesToHexString(bytes,parse_len,6);
                    payloadList.push(getPayloadData('positioning_success_mac' + i.toString(), mac, groupID));
				    parse_len += 6;
				    const rssi = (bytes[parse_len++] - 256).toString() + 'dBm';
                    payloadList.push(getPayloadData('positioning_success_rssi' + i.toString(), rssi, groupID));
			    }
			}
		} else if (failedTypeCode <= 11) //gps reason
		{
			var pdop = '';
			if (bytes[parse_len] != 0xff)
				pdop = (bytes[parse_len] / 10).toString()
			else
				pdop = 'unknow';
            payloadList.push(getPayloadData('pdop', pdop, groupID));

            parse_len ++;

			const gps_satellite_cn = bytes[parse_len].toString() + '-' + bytes[parse_len + 1].toString() + '-' + bytes[parse_len + 2].toString() + '-' + bytes[parse_len + 3].toString();
            payloadList.push(getPayloadData('gps_satellite_cn', gps_satellite_cn, groupID));
        }
	} else if (fPort == 4) {
		var shutdownTypeCode = bytesToInt(bytes, 3, 1);
		const shutdown_type = shutdownTypeArray[shutdownTypeCode];
        payloadList.push(getPayloadData('shutdown_type', shutdown_type, groupID));
	} else if (fPort == 5) {
		const number_of_shocks = bytesToInt(bytes, 3, 2);
        payloadList.push(getPayloadData('number_of_shocks', number_of_shocks, groupID));
	} else if (fPort == 6) {
		const total_idle_time = bytesToInt(bytes, 3, 2);
        payloadList.push(getPayloadData('total_idle_time', total_idle_time, groupID));
	} else if (fPort == 7) {
		var parse_len = 3; // common head is 3 byte
		const year = bytesToInt(bytes, parse_len, 2).toString();
		parse_len += 2;
		const mon = bytes[parse_len++].toString();
		const days = bytes[parse_len++].toString();
		const hour = bytes[parse_len++].toString();
		const minute = bytes[parse_len++].toString();
		const sec = bytes[parse_len++].toString();

		const timezone = bytes[parse_len++];
        payloadList.push(getPayloadData('timezone', timezone, groupID));

        var timestamp = '';
		if (timezone > 0x80) {
		    timestamp = year + '-' + mon + '-' + days + ' ' + hour + ':' + minute + ':' + sec + '  TZ:' + (timezone - 0x100);
		}
		else {
			timestamp = year + '-' + mon + '-' + days + ' ' + hour + ':' + minute + ':' + sec + '  TZ:' + timezone;
		}
        payloadList.push(getPayloadData('timestamp', timestamp, groupID));
	} else if (fPort == 8) {
		var eventTypeCode = bytesToInt(bytes, 3, 1);
		const event_type = eventTypeArray[eventTypeCode];
        payloadList.push(getPayloadData('event_type', event_type, groupID));
	} else if (fPort == 9) {
		var parse_len = 3;
		const gps_work_time = bytesToInt(bytes, parse_len, 4);
        payloadList.push(getPayloadData('gps_work_time', gps_work_time, groupID));
		parse_len += 4;
		const wifi_work_time = bytesToInt(bytes, parse_len, 4);
        payloadList.push(getPayloadData('wifi_work_time', wifi_work_time, groupID));
		parse_len += 4;
		const ble_scan_work_time = bytesToInt(bytes, parse_len, 4);
        payloadList.push(getPayloadData('ble_scan_work_time', ble_scan_work_time, groupID));
		parse_len += 4;
		const ble_adv_work_time = bytesToInt(bytes, parse_len, 4);
        payloadList.push(getPayloadData('ble_adv_work_time', ble_adv_work_time, groupID));
		parse_len += 4;
		const lora_work_time = bytesToInt(bytes, parse_len, 4);
        payloadList.push(getPayloadData('lora_work_time', lora_work_time, groupID));
		parse_len += 4;
	}else if (fPort == 12) {

		var operationModeCode = bytes[0] & 0x03;
		const operation_mode = operationModeArray[operationModeCode];
        payloadList.push(getPayloadData('operation_mode', operation_mode, groupID));

		var batteryLevelCode = bytes[0] & 0x04;
		const battery_level = batteryLevelCode == 0 ? 'Normal' : 'Low battery';
        payloadList.push(getPayloadData('battery_level', battery_level, groupID));

		var tamperAlarmCode = bytes[0] & 0x08;
		const tamper_alarm = tamperAlarmCode == 0 ? 'Not triggered' : 'Triggered';
        payloadList.push(getPayloadData('tamper_alarm', tamper_alarm, groupID));

		var manDownStatusCode = bytes[0] & 0x10;
		const mandown_status = manDownStatusCode == 0 ? 'Not in idle' : 'In idle';
        payloadList.push(getPayloadData('mandown_status', mandown_status, groupID));

		var motionStateSinceLastPaylaodCode = bytes[0] & 0x20;
		const motion_state_since_last_paylaod = motionStateSinceLastPaylaodCode == 0 ? 'No' : 'Yes';
        payloadList.push(getPayloadData('motion_state_since_last_paylaod', motion_state_since_last_paylaod, groupID));

		var positioningTypeCode = bytes[0] & 0x40;
		const positioning_type = positioningTypeCode == 0 ? 'Normal' : 'Downlink for position';
        payloadList.push(getPayloadData('positioning_type', positioning_type, groupID));


		const lorawan_downlink_count = bytes[1] & 0x0f;
        payloadList.push(getPayloadData('lorawan_downlink_count', lorawan_downlink_count, groupID));

		const battery_voltage = ((22 + ((bytes[1] >> 4) & 0x0f)) / 10).toFixed(1).toString() + 'V';
        payloadList.push(getPayloadData('battery_voltage', battery_voltage, groupID));

		var parse_len = 2;
		lat = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;
		lon = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;

		if (lat > 0x80000000)
			lat = lat - 0x100000000;
		if (lon > 0x80000000)
			lon = lon - 0x100000000;

		const latitude = lat / 10000000;
        payloadList.push(getPayloadData('latitude', latitude, groupID));
		const longitude = lon / 10000000;
        payloadList.push(getPayloadData('longitude', longitude, groupID));
		const pdop = (bytes[parse_len] / 10).toFixed(1).toString();
        payloadList.push(getPayloadData('pdop', pdop, groupID));
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