//LW007-PIR Payload decoder for ChirpStack v4.x, based on TTN decoder code by Allen Zhang
//Creation time：2023-07-12
//Creator: Valentin Kim
//Suitable firmware versions：N/A
//Programming languages：Javascript
//Suitable platforms：ChirpStack v4.x
function decodeUplink(input) {
	/* Decode an uplink message from the input. Return an object of the decoded data.

		input: { bytes: [0x62, 0x30, 0xC2, 0xC1, 0x10, 0x0A, 0x8A, 0xAD, 0x1A, 0x10, 0xA5], fPort: 5 }
		return:
			{
				data: {
					fPort: 5,
					type: 'heartbeat',
					timestamp: 1647362753,
					timezone: 'UTC+08:00',
					battery_low: 0,
					pir: { state: 0 },
					temperature: { state: 25.4, alarm: 2, change_state: 2 },
					humidity: { state: 72.1, alarm: 2, change_state: 2 },
					door: { state: 0, open_count: 4261 }
				}
		}

		input: { bytes: [0x62, 0x31, 0x33, 0xE1, 0x10, 0x4A, 0x8A, 0x2F, 0x5A, 0x10, 0xB5], fPort: 6 }
		return:
			{
				data: {
					fPort: 6,
					type: 'dev',
					timestamp: 1647391713,
					timezone: 'UTC+08:00',
					battery_low: 0,
					pir: { state: 0 },
					temperature: { state: 25.2, alarm: 2, change_state: 2 },
					humidity: { state: 75.7, alarm: 2, change_state: 2 },
					door: { state: 0, open_count: 4277 }
				}
			}

		input: { bytes: [0x62, 0x2F, 0xF8, 0x53, 0x10, 0x02, 0x0D], fPort: 7 }
		return:
			{
				data: {
					fPort: 7,
					type: 'dev_close',
					battery: { low: 0, low_alarm: true, voltage: 3.5 }
				}
			}
	 */
	var bytes = input.bytes;
	var fPort = input.fPort;
	var result = { // object to be returned with `data` field
		data: {
			fPort: fPort,
			error: null
		}
	};

	function command_format_check(bytes, port) {
		switch (port) {
			case 5:
				if (bytes.length === 11)
					return true;
				break;
			case 6:
				if (bytes.length === 11)
					return true;
				break;
			case 7:
				if (bytes.length === 7)
					return true;
				break;
			default:
				return false;
		}
	}	
	function timezone_decode(tz) {
		// Returns a string formatted as UTC+/-HH:MM
		var tz_str = "UTC";
	
		if (tz < 0) {
			tz_str += "-";
			tz = -tz;
		}
		else {
			tz_str += "+";
		}
		if (tz < 20) {
			tz_str += "0";
		}
	
		tz_str += String(parseInt(tz / 2));
		tz_str += ":"
	
		if (tz % 2) {
			tz_str += "30"
		}
		else {
			tz_str += "00"
		}
	
		return tz_str;
	}
	function round(value, precision) {
		var multiplier = Math.pow(10, precision || 0);
		return Math.round(value * multiplier) / multiplier;
	}
	function decode_timestamp(bytes) {
		return bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3];
	}
	function decode_pir_state(bytes) {
		var tmp = ((bytes[5] & 0x0c) >> 6);
		return tmp == 0x03 ? null : tmp;
	}
	function decode_door_state(bytes) {
		var tmp = ((bytes[5] & 0x30) >> 4);
		return tmp == 0x03 ? null : tmp;
	}
	function decode_temperature_alarm(bytes) {
		var tmp = ((bytes[5] & 0x0c) >> 2);
		return tmp == 0x03 ? null : tmp;
	}
	function decode_humidity_alarm(bytes) {
		var tmp = (bytes[5] & 0x03);
		return tmp == 0x03 ? null : tmp;
	}
	function decode_temperature(bytes) {
		var tmp = ((bytes[6] << 2) + ((bytes[7] & 0xc0) >> 6));
		if (tmp == 0x03ff)
			return null;
		else
			return round((tmp / 10) - 30, 1);
	}
	function decode_humidity(bytes) {
		var tmp = (((bytes[7] & 0x3f) << 4) + ((bytes[8] & 0xf0) >> 4));
		if (tmp == 0x03ff)
			return null;
		else
			return round(tmp / 10, 1);
	}
	function decode_change_state_temperature(bytes) {
		var tmp = (bytes[8] & 0x0c) >> 2;
		return tmp == 0x03 ? null : tmp;
	}
	function decode_change_state_humidity(bytes) {
		var tmp = (bytes[8] & 0x03);
		return tmp == 0x03 ? null : tmp;
	}
	function decode_low_battery(bytes) {
		return (bytes[9] & 0x80) >> 7;
	}
	function decode_door_open_count(bytes) {
		return ((bytes[9] & 0x7f) << 8) + bytes[10];
	}

	if (command_format_check(bytes, fPort) == false) {
		// data validation failed
		result.data.error = -1;
		return result;
	}

	switch (fPort) {
		case 5:
		case 6:
			var type = 'heartbeat';
			if (fPort == 6) type = 'dev';
			result.data = {
				fPort: fPort,
				type: type,
				timestamp: decode_timestamp(bytes),
				timezone: timezone_decode(bytes[4]),
				battery_low: decode_low_battery(bytes),
				pir: {
					state: decode_pir_state(bytes), // `null` mean disabled
				},
				temperature: {
					state: decode_temperature(bytes), // `null` mean disabled
					alarm: decode_temperature_alarm(bytes), // `null` mean disabled
					change_state: decode_change_state_temperature(bytes) // `null` mean disabled
				},
				humidity: {
					state: decode_humidity(bytes), // `null` mean disabled
					alarm: decode_humidity_alarm(bytes), // `null` mean disabled
					change_state: decode_change_state_humidity(bytes) // `null` mean disabled
				},
				door: {
					state: decode_door_state(bytes), // `null` mean disabled
					open_count: decode_door_open_count(bytes)
				}
			}
			return result;
		case 7:
			result.data = {
				fPort: fPort,
				type: 'dev_close',
				battery: {
					low: bytes[5] & 0x01,
					low_alarm: ((bytes[5] & 0x02) > 1),
					voltage: (bytes[6] + 22) / 10
				}
			}
			return result;
		default:
			break;
	}
}
