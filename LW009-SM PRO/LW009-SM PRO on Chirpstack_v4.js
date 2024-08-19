const dataTypeList = ['Hearbeat','Parking information','Parking beacon information','Low power','Power off','Event information'];
const parkingDetectMode = ['Magnetic detection','Radar detection','Magnetic & Radar detection'];
const parkingInfo = ['Heartbeat','No parking','Occupied','Strong magnetic interference','Magnetic hardware destroyed','Radar mode destroyed'];
const powerOffMode = ['Bluetooth command','LoRaWAN command'];


function decodeUplink(input) {
    var bytes = input.bytes;
    var fPort = input.fPort;
    var deviceInfo = {};
    var data = {};
    if (fPort == 0) {
        deviceInfo.data = data;
        return deviceInfo;
    }

    data.port = fPort;
    data.payload_type = dataTypeList[fPort - 1];
    if (command_format_check(bytes, fPort) == false) {
        data.result = "Format wrong";
		deviceInfo.data = data;
        return deviceInfo;
    }
    var index = 0;
    
    data.low_power_state = (bytes[index] == 1) ? 'Low power' : 'Normal';
    index ++;

    data.battery_voltage = bytesToInt(bytes,index,2).toString() + 'mV';
    index += 2;

	data.timestamp = bytesToInt(bytes, index, 4);		//timestamp
    index += 4;

    data.timezone = timezone_decode(bytes[index]);		//timezone
    index ++;

    data.time = parse_time(timestamp, bytes[index] * 0.5);

    const temperature = bytes[index];
    if (temperature == 0xff) {
        //无效数据
        data.temperature = 'FF';
    }else {
        data.temperature = signedHexToInt(bytesToHexString(bytes, index, 1)).toString() + '°C';
    }
    index ++;

    const humidity = bytes[index];
    if (humidity == 0xff) {
        //无效数据
        data.humidity = 'FF';
    }else {
        data.humidity = bytesToInt(bytes,index,1).toString() + '%';
    }
    index ++;

    if (fPort == 1) {
        data.car_parking_state = (bytes[index] == 1) ? 'Parking' : 'No Parking'
    } else if (fPort == 2 || fPort == 3) {
        data.parking_detect_mode = parkingDetectMode[bytes[index]];
        index ++;

        data.car_parking_state = (bytes[index] == 1) ? 'Parking' : 'No Parking'
        index ++;

        data.parking_information = parkingInfo[bytes[index]];
        index ++;

        data.radar_data = bytesToHexString(bytes,index,2);
        index += 2;

        const x_data = '0x' + bytesToHexString(bytes,index,2);
        index += 2;

        const y_data = '0x' + bytesToHexString(bytes,index,2);
        index += 2;

        const z_data = '0x' + bytesToHexString(bytes,index,2);
        index += 2;

        data.axis_data = 'X:' + x_data + ' Y:' + y_data + ' Z:' + z_data;

        data.parking_timestamp = bytesToInt(bytes, index, 4);		//timestamp
        index += 4;

        if (fPort == 3 && bytes.length > 25) {
            const beacon_number = bytesToInt(bytes,index,1);
            index ++;
            var tempDatas = [];
            for (var i = 0; i < beacon_number; i ++) {
                var item = {};
                item.mac_address = bytesToHexString(bytes,index,6);
                index += 6;

                item.rssi = (bytes[index] - 256).toString() + 'dBm';
                index ++;

                item.beacon_timestamp = bytesToInt(bytes, index, 4);		//timestamp
                index += 4;

                tempDatas.push(item);
            }
            data.beacon_data = tempDatas;
        }
    } else if (fPort == 5) {
        data.power_off_mode = powerOffMode[bytes[index]];
    }else if (fPort == 6) {
        data.event = 'Downlink frame trigger reporting';
    }
    
	deviceInfo.data = data;
    return deviceInfo;
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