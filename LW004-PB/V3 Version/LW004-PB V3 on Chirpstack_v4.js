//LW004-PB_V3 Payload Decoder rule
//Creation time:2022-09-20 
//Creator:taojianfeng
//Suitable firmware versions:LW004-PB V3.0.4 
//Programming languages:Javascript
//Suitable platforms:Chirpstack

var payloadTypeArray = ["Event Message", "Device Information", "Shut Down", "Heartbeat", "Low Power", "GPS Location Fixed", "GPS Location Failure", "Bluetooth Location Fixed", "Bluetooth Location Failure", "GPS Location Fixed of auxiliary operation", "GPS Location Failure of auxiliary operation", "Bluetooth Location Fixed of auxiliary operation", "Bluetooth Location Failure of auxiliary operation"];
var deviceModeArray = [
	"Standby mode"
	, "Timing mode"
	, "Periodic mode"
	, "Stationary state in motion mode"
	, "Start of movement in motion mode"
	, "In movement for motion mode"
	, "End of movement in motion mode"
];
var auxiliaryOperationArray = [
	"No auxiliary operation"
	, "Downlink for position"
	, "Man Down status"
	, "Alert alarm"
	, "SOS alarm"];
var eventTypeArray = [
	"Motion On Start"
	, "Motion In Trip"
	, "Motion On End"
	, "SOS Start"
	, "SOS End"
	, "Alert Start"
	, "Alert End"
	, "Man Down Start"
	, "Man Down End"
];
var shutdownTypeArray = ["Bluetooth command or App", "LoRaWAN Command", "Power button", "Battery run out"];
var posFailedReasonArray = [
	"Hardware Error"
	, "Interrupted by Downlink for Position"
	, "Interrupted by Man Down Detection"
	, "Interrupted by Alarm function"
	, "GPS positioning timeout (Please increase GPS positioning time via MKLoRa APP)"
	, "GPS positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)"
	, "GPS positioning timeout of alert alarm (Please increase alert alarm report interval via MKLoRa APP)"
	, "The reporting interval of SOS alarm is set too short (Please increase SOS alarm report interval via MKLoRa APP)"
	, "GPS PDOP Limit(Please increase PDOP via MKLoRa APP)"
	, "Interrupted positioning at start of movement(the movement ends too quickly, resulting in not enough time to complete the positioning)"
	, "Interrupted positioning at end of movement(the movement restarted too quickly, resulting in not enough time to complete the positioning)"
	, "Other reason"
];

var posFailedReasonArray2 = [
	"Hardware Error"
	, "Interrupted by Downlink for Position"
	, "Interrupted by Man Down Detection"
	, "Interrupted by Alarm function"
	, "Bluetooth positioning timeout (Please increase positioning time of Bluetooth fix)"
	, "Bluetooth broadcasting in progress (Please reduce the Bluetooth broadcast timeout or avoid Bluetooth positioning when Bluetooth broadcasting in process)"
	, "Interrupted positioning at start of movement(the movement ends too quickly, resulting in not enough time to complete the positioning)"
	, "Interrupted positioning at end of movement(the movement restarted too quickly, resulting in not enough time to complete the positioning)"
];

function decodeUplink(input) {
	var bytes = input.bytes;
	var fPort = input.fPort;
	var dev_info = {};
	var data = {};
	if (fPort == 0 || fPort == 100) {
		dev_info.data = data;
		return dev_info;
	}
	var datas = [];
	var parse_len;
	data.port = fPort;
	data.hex_format_payload = bytesToHexString(bytes, 0, bytes.length);
	data.payload_type = payloadTypeArray[fPort - 1];
	data.battery_charging_status = bytes[0] & 0x80 ? "in charging" : "no charging";	//Parse  Battery charging state 
	data.battery_level = (bytes[0] & 0x7F) + "%";  //Parse  Battery Level
	if (fPort == 1) {
		data.timezone = timezone_decode(bytes[1]);					//timezone
		data.timestamp = bytesToInt(bytes, 2, 4);		//timestamp
		data.time = parse_time(data.timestamp, bytes[1] * 0.5);
		var eventTypeCode = bytes[6] & 0xFF;
		data.event_type_code = eventTypeCode;
		data.event_type = eventTypeArray[eventTypeCode];		//event
		data.payload_type = "Event info"
	} else if (fPort == 2) {
		data.device_mode = deviceModeArray[((bytes[1] >> 4) & 0x0F) - 1];	//work mode
		data.auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
		data.firmware_version = "V" + bytes[2] + "." + bytes[3] + "." + bytes[4];
		data.hardware_version = "V" + bytes[5] + "." + bytes[6];
		data.timezone = timezone_decode(bytes[7]);		//timezone
		// data.alarm_error = bytes[8];	//error state
		var date = new Date();
		var timestamp = Math.trunc(date.getTime() / 1000);
		data.timestamp = timestamp;
		data.payload_type = "Device info"
		data.time = parse_time(data.timestamp, bytes[7] * 0.5);
	} else if (fPort == 3) {
		data.device_mode = deviceModeArray[((bytes[1] >> 4) & 0x0F) - 1];	//work mode
		data.auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
		data.timezone = timezone_decode(bytes[2]);		//timezone
		data.timestamp = bytesToInt(bytes, 3, 4);		//timestamp
		data.shutdown_type = shutdownTypeArray[bytes[7]];
		data.payload_type = "Turn off info"
		data.time = parse_time(data.timestamp, bytes[2] * 0.5);
	} else if (fPort == 4) {
		data.device_mode = deviceModeArray[((bytes[1] >> 4) & 0x0F) - 1];	//work mode
		data.auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
		data.timezone = timezone_decode(bytes[2]);		//timezone
		data.timestamp = bytesToInt(bytes, 3, 4);		//timestamp
		data.time = parse_time(data.timestamp, bytes[2] * 0.5);
	} else if (fPort == 5) {
		data.device_mode = deviceModeArray[((bytes[1] >> 4) & 0x0F) - 1];	//work mode
		data.auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
		data.timezone = timezone_decode(bytes[2]);		//timezone
		data.timestamp = bytesToInt(bytes, 3, 4);		//timestamp
		data.low_power_prompt_percent = (bytes[7] & 0xFF) + "%";		//low power level
	} else if (fPort == 6 || fPort == 10) {
		var date = new Date();
		var timestamp = Math.trunc(date.getTime() / 1000);
		var offsetHours = Math.abs(Math.floor(date.getTimezoneOffset() / 60));
		data.timestamp = timestamp;
		data.time = parse_time(timestamp, offsetHours);
		data.timezone = timezone_decode(offsetHours * 2);

		data.device_mode = deviceModeArray[((bytes[1] >> 5) & 0x07) - 1];	//work mode
		data.auxiliary_operation = auxiliaryOperationArray[bytes[1] >> 2 & 0x07];	//device status

		age = (bytes[1] & 0x01) << 8 | bytes[2];
		data.age = age + "s";

		lon = bytesToInt(bytes, 3, 4);
		lat = bytesToInt(bytes, 7, 4);

		if (lat > 0x80000000)
			lat = lat - 0x100000000;
		if (lon > 0x80000000)
			lon = lon - 0x100000000;

		data.latitude = lat / 10000000;
		data.longitude = lon / 10000000;
	} else if (fPort == 7 || fPort == 11) {
		var date = new Date();
		var timestamp = Math.trunc(date.getTime() / 1000);
		var offsetHours = Math.abs(Math.floor(date.getTimezoneOffset() / 60));
		data.timestamp = timestamp;
		data.time = parse_time(timestamp, offsetHours);
		data.timezone = timezone_decode(offsetHours * 2);
		var gps_fix_false_reason = ["hardware_error", "down_request_fix_interrupt", "mandown_fix_interrupt", "alarm_fix_interrupt", "gps_fix_tech_timeout", "gps_fix_timeout", "alert_short_time", "sos_short_time", "pdop_limit", "motion_start_interrupt", "motion_stop_interrupt"];
		data.device_mode = deviceModeArray[((bytes[1] >> 4) & 0x0F) - 1];	//work mode
		data.auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
		data.reasons_for_positioning_failure = posFailedReasonArray[bytes[2] - 1];
		data.location_failure_cn0 = bytes[3];
		data.location_failure_cn1 = bytes[4];
		data.location_failure_cn2 = bytes[5];
		data.location_failure_cn3 = bytes[6];
	} else if (fPort == 8 || fPort == 12) {
		var date = new Date();
		var timestamp = Math.trunc(date.getTime() / 1000);
		var offsetHours = Math.abs(Math.floor(date.getTimezoneOffset() / 60));
		data.timestamp = timestamp;
		data.time = parse_time(timestamp, offsetHours);
		data.timezone = timezone_decode(offsetHours * 2);

		data.device_mode = deviceModeArray[((bytes[1] >> 4) & 0x0F) - 1];	//work mode
		data.auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
		var age = (bytes[2]) << 8 | bytes[3];
		data.age = age + "s";	//age

		parse_len = 4;
		for (var i = 0; i < ((bytes.length - 4) / 7); i++) {
			var item = {};
			item.mac = substringBytes(bytes, parse_len, 6);
			parse_len += 6;
			item.rssi = bytes[parse_len++] - 256 + "dBm";
			datas.push(item);
		}
		data.mac_data = datas;

	} else if (fPort == 9 || fPort == 13) {
		var date = new Date();
		var timestamp = Math.trunc(date.getTime() / 1000);
		var offsetHours = Math.abs(Math.floor(date.getTimezoneOffset() / 60));
		data.timestamp = timestamp;
		data.time = parse_time(timestamp, offsetHours);
		data.timezone = timezone_decode(offsetHours * 2);
		var ble_fix_false_reason = ["none", "hardware_error", "down_request_fix_interrupt", "mandown_fix_interrupt", "alarm_fix_interrupt", "ble_fix_timeout", "ble_adv", "motion_start_interrupt", "motion_stop_interrupt"];
		data.device_mode = deviceModeArray[((bytes[1] >> 4) & 0x0F) - 1];	//work mode
		data.auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
		data.reasons_for_positioning_failure = posFailedReasonArray2[bytes[2] - 1];

		parse_len = 3;
		for (var j = 0; j < ((bytes.length - 3) / 7); j++) {
			var ble_data = {};
			ble_data.mac = substringBytes(bytes, parse_len, 6);
			parse_len += 6;
			ble_data.rssi = bytes[parse_len++] - 256 + "dBm";
			datas.push(ble_data);
		}
		data.mac_data = datas;
	}
	dev_info.data = data;
	return dev_info;
}
// ==========================
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

function substringBytes(bytes, start, len) {
	var char = [];
	for (var i = 0; i < len; i++) {
		char.push("0x" + bytes[start + i].toString(16) < 0X10 ? ("0" + bytes[start + i].toString(16)) : bytes[start + i].toString(16));
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
// input.fPort = 9;
// input.bytes = getData("d43006");
// console.log(decodeUplink(input));