var payloadTypeArray = ["Heartbeat", "Information", "Shut Down"];

function Decode(fPort, bytes) {
	if (fPort == 0) {
        return {};
    }
	var dev_info = {};

	dev_info.port = fPort;
	dev_info.payload_type = payloadTypeArray[fPort - 5];
	if (command_format_check(bytes, fPort) == false) {
		dev_info.result = "Format wrong";
		return dev_info;
	}
	var timestamp = bytesToInt(bytes, 0, 4);
	dev_info.time = parse_time(timestamp, bytes[4] * 0.5);
	dev_info.timestamp = timestamp;
	dev_info.timezone = timezone_decode(bytes[4])

	var tem = 0;
	var hum = 0;
	var temp_value;
	switch (fPort) {
		case 5:
		case 6:
			temp_value = (bytes[5] >> 6) & 0x03;
			if (temp_value == 0x00) {
				dev_info.pir_state = "PIR motion not detected";
			} else if (temp_value == 0x01) {
				dev_info.pir_state = "PIR motion detected";
			} else {
				dev_info.pir_state = "Occupancy detection function is disable";
			}

			temp_value = (bytes[5] >> 4) & 0x03;
			if (temp_value == 0x00) {
				dev_info.door_state = "Door/window is close";
			} else if (temp_value == 0x01) {
				dev_info.door_state = "Door/window is open";
			} else {
				dev_info.door_state = "Door/window status detection function is disable";
			}

			temp_value = (bytes[5] >> 2) & 0x03;
			if (temp_value == 0x00) {
				dev_info.temperature_state = "Current environment temperature is lower than minimum temperature alarm threshold value";
			} else if (temp_value == 0x01) {
				dev_info.temperature_state = "Current environment temperature is higher than maximum temperature alarm threshold value";
			} else {
				dev_info.temperature_state = "Temperature threshold alarm function is disable";
			}

			temp_value = bytes[5] & 0x03;
			if (temp_value == 0x00) {
				dev_info.humidity_state = "Current environment humidity is lower than minimum humidity alarm threshold value";
			} else if (temp_value == 0x01) {
				dev_info.humidity_state = "Current environment humidity is higher than maximum humidity alarm threshold value";
			} else {
				dev_info.humidity_state = "Humidity threshold alarm function is disable";
			}

			temp_value = (bytesToInt(bytes, 6, 3) >> 14) & 0x03ff;
			if (temp_value == 0x03ff) {
				dev_info.temperature = "Temperature monitoring function is disable";
			} else {
				temp_value = temp_value / 10 - 30;
				dev_info.temperature = temp_value.toFixed(1) + "°";
			}

			temp_value = (bytesToInt(bytes, 6, 3) >> 4) & 0x03ff;
			if (temp_value == 0x03ff) {
				dev_info.humidity = "Humidity monitoring function is disable";
			} else {
				temp_value = temp_value / 10;
				dev_info.humidity = temp_value.toFixed(1) + "%";
			}

			temp_value = (bytesToInt(bytes, 6, 3) >> 2) & 0x03;
			if (temp_value == 0x00) {
				dev_info.temperature_change_state = "Current environment temperature rises faster than temperature change alarm condition";
			} else if (temp_value == 0x01) {
				dev_info.temperature_change_state = "Current environment temperature drops faster than temperature change alarm condition";
			} else {
				dev_info.temperature_change_state = "Temperature change alarm function is disable";
			}

			temp_value = bytesToInt(bytes, 6, 3) & 0x03;
			if (temp_value == 0x00) {
				dev_info.humidity_change_state = "Current environment humidity rises faster than humidity change alarm condition";
			} else if (temp_value == 0x01) {
				dev_info.humidity_change_state = "Current environment humidity drops faster than humidity change alarm condition";
			} else {
				dev_info.humidity_change_state = "Humidity change alarm function is disable";
			}
			dev_info.low_battery_status = (bytesToInt(bytes, 9, 2) >> 15) == 1 ? "Battery level is low" : "Battery level is normal";
			temp_value = bytesToInt(bytes, 9, 2) & 0x7FFF;
			dev_info.door_trigger_times = temp_value == 0x7FFF ? "Door/window status detection function is disable" : temp_value + "times";
			break;
		case 7:
			temp_value = bytes[5];
			if (temp_value == 0x00) {
				dev_info.low_battery_status = "Battery level is normal";
				dev_info.low_battery_prompt = "Device won’t send Heartbeat Payload to server when device’s battery level is low";
			} 
			else if (temp_value == 0x01) {
				dev_info.low_battery_status = "Battery is low";
				dev_info.low_battery_prompt = "Device won’t send Heartbeat Payload to server when device’s battery level is low";
			} 
			else if (temp_value == 0x02) {
				dev_info.low_battery_status = "Battery is normal";
				dev_info.low_battery_prompt = "Device will send Heartbeat Payload to server when device’s battery level is low";
			} 
			else if (temp_value == 0x03) {
			dev_info.low_battery_status = "Battery is low";
			dev_info.low_battery_prompt = "Device will send Heartbeat Payload to server when device’s battery level is low";
		    }
			//dev_info.current_battery_voltage = ((bytes[6] & 0xFF) + 22) / 10 + "V";
			break;
		default:
			break;
	}

	return dev_info;
}

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
			break;
	}

	return false;
}

function parse_time(timestamp, timezone) {
	timestamp = timestamp + timezone * 3600;
	if (timestamp < 0) {
		timestamp = 0;
	}

	var d = new Date(timestamp * 1000);
	//d.setUTCSeconds(1660202724);

	var time_str = "";
	time_str += d.getUTCFullYear();
	time_str += "/";
	time_str += d.getUTCMonth() + 1;
	time_str += "/";
	time_str += d.getUTCDate();
	time_str += " ";

	time_str += d.getUTCHours();
	time_str += ":";
	time_str += d.getUTCMinutes();
	time_str += ":";
	time_str += d.getUTCSeconds()

	return time_str;
}

function timezone_decode(tz) {
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

function bytesToInt(bytes, start, len) {
	var value = 0;
	for (var i = 0; i < len; i++) {
		var m = ((len - 1) - i) * 8;
		value = value | bytes[start + i] << m;
	}
	// var value = ((bytes[start] << 24) | (bytes[start + 1] << 16) | (bytes[start + 2] << 8) | (bytes[start + 3]));
	return value;
}


// res_data1 = Decoder([0x62, 0x30, 0xC2, 0xC1, 0x10, 0x0A, 0x8A, 0xAD, 0x1A, 0x10, 0xA5], 5);
// res_data2 = Decoder([0x62, 0x31, 0x33, 0xE1, 0x10, 0x4A, 0x8A, 0x2F, 0x5A, 0x10, 0xB5], 6);
// res_data3 = Decoder([0x62, 0x2F, 0xF8, 0x53, 0x10, 0x02, 0x0D], 7);

// console.log(res_data1);
// console.log(res_data2);
// console.log(res_data3);

