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
	"Start of movement"
	, "In movement"
	, "End of movement"
	, "Start SOS alarm"
	, "SOS alarm exit"
	, "Start Alert alarm"
	, "Alert alarm exit"
	, "Come into Man Down status"
	, "Exit Man Down status"
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


function Decode(fPort, bytes) {
	if (fPort == 0 || fPort == 100) {
        return {};
    }
	var dev_info = {};
	var datas = [];
	var parse_len;
	dev_info.port = fPort;
	dev_info.payload_type = payloadTypeArray[fPort - 1];
	dev_info.battery_charging_status = bytes[0] & 0x80 ? "in charging" : "no charging";	//Parse  Battery charging state 
	dev_info.battery_level = (bytes[0] & 0x7F) + "%";  //Parse  Battery Level
	if (fPort == 1) {
		dev_info.timezone = timezone_decode(bytes[1]);					//timezone
		dev_info.timestamp = bytesToInt(bytes, 2, 4);		//timestamp
		var eventTypeCode = bytes[6] & 0xFF;
		dev_info.event_type = eventTypeArray[eventTypeCode];		//event
	} else if (fPort == 2) {
		dev_info.device_mode = deviceModeArray[(bytes[1] >> 4) & 0x0F - 1];	//work mode
		dev_info.auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
		dev_info.firmware_version = "V" + bytes[2] + "." + bytes[3] + "." + bytes[4];
		dev_info.hardware_version = "V" + bytes[5] + "." + bytes[6];
		dev_info.timezone = timezone_decode(bytes[7]);		//timezone
		// dev_info.alarm_error = bytes[8];	//error state
	} else if (fPort == 3) {
		dev_info.device_mode = deviceModeArray[(bytes[1] >> 4) & 0x0F - 1];	//work mode
		dev_info.auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
		dev_info.timezone = timezone_decode(bytes[2]);		//timezone
		dev_info.timestamp = bytesToInt(bytes, 3, 4);		//timestamp
		dev_info.shutdown_type = shutdownTypeArray[bytes[7]];
	} else if (fPort == 4) {
		dev_info.device_mode = deviceModeArray[(bytes[1] >> 4) & 0x0F - 1];	//work mode
		dev_info.auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
		dev_info.timezone = timezone_decode(bytes[2]);		//timezone
		dev_info.timestamp = bytesToInt(bytes, 3, 4);		//timestamp
	} else if (fPort == 5) {
		dev_info.device_mode = deviceModeArray[(bytes[1] >> 4) & 0x0F - 1];	//work mode
		dev_info.auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
		dev_info.timezone = timezone_decode(bytes[2]);		//timezone
		dev_info.timestamp = bytesToInt(bytes, 3, 4);		//timestamp
		dev_info.low_power_prompt_percent = (bytes[7] & 0xFF) + "%";		//low power level
	} else if (fPort == 6 || fPort == 10) {
		dev_info.device_mode = deviceModeArray[(bytes[1] >> 5) & 0x07 - 1];	//work mode
		dev_info.auxiliary_operation = auxiliaryOperationArray[bytes[1] >> 2 & 0x07];	//device status

		age = (bytes[1] & 0x01) << 8 | bytes[2];
		dev_info.age = age + "s";

		lon = bytesToInt(bytes, 3, 4);
		lat = bytesToInt(bytes, 7, 4);

		if (lat > 0x80000000)
			lat = lat - 0x100000000;
		if (lon > 0x80000000)
			lon = lon - 0x100000000;

		dev_info.latitude = lat / 10000000;
		dev_info.longitude = lon / 10000000;
	} else if (fPort == 7 || fPort == 11) {
		var gps_fix_false_reason = ["hardware_error", "down_request_fix_interrupt", "mandown_fix_interrupt", "alarm_fix_interrupt", "gps_fix_tech_timeout", "gps_fix_timeout", "alert_short_time", "sos_short_time", "pdop_limit", "motion_start_interrupt", "motion_stop_interrupt"];
		dev_info.device_mode = deviceModeArray[(bytes[1] >> 4) & 0x0F - 1];	//work mode
		dev_info.auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
		dev_info.reasons_for_positioning_failure = posFailedReasonArray[bytes[2] - 1];
		dev_info.location_failure_cn0 = bytes[3];
		dev_info.location_failure_cn1 = bytes[4];
		dev_info.location_failure_cn2 = bytes[5];
		dev_info.location_failure_cn3 = bytes[6];
	} else if (fPort == 8 || fPort == 12) {
		dev_info.device_mode = deviceModeArray[(bytes[1] >> 4) & 0x0F - 1];	//work mode
		dev_info.auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
		var age = (bytes[2]) << 8 | bytes[3];
		dev_info.age = age + "s";	//age

		parse_len = 4;
		for (var i = 0; i < ((bytes.length - 4) / 7); i++) {
			var data = {};
			data.mac = substringBytes(bytes, parse_len, 6);
			parse_len += 6;
			data.rssi = bytes[parse_len++] - 256 + "dBm";
			datas.push(data);
		}
		dev_info.bluetooth_data = datas;

	} else if (fPort == 9 || fPort == 13) {
		var ble_fix_false_reason = ["none", "hardware_error", "down_request_fix_interrupt", "mandown_fix_interrupt", "alarm_fix_interrupt", "ble_fix_timeout", "ble_adv", "motion_start_interrupt", "motion_stop_interrupt"];
		dev_info.device_mode = deviceModeArray[(bytes[1] >> 4) & 0x0F - 1];	//work mode
		dev_info.auxiliary_operation = auxiliaryOperationArray[bytes[1] & 0x0F];	//device status
		dev_info.reasons_for_positioning_failure = posFailedReasonArray2[bytes[2]];

		parse_len = 3;
		for (var j = 0; j < ((bytes.length - 3) / 7); j++) {
			var ble_data = {};
			ble_data.mac = substringBytes(bytes, parse_len, 6);
			parse_len += 6;
			ble_data.rssi = bytes[parse_len++] - 256 + "dBm";
			datas.push(ble_data);
		}
		dev_info.bluetooth_data = datas;
	}

	return dev_info;
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