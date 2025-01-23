var payloadTypeArray = ["Heartbeat", "Location Fixed", "Location Failure", "Shutdown", "Shock", "Man Down detection", "Tamper Alarm", "Event Message", "Battery Consumption", "", "", "GPS Limit"];
var operationModeArray = ["Standby mode", "Periodic mode", "Timing mode", "Motion mode"];
var rebootReasonArray = ["Restart after power failure", "Bluetooth command request", "LoRaWAN command request", "Power on after normal power off"];
var positionTypeArray = ["WIFI positioning success", "Bluetooth positioning success", "GPS positioning success"];
var posFailedReasonArray = [
	"WIFI positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)"
	, "WIFI positioning strategies timeout (Please increase the WIFI positioning timeout via MKLoRa app)"
	, "WIFI module is not detected, the WIFI module itself works abnormally"
	, "Bluetooth positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)"
	, "Bluetooth positioning strategies timeout (Please increase the Bluetooth positioning timeout via MKLoRa app)"
	, "Bluetooth broadcasting in progress (Please reduce the Bluetooth broadcast timeout or avoid Bluetooth positioning when Bluetooth broadcasting in process via MKLoRa app)"
	, "GPS position time budget over (Pls increase the GPS budget via MKLoRa app)"
	, "GPS coarse positioning timeout (Pls increase coarse positioning timeout or increase coarse accuracy target via MKLoRa app)"
	, "GPS fine positioning timeout (Pls increase fine positioning timeout or increase fine accuracy target via MKLoRa app)"
	, "GPS positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)"
	, "GPS aiding positioning timeout (Please adjust GPS autonomous latitude and autonomous longitude)"
	, "GPS cold start positioning timeout (The gps signal current environment isn’t very good, please leave the device in a more open area)"
	, "Interrupted by Downlink for Position"
	, "Interrupted positioning at start of movement(the movement ends too quickly, resulting in not enough time to complete the positioning)"
	, "Interrupted positioning at end of movement(the movement restarted too quickly, resulting in not enough time to complete the positioning)"
];
var shutdownTypeArray = ["Bluetooth command to turn off the device", "LoRaWAN command to turn off the device", "Magnetic to turn off the device"];
var eventTypeArray = [
	"Start of movement"
	, "In movement"
	, "End of movement"
	, "Uplink Payload triggered by downlink message"
];
function Decode(fPort, bytes) {
	var dev_info = {};
    dev_info.port = fPort;
	dev_info.payload_type = payloadTypeArray[fPort - 1];
	//common frame head
	if (fPort <= 10) {
		var operationModeCode = bytes[0] & 0x03;
		// dev_info.operation_mode_code = operationModeCode;
		dev_info.operation_mode = operationModeArray[operationModeCode];

		var batteryLevelCode = bytes[0] & 0x04;
		// dev_info.battery_level_code = batteryLevelCode;
		dev_info.battery_level = batteryLevelCode == 0 ? "Normal" : "Low battery";

		var tamperAlarmCode = bytes[0] & 0x08;
		// dev_info.tamper_alarm_code = tamperAlarmCode;
		dev_info.tamper_alarm = tamperAlarmCode == 0 ? "Not triggered" : "Triggered";

		var manDownStatusCode = bytes[0] & 0x10;
		// dev_info.mandown_status_code = manDownStatusCode;
		dev_info.mandown_status = manDownStatusCode == 0 ? "Not in idle" : "In idle";

		var motionStateSinceLastPaylaodCode = bytes[0] & 0x20;
		// dev_info.motion_state_since_last_paylaod_code = motionStateSinceLastPaylaodCode;
		dev_info.motion_state_since_last_paylaod = motionStateSinceLastPaylaodCode == 0 ? "No" : "Yes";

		if (fPort == 2 || fPort == 3) {
			var positioningTypeCode = bytes[0] & 0x40;
			// dev_info.positioning_type_code = positioningTypeCode;
			dev_info.positioning_type = positioningTypeCode == 0 ? "Normal" : "Downlink for position";
		}

		var temperature = signedHexToInt(bytesToHexString(bytes, 1, 1)) + '°C';
		dev_info.temperature = temperature;

		dev_info.ack = bytes[2] & 0x0f;
		dev_info.battery_voltage = (22 + ((bytes[2] >> 4) & 0x0f)) / 10 + "V";
	}
	if (fPort == 1) {
		var rebootReasonCode = bytesToInt(bytes, 3, 1);
		// dev_info.reboot_reason_code = rebootReasonCode;
		dev_info.reboot_reason = rebootReasonArray[rebootReasonCode];

		var majorVersion = (bytes[4] >> 6) & 0x03;
		var minorVersion = (bytes[4] >> 4) & 0x03;
		var patchVersion = bytes[4] & 0x0f;
		var firmwareVersion = 'V' + majorVersion + '.' + minorVersion + '.' + patchVersion;
		dev_info.firmware_version = firmwareVersion;

		var activityCount = bytesToInt(bytes, 5, 4);
		dev_info.activity_count = activityCount;
	} else if (fPort == 2) {
		var parse_len = 3; // common head is 3 byte
		var datas = [];
		positionTypeCode = bytes[parse_len++];
		dev_info.position_success_type = positionTypeArray[positionTypeCode];

		year = bytes[parse_len] * 256 + bytes[parse_len + 1];
		parse_len += 2;
		mon = bytes[parse_len++];
		days = bytes[parse_len++];
		hour = bytes[parse_len++];
		minute = bytes[parse_len++];
		sec = bytes[parse_len++];
		timezone = bytes[parse_len++];

		if (timezone > 0x80) {
			dev_info.timestamp = year + "-" + mon + "-" + days + " " + hour + ":" + minute + ":" + sec + "  TZ:" + (timezone - 0x100);
		}
		else {
			dev_info.timestamp = year + "-" + mon + "-" + days + " " + hour + ":" + minute + ":" + sec + "  TZ:" + timezone;
		}
		datalen = bytes[parse_len++];

		if (positionTypeCode == 0 || positionTypeCode == 1) {
			for (var i = 0; i < (datalen / 7); i++) {
				var tempData = {};
				tempData.mac = substringBytes(bytes, parse_len, 6);
				parse_len += 6;
				tempData.rssi = bytes[parse_len++] - 256 + "dBm";
				datas.push(tempData);
			}
			dev_info.mac_data = datas;
		} else {
			lat = bytesToInt(bytes, parse_len, 4);
			parse_len += 4;
			lon = bytesToInt(bytes, parse_len, 4);
			parse_len += 4;

			if (lat > 0x80000000)
				lat = lat - 0x100000000;
			if (lon > 0x80000000)
				lon = lon - 0x100000000;

			dev_info.latitude = lat / 10000000;
			dev_info.longitude = lon / 10000000;
			dev_info.pdop = bytes[parse_len] / 10;
		}
	} else if (fPort == 3) {
		var parse_len = 3;
		var datas = [];
		var failedTypeCode = bytesToInt(bytes, parse_len++, 1);
		dev_info.reasons_for_positioning_failure = posFailedReasonArray[failedTypeCode];
		datalen = bytes[parse_len++];
		if (reason <= 5) //wifi and ble reason
		{
			if (datalen) {
				for (var i = 0; i < (datalen / 7); i++) {
					var data = {};
					data.mac = substringBytes(bytes, parse_len, 6);
					parse_len += 6;
					data.rssi = bytes[parse_len++] - 256 + "dBm";
					datas.push(data);
				}
				dev_info.mac_data = datas;
			}
		} else if (reason <= 11) //gps reason
		{
			pdop = bytes[parse_len++];
			if (pdop != 0xff)
				dev_info.pdop = pdop / 10
			else
				dev_info.pdop = "unknow";
			dev_info.gps_satellite_cn = bytes[parse_len] + "-" + bytes[parse_len + 1] + "-" + bytes[parse_len + 2] + "-" + bytes[parse_len + 3];
		}
	} else if (fPort == 4) {
		var shutdownTypeCode = bytesToInt(bytes, 3, 1);
		// data.shutdown_type_code = shutdownTypeCode;
		dev_info.shutdown_type = shutdownTypeArray[shutdownTypeCode];
	} else if (fPort == 5) {
		dev_info.number_of_shocks = bytesToInt(bytes, 3, 2);
	} else if (fPort == 6) {
		dev_info.total_idle_time = bytesToInt(bytes, 3, 2);
	} else if (fPort == 7) {
		var parse_len = 3; // common head is 3 byte
		year = bytesToInt(bytes, parse_len, 1);
		parse_len += 2;
		mon = bytes[parse_len++];
		days = bytes[parse_len++];
		hour = bytes[parse_len++];
		minute = bytes[parse_len++];
		sec = bytes[parse_len++];
		timezone = bytes[parse_len++];

		if (timezone > 0x80) {
			dev_info.timestamp = year + "-" + mon + "-" + days + " " + hour + ":" + minute + ":" + sec + "  TZ:" + (timezone - 0x100);
		}
		else {
			dev_info.timestamp = year + "-" + mon + "-" + days + " " + hour + ":" + minute + ":" + sec + "  TZ:" + timezone;
		}
	} else if (fPort == 8) {
		var eventTypeCode = bytesToInt(bytes, 3, 1);
		// data.event_type_code = eventTypeCode;
		dev_info.event_type = eventTypeArray[eventTypeCode];
	} else if (fPort == 9) {
		var parse_len = 3;
		dev_info.device_work_time = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;
		dev_info.ble_adv_num = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;
		dev_info.axis_awaken_time = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;
		dev_info.ble_work_time = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;
		dev_info.wifi_work_time = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;
		dev_info.gps_work_time = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;
		dev_info.lora_send_num = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;
		dev_info.lora_power = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;
		dev_info.battery_consume = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;
		dev_info.motion_static_fix_upload_num = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;
		dev_info.motion_move_fix_upload_num = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;
	} else if (fPort == 10) {
		//
	} else if (fPort == 11) {
		//
	} else if (fPort == 12) {

		var operationModeCode = bytes[0] & 0x03;
		// dev_info.operation_mode_code = operationModeCode;
		dev_info.operation_mode = operationModeArray[operationModeCode];

		var batteryLevelCode = bytes[0] & 0x04;
		// dev_info.battery_level_code = batteryLevelCode;
		dev_info.battery_level = batteryLevelCode == 0 ? "Normal" : "Low battery";

		var tamperAlarmCode = bytes[0] & 0x08;
		// dev_info.tamper_alarm_code = tamperAlarmCode;
		dev_info.tamper_alarm = tamperAlarmCode == 0 ? "Not triggered" : "Triggered";

		var manDownStatusCode = bytes[0] & 0x10;
		// dev_info.mandown_status_code = manDownStatusCode;
		dev_info.mandown_status = manDownStatusCode == 0 ? "Not in idle" : "In idle";

		var motionStateSinceLastPaylaodCode = bytes[0] & 0x20;
		// dev_info.motion_state_since_last_paylaod_code = motionStateSinceLastPaylaodCode;
		dev_info.motion_state_since_last_paylaod = motionStateSinceLastPaylaodCode == 0 ? "No" : "Yes";

		var positioningTypeCode = bytes[0] & 0x40;
		// dev_info.positioning_type_code = positioningTypeCode;
		dev_info.positioning_type = positioningTypeCode == 0 ? "Normal" : "Downlink for position";


		dev_info.lorawan_downlink_count = bytes[1] & 0x0f;
		dev_info.battery_voltage = (22 + ((bytes[1] >> 4) & 0x0f)) / 10 + "V";

		var parse_len = 2;
		lat = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;
		lon = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;

		if (lat > 0x80000000)
			lat = lat - 0x100000000;
		if (lon > 0x80000000)
			lon = lon - 0x100000000;

		dev_info.latitude = lat / 10000000;
		dev_info.longitude = lon / 10000000;
		dev_info.pdop = bytes[parse_len] / 10;
	}
	return dev_info;
}

function bytesToHexString(bytes, start, len) {
	var char = [];
	for (var i = 0; i < len; i++) {
		var data = bytes[start + i].toString(16);
		var dataHexStr = ("0x" + data) < 0x10 ? ("0" + data) : data;
		char.push(dataHexStr);
	}
	return char.join("");
}

function bytesToString(bytes, start, len) {
	var char = [];
	for (var i = 0; i < len; i++) {
		char.push(String.fromCharCode(bytes[start + i]));
	}
	return char.join("");
}

function bytesToInt(bytes, start, len) {
	var value = 0;
	for (var i = 0; i < len; i++) {
		var m = ((len - 1) - i) * 8;
		value = value | bytes[start + i] << m;
	}
	// var value = ((bytes[start] << 24) | (bytes[start + 1] << 16) | (bytes[start + 2] << 8) | (bytes[start + 3]));
	return value;
}

function substringBytes(bytes, start, len) {
	var char = [];
	for (var i = 0; i < len; i++) {
		char.push("0x" + bytes[start + i].toString(16) < 0X10 ? ("0" + bytes[start + i].toString(16)) : bytes[start + i].toString(16));
	}
	return char.join("");
}

function signedHexToInt(hexStr) {
	var twoStr = parseInt(hexStr, 16).toString(2); // 将十六转十进制，再转2进制
	var bitNum = hexStr.length * 4; // 1个字节 = 8bit ，0xff 一个 "f"就是4位
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
	var twoStr_unsign = "";
	twoStr = parseInt(twoStr, 2) - 1; // 补码：(负数)反码+1，符号位不变；相对十进制来说也是 +1，但这里是负数，+1就是绝对值数据-1
	twoStr = twoStr.toString(2);
	twoStr_unsign = twoStr.substring(1, bitNum); // 舍弃首位(符号位)
	// 去除首字符，将0转为1，将1转为0   反码
	twoStr_unsign = twoStr_unsign.replace(/0/g, "z");
	twoStr_unsign = twoStr_unsign.replace(/1/g, "0");
	twoStr_unsign = twoStr_unsign.replace(/z/g, "1");
	twoStr = parseInt(-twoStr_unsign, 2);
	return twoStr;
}
