const deviceInfoTypeList = ['Hearbeat','Parking information','Parking beacon information','Low power','Power off','Event information'];
const parkingDetectMode = ['Magnetic detection','Radar detection','Magnetic & Radar detection'];
const parkingInfo = ['Heartbeat','No parking','Occupied','Strong magnetic interference','Magnetic hardware destroyed','Radar mode destroyed'];
const powerOffMode = ['Bluetooth command','LoRaWAN command'];


function Decode(fPort, bytes, uplink_info) {
    var deviceInfo = {};
    if (fPort == 0) {
        return deviceInfo;
    }

    deviceInfo.port = fPort;
    deviceInfo.payload_type = deviceInfoTypeList[fPort - 1];
    if (command_format_check(bytes, fPort) == false) {
        deviceInfo.result = "Format wrong";
		deviceInfo.deviceInfo = deviceInfo;
        return deviceInfo;
    }
    var index = 0;
    
    deviceInfo.low_power_state = (bytes[index] == 1) ? 'Low power' : 'Normal';
    index ++;

    deviceInfo.battery_voltage = bytesToInt(bytes,index,2).toString() + 'mV';
    index += 2;

	deviceInfo.timestamp = bytesToInt(bytes, index, 4);		//timestamp
    index += 4;

    deviceInfo.timezone = timezone_decode(bytes[index]);		//timezone
    index ++;

    deviceInfo.time = parse_time(timestamp, bytes[index] * 0.5);

    const temperature = bytes[index];
    if (temperature == 0xff) {
        //无效数据
        deviceInfo.temperature = 'FF';
    }else {
        deviceInfo.temperature = signedHexToInt(bytesToHexString(bytes, index, 1)).toString() + '°C';
    }
    index ++;

    const humidity = bytes[index];
    if (humidity == 0xff) {
        //无效数据
        deviceInfo.humidity = 'FF';
    }else {
        deviceInfo.humidity = bytesToInt(bytes,index,1).toString() + '%';
    }
    index ++;

    if (fPort == 1) {
        deviceInfo.car_parking_state = (bytes[index] == 1) ? 'Parking' : 'No Parking'
    } else if (fPort == 2 || fPort == 3) {
        deviceInfo.parking_detect_mode = parkingDetectMode[bytes[index]];
        index ++;

        deviceInfo.car_parking_state = (bytes[index] == 1) ? 'Parking' : 'No Parking'
        index ++;

        deviceInfo.parking_information = parkingInfo[bytes[index]];
        index ++;

        deviceInfo.radar_deviceInfo = bytesToHexString(bytes,index,2);
        index += 2;

        const x_deviceInfo = '0x' + bytesToHexString(bytes,index,2);
        index += 2;

        const y_deviceInfo = '0x' + bytesToHexString(bytes,index,2);
        index += 2;

        const z_deviceInfo = '0x' + bytesToHexString(bytes,index,2);
        index += 2;

        deviceInfo.axis_deviceInfo = 'X:' + x_deviceInfo + ' Y:' + y_deviceInfo + ' Z:' + z_deviceInfo;

        deviceInfo.parking_timestamp = bytesToInt(bytes, index, 4);		//timestamp
        index += 4;

        if (fPort == 3 && bytes.length > 25) {
            const beacon_number = bytesToInt(bytes,index,1);
            index ++;
            var tempList = [];
            for (var i = 0; i < beacon_number; i ++) {
                var item = {};
                item.mac_address = bytesToHexString(bytes,index,6);
                index += 6;

                item.rssi = (bytes[index] - 256).toString() + 'dBm';
                index ++;

                item.beacon_timestamp = bytesToInt(bytes, index, 4);		//timestamp
                index += 4;

                tempList.push(item);
            }
            deviceInfo.beacon_deviceInfo = tempList;
        }
    } else if (fPort == 5) {
        deviceInfo.power_off_mode = powerOffMode[bytes[index]];
    }else if (fPort == 6) {
        deviceInfo.event = 'Downlink frame trigger reporting';
    }

    if (uplink_info)
		deviceInfo.uplink_info = uplink_info;
    
    return deviceInfo;
}

function bytesToHexString(bytes, start, len) {
	var char = [];
	for (var i = 0; i < len; i++) {
		var deviceInfo = bytes[start + i].toString(16);
		var deviceInfoHexStr = ("0x" + deviceInfo) < 0x10 ? ("0" + deviceInfo) : deviceInfo;
		char.push(deviceInfoHexStr);
	}
	return char.join("");
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

function bytesToInt(bytes, start, len) {
	var value = 0;
	for (var i = 0; i < len; i++) {
		var m = ((len - 1) - i) * 8;
		value = value | bytes[start + i] << m;
	}
	// var value = ((bytes[start] << 24) | (bytes[start + 1] << 16) | (bytes[start + 2] << 8) | (bytes[start + 3]));
	return value;
}