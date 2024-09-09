var dev_state = ["Heartbeat report", "Parking spaces become empty", "Parking spaces was occuiped", "Strong magnetic interference", "Low battery alert", "Magnetic sensor failed", "TT&H sensor failed", "Radar sensor failed"];
function determineType(val) {
  var newVal = ""
  if (val === 133) {
    newVal = 'LW009-SM'
  }
  return newVal
}


function Decode(fPort, bytes, uplink_info) {
    var dev_info = {};
    if (fPort != 1) {
        return dev_info;
    }

    dev_info.port = fPort;    
    
    var payload_offset = 11;
    
    if (bytes[payload_offset + 1] == 3) {
        dev_info.payload_type = 'Device Parameter payload';
        dev_info.device_model = determineType(bytes[payload_offset + 3]);
        dev_info.device_version = bytes[[payload_offset + 6]].toString(16);
        dev_info.heartbeat_interval = (bytes[payload_offset + 9] * 65536 + bytes[payload_offset + 10] * 256 + bytes[payload_offset + 11] + 1) * 30 + 's';
        dev_info.sensitivity = 'Level' + bytes[payload_offset + 17];
  
      }
      if (bytes[payload_offset + 1] == 2) {
        switch (bytes[payload_offset + 3]) {
          case 0:
            dev_info.payload_type = dev_state[0];
            break;
          case 0x0b:
            dev_info.payload_type = dev_state[1];
            break;
          case 0x0c:
            dev_info.payload_type = dev_state[2];
            break;
          case 0x0d:
            dev_info.payload_type = dev_state[3];
            break;
          case 0x0e:
            dev_info.payload_type = dev_state[4];
            break;
          case 0x10:
            dev_info.payload_type = dev_state[5];
            break;
          case 0x11:
            dev_info.payload_type = dev_state[6];
            break;
          case 0x12:
            dev_info.payload_type = dev_state[7];
            break;
        }
        payload_offset += 3;
        dev_info.radar_data = bytes[payload_offset + 4] * 256 + bytes[payload_offset + 5];
        payload_offset += 5;
        dev_info.battery_level = bytes[payload_offset + 3] + '%';
        payload_offset += 3;
        dev_info.magenetic_sensor_X_axis_data = bytes[payload_offset + 3] * 256 + bytes[payload_offset + 4];
        dev_info.magenetic_sensor_Y_axis_data = bytes[payload_offset + 5] * 256 + bytes[payload_offset + 7];
        dev_info.magenetic_sensor_Z_axis_data = bytes[payload_offset + 7] * 256 + bytes[payload_offset + 8];
        payload_offset += 8;
        if (bytes[payload_offset + 3] == 1) {
          dev_info.parking_status = 'Parking space with car';
        }
        else {
          dev_info.parking_status = 'No car';
        }
        payload_offset += 3;
        dev_info.temperature = bytes[payload_offset + 3] + '°C';
        payload_offset += 3;
        dev_info.humidity = bytes[payload_offset + 3] + '%';
      }

    if (uplink_info)
		dev_info.uplink_info = uplink_info;
    
    return dev_info;
}

function bytesToHexString(bytes, start, len) {
	var char = [];
	for (var i = 0; i < len; i++) {
		var deviceInfo = bytes[start + i].toString(16);
		var deviceInfoHexStr = ('0x' + deviceInfo) < 0x10 ? ('0' + deviceInfo) : deviceInfo;
		char.push(deviceInfoHexStr);
	}
	return char.join('');
}


function command_format_check(bytes, port) {
	switch (port) {
		case 1:
			if (bytes.length === 11)
				return true;
			break;

		case 2:
			if (bytes.length === 25)
				return true;
			break;

		case 3:
			if (bytes.length >= 26)
				return true;
			break;

        case 4:
            if (bytes.length == 10) {
                return true;
            }
            break;

        case 5: 
            if (bytes.length == 9) {
                return true;
            }
            break;

        case 6:
            if (bytes.length == 11) {
                return true;
            }
            break;

		default:
			break;
	}

	return false;
}

function parse_time(timestamp, timezone) {
	timezone = timezone > 64 ? timezone - 128 : timezone;
	timestamp = timestamp + timezone * 3600;
	if (timestamp < 0) {
		timestamp = 0;
	}

	var d = new Date(timestamp * 1000);
	//d.setUTCSeconds(1660202724);

	var time_str = '';
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

function formatNumber(number) {
	return number < 10 ? '0' + number : number;
}

function timezone_decode(tz) {
	var tz_str = 'UTC';
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

	tz_str += String(parseInt(tz / 2));
	tz_str += ':'

	if (tz % 2) {
		tz_str += '30'
	} else {
		tz_str += '00'
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