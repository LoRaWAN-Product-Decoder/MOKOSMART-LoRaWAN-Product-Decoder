// LW004-PB_V3 Payload Decoder rule
// Creation time: 2023-07-12
// Creator: Valentin Kim, based on V3 ChirpStack decoder code
// Suitable firmware versions: LW004-PB V3.x.x
// Programming languages: Javascript
// Suitable platforms: Chirpstack v4.x

var packet_type = ["event", "sys_open", "sys_close", "heart", "low_battery", "work_gps_fix_success", "work_gps_fix_false", "work_ble_fix_success", "work_ble_fix_false", "helper_gps_fix_success", "helper_gps_fix_false", "helper_ble_fix_success", "helper_ble_fix_false"];
var dev_mode = ["off", "standby", "timing", "period", "motion_idle", "motion_start", "motion_moving", "motion_stop"];
var dev_status = ["none", "downlink_fix", "mandown", "alert", "sos"];
var event_type = ["motion_start", "motion_moving", "motion_stop", "sos_start", "sos_stop", "alert_start", "alert_stop", "mandown_start", "mandown_stop", "downlink_fix"];
var restart_reason = ["ble_cmd_restart", "lorawan_cmd_restart", "key_restart", "power_restart"];

function substringBytes(bytes, start, len) {
	var char = [];
	for (var i = 0; i < len; i++) {
		char.push("0x" + bytes[start + i].toString(16) < 0X10 ? ("0" + bytes[start + i].toString(16)) : bytes[start + i].toString(16));
	}
	return char.join("");
}
function BytestoInt(bytes, start) {
	var value = ((bytes[start] << 24) | (bytes[start + 1] << 16) | (bytes[start + 2] << 8) | (bytes[start + 3]));
	return value;
}
function decodeUplink(input) {
	/* 
		Decodes an uplink message from the input and return an object containing the decoded data.
	*/
	var bytes = input.bytes;
	var fPort = input.fPort;
	var variables = input.variables;
	var result = {
		data: {

		}
	}
	var dev_info = {};
	dev_info.pack_type = packet_type[fPort - 1];

	function parse_battery_charging_state(bytes) {
		return ((bytes[0] >> 7) & 0x01);
	}
	function parse_battery_level(bytes) {
		return (bytes[0] & 0x7F); // 0~100
	}
	function parse_timezone(bytes, start) {
		return bytes[start];
	}
	function parse_firmware(bytes) {
		return "v" + bytes[2] + "." + bytes[3] + "." + bytes[4]; // v1.0.0
	}
	function parse_hardware(bytes) {
		return "v" + bytes[5] + "." + bytes[6]; // v3.0
	}
	function decode_lon(bytes) {
		var lon = BytestoInt(bytes, 3) / 1000000;
		if (lon > 0x80000000)
			lon = lon - 0x100000000;
		return lon /  10000000;
	}
	function decode_lat(bytes) {
		var lat = BytestoInt(bytes, 7) / 1000000;
		if (lat > 0x80000000)
			lat = lat - 0x100000000;
		return lat / 10000000;
	}
	function decode_signal_gps(bytes) {
		var parse_len = 4;
		var signal = []
		for (var i = 0; i < ((bytes.length - 4) / 7); i++) {
			var data = {};
			data.mac = substringBytes(bytes, parse_len, 6);
			parse_len += 6;
			data.rssi = bytes[parse_len++] - 256;
			signal.push(data);
		}
		return signal;
	}
	function decode_signal_bluetooth(bytes) {
		var parse_len = 3;
		var signal = []
		for (var i = 0; i < ((bytes.length - 3) / 7); i++) {
			var data = {};
			data.mac = substringBytes(bytes, parse_len, 6);
			parse_len += 6;
			data.rssi = bytes[parse_len++] - 256;
			signal.push(data);
		}
		return signal;
	}

	switch(fPort) {
		case(1): 
			result.data = {
				battery: {
					charging: parse_battery_charging_state(bytes),
					level: parse_battery_level(bytes),
				},
				timezone: parse_timezone(bytes, 1),
				timestamp: BytestoInt(bytes, 2),
				event: event_type[bytes[6]],
			}
			return result;
		case(2):
			result.data = {
				battery: {
					charging: parse_battery_charging_state(bytes),
					level: parse_battery_level(bytes),
				},
				mode: dev_mode[(bytes[1] >> 4) & 0x0F - 1],
				status: dev_status[bytes[1] & 0x0F],
				firmware: parse_firmware(bytes),
				hardware: parse_hardware(bytes),
				timezone: parse_timezone(bytes, 7),
				alarm: bytes[8], // error state
			}
			return result;
		case(3):
			result.data = {
				battery: {
					charging: parse_battery_charging_state(bytes),
					level: parse_battery_level(bytes),
				},
				mode: dev_mode[(bytes[1] >> 4) & 0x0F - 1],
				status: dev_status[bytes[1] & 0x0F],
				timezone: parse_timezone(bytes, 1),
				timestamp: BytestoInt(bytes, 2),
				restart_reason: restart_reason[bytes[7]],
			}
			return result;
		case(4):
			result.data = {
				battery: {
					charging: parse_battery_charging_state(bytes),
					level: parse_battery_level(bytes),
				},
				mode: dev_mode[(bytes[1] >> 4) & 0x0F - 1],
				status: dev_status[bytes[1] & 0x0F],
				timezone: parse_timezone(bytes, 2),
				timestamp: BytestoInt(bytes, 3),
			}
			return result;
		case(5):
			result.data = {
				battery: {
					charging: parse_battery_charging_state(bytes),
					level: parse_battery_level(bytes),
				},
				mode: dev_mode[(bytes[1] >> 4) & 0x0F - 1],
				status: dev_status[bytes[1] & 0x0F],
				timezone: parse_timezone(bytes, 2),
				timestamp: BytestoInt(bytes, 3),
				low_power_level: bytes[7]
			}
			return result;
		case(6):
		case(10):
			result.data = {
				battery: {
					charging: parse_battery_charging_state(bytes),
					level: parse_battery_level(bytes),
				},
				mode: dev_mode[(bytes[1] >> 5) & 0x07 - 1],
				status: dev_status[(bytes[1] >> 2) & 0x07],
				gps: {
					age: (bytes[1] & 0x03) << 8 | bytes[2],
					lon: decode_lon(bytes),
					lat: decode_lat(bytes)
				}
			}
			return result;
		case(7):
		case(11):
			var gps_fix_false_reason = ["hardware_error", "down_request_fix_interrupt", "mandown_fix_interrupt", "alarm_fix_interrupt", "gps_fix_tech_timeout", "gps_fix_timeout", "alert_short_time", "sos_short_time", "pdop_limit", "motion_start_interrupt", "motion_stop_interrupt"];
			result.data = {
				battery: {
					charging: parse_battery_charging_state(bytes),
					level: parse_battery_level(bytes),
				},
				mode: dev_mode[(bytes[1] >> 4) & 0x0F - 1],
				status: dev_status[bytes[1] & 0x0F],
				gps: {
					failure: gps_fix_false_reason[bytes[2] - 1],
					fix_cn0: bytes[3],
					fix_cn1: bytes[4],
					fix_cn2: bytes[5],
					fix_cn3: bytes[6]
				}
			}
			return result;
		case(8):
		case(12):
			result.data = {
				battery: {
					charging: parse_battery_charging_state(bytes),
					level: parse_battery_level(bytes),
				},
				mode: dev_mode[(bytes[1] >> 4) & 0x0F - 1],
				status: dev_status[bytes[1] & 0x0F],
				age: (bytes[2]) << 8 | bytes[3],
				signal: decode_signal_gps(bytes)
			}
			return result;		
		case(9):
		case(13):
			var ble_fix_false_reason = ["none", "hardware_error", "down_request_fix_interrupt", "mandown_fix_interrupt", "alarm_fix_interrupt", "ble_fix_timeout", "ble_adv", "motion_start_interrupt", "motion_stop_interrupt"];

			result.data = {
				battery: {
					charging: parse_battery_charging_state(bytes),
					level: parse_battery_level(bytes),
				},
				mode: dev_mode[(bytes[1] >> 4) & 0x0F - 1],
				status: dev_status[bytes[1] & 0x0F],
				age: (bytes[2]) << 8 | bytes[3],
				bluetooth: {
					failure: ble_fix_false_reason[bytes[2] - 1],
					signal: decode_signal_bluetooth(bytes)					
				}
			}
			return result;			
	}
} 
