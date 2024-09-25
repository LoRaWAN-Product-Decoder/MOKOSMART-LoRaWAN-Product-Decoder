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
// Decode uplink function.
//
// Input is an object with the following fields:
// - bytes = Byte array containing the uplink payload, e.g. [255, 230, 255, 0]
// - fPort = Uplink fPort.
// - variables = Object containing the configured device variables.
//
// Output must be an object with the following fields:
// - data = Object representing the decoded payload.
function decodeUplink(input) {
	var bytes = input.bytes;
    var fPort = input.fPort;
	var dev_info = {};
    var data = {};
	if (fPort == 0 || fPort == 100) {
		dev_info.data = data;
		return dev_info;
	}
    data.port = fPort;
	data.hex_format_payload = bytesToHexString(bytes, 0, bytes.length);
	data.payload_type = payloadTypeArray[fPort - 1];

	var date = new Date();
    var timestamp = Math.trunc(date.getTime() / 1000);
    var offsetHours = Math.abs(Math.floor(date.getTimezoneOffset() / 60));
    data.timestamp = timestamp;
    data.time = parse_time(timestamp, offsetHours);
    data.timezone = timezone_decode(offsetHours * 2);
	//common frame head
	if (fPort <= 10) {
		var operationModeCode = bytes[0] & 0x03;
		// data.operation_mode_code = operationModeCode;
		data.operation_mode = operationModeArray[operationModeCode];

		var batteryLevelCode = bytes[0] & 0x04;
		// data.battery_level_code = batteryLevelCode;
		data.battery_level = batteryLevelCode == 0 ? "Normal" : "Low battery";

		var tamperAlarmCode = bytes[0] & 0x08;
		data.tamper_alarm_code = tamperAlarmCode;
		data.tamper_alarm = tamperAlarmCode == 0 ? "Not triggered" : "Triggered";

		var manDownStatusCode = bytes[0] & 0x10;
		// data.mandown_status_code = manDownStatusCode;
		data.mandown_status = manDownStatusCode == 0 ? "Not in idle" : "In idle";

		var motionStateSinceLastPaylaodCode = bytes[0] & 0x20;
		// data.motion_state_since_last_paylaod_code = motionStateSinceLastPaylaodCode;
		data.motion_state_since_last_paylaod = motionStateSinceLastPaylaodCode == 0 ? "No" : "Yes";

		if (fPort == 2 || fPort == 3) {
			var positioningTypeCode = bytes[0] & 0x40;
			// data.positioning_type_code = positioningTypeCode;
			data.positioning_type = positioningTypeCode == 0 ? "Normal" : "Downlink for position";
		}

		var temperature = signedHexToInt(bytesToHexString(bytes, 1, 1)) + '°C';
		data.temperature = temperature;

		data.ack = bytes[2] & 0x0f;
		data.battery_voltage = (22 + ((bytes[2] >> 4) & 0x0f)) / 10 + "V";
	}
	if (fPort == 1) {
		var rebootReasonCode = bytesToInt(bytes, 3, 1);
		// data.reboot_reason_code = rebootReasonCode;
		data.reboot_reason = rebootReasonArray[rebootReasonCode];

		var majorVersion = (bytes[4] >> 6) & 0x03;
		var minorVersion = (bytes[4] >> 4) & 0x03;
		var patchVersion = bytes[4] & 0x0f;
		var firmwareVersion = 'V' + majorVersion + '.' + minorVersion + '.' + patchVersion;
		data.firmware_version = firmwareVersion;

		var activityCount = bytesToInt(bytes, 5, 4);
		data.activity_count = activityCount;
	} else if (fPort == 2) {
		var parse_len = 3; // common head is 3 byte
		var datas = [];
		positionTypeCode = bytes[parse_len++];
		data.position_success_type = positionTypeArray[positionTypeCode];
		data.position_success_type_code = positionTypeCode;

		year = bytes[parse_len] * 256 + bytes[parse_len + 1];
		parse_len += 2;
		mon = bytes[parse_len++];
		days = bytes[parse_len++];
		hour = bytes[parse_len++];
		minute = bytes[parse_len++];
		sec = bytes[parse_len++];
		timezone = bytes[parse_len++];

		if (timezone > 0x80) {
			data.time_str = year + "-" + mon + "-" + days + " " + hour + ":" + minute + ":" + sec + "  TZ:" + (timezone - 0x100);
		}
		else {
			data.time_str = year + "-" + mon + "-" + days + " " + hour + ":" + minute + ":" + sec + "  TZ:" + timezone;
		}
		datalen = bytes[parse_len++];

		if (positionTypeCode == 0 || positionTypeCode == 1) {
			for (var i = 0; i < (datalen / 7); i++) {
				var item = {};
				item.mac = substringBytes(bytes, parse_len, 6);
				parse_len += 6;
				item.rssi = bytes[parse_len++] - 256 + "dBm";
				datas.push(item);
			}
			data.mac_data = datas;
		} else {
			lat = bytesToInt(bytes, parse_len, 4);
			parse_len += 4;
			lon = bytesToInt(bytes, parse_len, 4);
			parse_len += 4;

			if (lat > 0x80000000)
				lat = lat - 0x100000000;
			if (lon > 0x80000000)
				lon = lon - 0x100000000;

			data.latitude = lat / 10000000;
			data.longitude = lon / 10000000;
			data.pdop = bytes[parse_len] / 10;
		}
	} else if (fPort == 3) {
		var parse_len = 3;
		var datas = [];
		var failedTypeCode = bytesToInt(bytes, parse_len++, 1);
		data.reasons_for_positioning_failure = posFailedReasonArray[failedTypeCode];
		datalen = bytes[parse_len++];
		if (failedTypeCode <= 5) //wifi and ble reason
		{
			if (datalen) {
				for (var i = 0; i < (datalen / 7); i++) {
					var data = {};
					data.mac = substringBytes(bytes, parse_len, 6);
					parse_len += 6;
					data.rssi = bytes[parse_len++] - 256 + "dBm";
					datas.push(data);
				}
				data.mac_data = datas;
			}
		} else if (failedTypeCode <= 11) //gps reason
		{
			pdop = bytes[parse_len++];
			if (pdop != 0xff)
				data.pdop = pdop / 10
			else
				data.pdop = "unknow";
			data.gps_satellite_cn = bytes[parse_len] + "-" + bytes[parse_len + 1] + "-" + bytes[parse_len + 2] + "-" + bytes[parse_len + 3];
		}
	} else if (fPort == 4) {
		var shutdownTypeCode = bytesToInt(bytes, 3, 1);
		// data.shutdown_type_code = shutdownTypeCode;
		data.shutdown_type = shutdownTypeArray[shutdownTypeCode];
	} else if (fPort == 5) {
		data.number_of_shocks = bytesToInt(bytes, 3, 2);
	} else if (fPort == 6) {
		data.total_idle_time = bytesToInt(bytes, 3, 2);
	} else if (fPort == 7) {
		var parse_len = 3; // common head is 3 byte
		year = bytesToInt(bytes, parse_len, 2);
		parse_len += 2;
		mon = formatNumber(bytes[parse_len++]);
		days = formatNumber(bytes[parse_len++]);
		hour = formatNumber(bytes[parse_len++]);
		minute = formatNumber(bytes[parse_len++]);
		sec = formatNumber(bytes[parse_len++]);
		timezone = bytes[parse_len++];

		if (timezone > 0x80) {
			data.time_str = year + "-" + mon + "-" + days + " " + hour + ":" + minute + ":" + sec + " TZ:" + (timezone - 0x100);
		}
		else {
			data.time_str = year + "-" + mon + "-" + days + " " + hour + ":" + minute + ":" + sec + " TZ:" + timezone;
		}
	} else if (fPort == 8) {
		var eventTypeCode = bytesToInt(bytes, 3, 1);
		// data.event_type_code = eventTypeCode;
		data.event_type = eventTypeArray[eventTypeCode];
	} else if (fPort == 9) {
		var parse_len = 3;
		data.gps_work_time = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;
		data.wifi_work_time = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;
		data.ble_scan_work_time = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;
		data.ble_adv_work_time = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;
		data.lora_work_time = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;
	} else if (fPort == 10) {
		//
	} else if (fPort == 11) {
		//
	} else if (fPort == 12) {

		var operationModeCode = bytes[0] & 0x03;
		// data.operation_mode_code = operationModeCode;
		data.operation_mode = operationModeArray[operationModeCode];

		var batteryLevelCode = bytes[0] & 0x04;
		// data.battery_level_code = batteryLevelCode;
		data.battery_level = batteryLevelCode == 0 ? "Normal" : "Low battery";

		var tamperAlarmCode = bytes[0] & 0x08;
		// data.tamper_alarm_code = tamperAlarmCode;
		data.tamper_alarm = tamperAlarmCode == 0 ? "Not triggered" : "Triggered";

		var manDownStatusCode = bytes[0] & 0x10;
		// data.mandown_status_code = manDownStatusCode;
		data.mandown_status = manDownStatusCode == 0 ? "Not in idle" : "In idle";

		var motionStateSinceLastPaylaodCode = bytes[0] & 0x20;
		// data.motion_state_since_last_paylaod_code = motionStateSinceLastPaylaodCode;
		data.motion_state_since_last_paylaod = motionStateSinceLastPaylaodCode == 0 ? "No" : "Yes";

		var positioningTypeCode = bytes[0] & 0x40;
		// data.positioning_type_code = positioningTypeCode;
		data.positioning_type = positioningTypeCode == 0 ? "Normal" : "Downlink for position";


		data.lorawan_downlink_count = bytes[1] & 0x0f;
		data.battery_voltage = (22 + ((bytes[1] >> 4) & 0x0f)) / 10 + "V";

		var parse_len = 2;
		lat = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;
		lon = bytesToInt(bytes, parse_len, 4);
		parse_len += 4;

		if (lat > 0x80000000)
			lat = lat - 0x100000000;
		if (lon > 0x80000000)
			lon = lon - 0x100000000;

		data.latitude = lat / 10000000;
		data.longitude = lon / 10000000;
		data.pdop = bytes[parse_len] / 10;
	}
	dev_info.data = data;
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



function timezone_decode(tz) {
    var tz_str = "UTC";
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

    var d = new Date(timestamp * 1000);
    //d.setUTCSeconds(1660202724);

    var time_str = "";
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

function getData(hex) {
	var length = hex.length;
	var datas = [];
	for (var i = 0; i < length; i += 2) {
		var start = i;
		var end = i + 2;
		var data = parseInt("0x" + hex.substring(start, end));
		datas.push(data);
	}
	return datas;
}

// var input = {};
// input.fPort = 7;
// input.bytes = getData("091ce107e8090a08043600");
// console.log(decodeUplink(input));
