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

    data.time = parse_time(data.timestamp, bytes[index] * 0.5);

    const temperature = bytes[index];
    if (temperature == 0xff) {
        //无效数据
        data.temperature = 'FF';
    }else {
        data.temperature = signedHexToInt(bytesToHexString(bytes, index, 1)).toString() + '°C';
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
    twoStr = -parseInt(twoStr_unsign, 2);
    return twoStr;
}


function command_format_check(bytes, port) {
	switch (port) {
		case 1:
			if (bytes.length === 11)
				return true;
			break;

		case 2:
			if (bytes.length === 24)
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

// var datas = [17, 100, 145, 120, 51, 16, 9, 8, 1, 2, 1, 6, 5, 34, 0, 0, 0, 0];

// console.log(getData("11 64 91 78 33 10 09 08 01 02 01 06 05 22 00 00 00 00"));
var input = {};
input.fPort = 2;
input.bytes = getData("000E7C68555B9D041C020102019D00000CD5F04F68555B98");
console.log(decodeUplink(input));