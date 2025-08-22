/*
according dev config，show report data format choose, this flag must be the same as the device configuration
bit0 refer to the 1st content of the selected beacon type
bit1 refer to the 2nd content of the selected beacon type
............
*/
//If you don't want to change flag, you can export the decoder from MKLoRa APP after configuration is done.You can read "chapter 2.3.4.3 Device Information" of LW003-B APP guide.

var iBeaconFlag = 0x01FF;
var EddystoneUIDFlag = 0xFF;
var EddystoneURLFlag = 0x7F;
var EddystoneTLMFlag = 0x03FF;
var BXPiBeaconFlag = 0x07FF;
var BXPDeviceInfoFlag = 0x1FFF;
var BXPACCFlag = 0x1FFF;
var BXPTHFlag = 0x07FF;
var BXPButtonFlag = 0x03FFFF;
var BXPTagFlag = 0x3FFF;
var OtherTypeFlag = 0x1F;
var BXPPirFlag = 0x3FFF;
var BXPTofFlag = 0x0FFF;


var chargingTypeArray = ['No Charging','DC Charging','Solar Charging'];
var shutDownTypeArray = ["Bluetooth command or App", "LoRaWAN Command", "Power button", "Battery run out"];
var beaconTypeArray =
[
"Other",
"iBeacon",
"Eddystone-UID",
"Eddystone-URL",
"Eddystone-TLM",
"BXP-ACC",
"BXP-T&H",
"BXP-T&S",
"BXP-DeviceInfo",
"BXP-BUTTON",
"BXP-PIR",
"BXP-TOF",
"BXP-iBeacon",
];
//var messageTypeArray = ["Normal heartbeat report", "The device come into low power state", "Other type"];
var sampleRateArray = ["1Hz", "10Hz", "25Hz", "50Hz", "100Hz", "200Hz", "400Hz", "1344Hz", "1620Hz", "5376Hz"];
var fullScaleArray = ["±2g", "±4g", "±8g", "±16g"];
var frameTypeArray = ["Single press mode", "Double press mode", "Long press mode", "Abnormal inactivity mode"];
var urlSchemeArray = ["http://www.", "https://www.", "http://", "https://"];
var urlExpansionArray = [".com/", ".org/", ".edu/", ".net/", ".info/", ".biz/", ".gov/", ".com", ".org", ".edu", ".net", ".info", ".biz", ".gov"];

function decodeUplink(input) {
var bytes = input.bytes;
var fPort = input.fPort;
var dev_info = {};
var data = {};
if (fPort == 0) {
dev_info.data = data;
return dev_info;
}
data.port = fPort;
data.hex_format_payload = bytesToHexString(bytes, 0, bytes.length);

var index = 0;

if (fPort == 1 || fPort == 3 || fPort == 4 || fPort == 8) {
const battery_status = bytes[index];
index++;
data.battery_charging_status = ((battery_status & 0x80) == 0x80) ? "Charging" : "No Charge";
data.battery_level = (battery_status & 0x7F) + "%";
data.battery_voltage = bytesToInt(bytes, index, 2) + 'mV';
index += 2;

var major_firmware_version = (bytes[index] >> 6) & 0x03;
var minor_firmware_version = (bytes[index] >> 4) & 0x03;
var patch_firmware_version = bytes[index] & 0x0f;
var firmware_version = 'V' + major_firmware_version + '.' + minor_firmware_version + '.' + patch_firmware_version;
data.firmware_version = firmware_version;
index += 1;

var major_hardware_version = (bytes[index] >> 4) & 0x0f;
var patch_hardware_version = bytes[index] & 0x0f;
var hard_version = 'V' + major_hardware_version + '.' + patch_hardware_version;
data.hardware_version = hard_version;
index += 1;

var temperature = bytesToHexString(bytes, index, 2);
if (temperature != 'ffff') {
data.temperature = (signedHexToInt(bytesToHexString(bytes, index, 2)) * 0.01) + '°C';
}
index += 2;

var humidity = bytesToHexString(bytes, index, 2);
if (humidity != 'ffff') {
data.humidity = (bytesToInt(bytes, index, 2) * 0.01) + '%';
}
index += 2;

data.timezone = signedHexToInt(bytesToHexString(bytes, index, 1)) / 2;
index += 1;

if (fPort == 1 || fPort == 3) {
data.charging_type = chargingTypeArray[bytes[index]];
}else if (fPort == 4) {
data.information_package_type = 'Downlink Message Trigger';
}


} else if (fPort == 2) {
const battery_status = bytes[index];
index++;
data.battery_charging_status = ((battery_status & 0x80) == 0x80) ? "Charging" : "No Charge";
data.battery_level = (battery_status & 0x7F) + "%";

data.battery_voltage = bytesToInt(bytes, index, 2) + 'mV';
index += 2;

const date = new Date(1000 * bytesToInt(bytes, index, 4));
data.timestamp = date.toLocaleString();
index += 4;

data.timezone = signedHexToInt(bytesToHexString(bytes, index, 1))/ 2;
index += 1;

data.shutdown_type = shutDownTypeArray[bytes[index]];
index += 1;

data.charging_type = chargingTypeArray[bytes[index]];
} else if (fPort == 9) {
const battery_status = bytes[index];
index++;
data.battery_charging_status = ((battery_status & 0x80) == 0x80) ? "Charging" : "No Charge";
data.battery_level = (battery_status & 0x7F) + "%";

data.work_time = bytesToInt(bytes, index, 4) + 's';
index += 4;

data.adv_cnt = bytesToInt(bytes, index, 4);
index += 4;

data.scan_time = bytesToInt(bytes, index, 4) + 's';
index += 4;

data.red_light_total_time = bytesToInt(bytes, index, 4) + 's';
index += 4;

data.green_light_total_time = bytesToInt(bytes, index, 4) + 's';
index += 4;

data.blue_light_total_time = bytesToInt(bytes, index, 4) + 's';
index += 4;

data.axis_sleep_total_time = bytesToInt(bytes, index, 4) + 's';
index += 4;

data.axis_wakeup_total_time = bytesToInt(bytes, index, 4) + 's';
index += 4;

data.lorawan_send_count = bytesToInt(bytes, index, 4);
index += 4;

data.lorawan_power = bytesToInt(bytes, index, 4) + 'mAS';
index += 4;

data.power_consumption = bytesToInt(bytes, index, 4) * 0.001 + 'mAH';

} else if (fPort == 5 || fPort == 10) {
// Scan data info
data.packet_sequence = bytes[index];
index += 1;

data.timestamp = parse_time(bytesToInt(bytes, index, 4), bytes[5] * 0.5);
index += 4;

data.timezone = timezone_decode(bytes[index]);
index += 1;

data.beacon_number = bytes[index];
index += 1;
data.message_type = "Scan Data";

// var date = new Date();
// data.time = date.toJSON();

var parse_len = index;
var datas = [];
for (var i = 0; i < data.beacon_number; i++) {
var item = {};
var beacon_len = 0;
var no_response_package = bytes[parse_len] & 0x80;
var current_data_len = bytes[parse_len++] & 0x7F;
var beacon_type = bytes[parse_len++];
item.beacon_type = beaconTypeArray[beacon_type];
item.type_code = beacon_type;
beacon_len++;
if (beacon_type == 0) {
// OtherTypeFlag
var flag = OtherTypeFlag;
if (flag & 0x01) {
item.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
parse_len += 6;
beacon_len += 6;
}
if (flag & 0x02) {
item.rssi = bytes[parse_len++] - 256;
beacon_len += 1;
}
if (flag & 0x04) {
item.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
parse_len += 4;
beacon_len += 4;
}
// ================
var blockNum = bytes[parse_len++];
beacon_len++;
if (blockNum > 0) {
var dataBlocks = [];
while (blockNum > 0) {
var dataBlock = {};
var dataBlockLength = bytes[parse_len++];
beacon_len++;
if ((dataBlockLength >> 6) & 0x00) {
dataBlock.status = "Normal";
parse_len++;
beacon_len++;
dataBlocks.push(dataBlock);
blockNum--;
continue;
}
if ((dataBlockLength >> 6) & 0x01) {
dataBlock.status = "Type Error";
parse_len++;
beacon_len++;
dataBlocks.push(dataBlock);
blockNum--;
continue;
}
if ((dataBlockLength >> 6) & 0x02) {
dataBlock.status = "Length Error";
parse_len++;
beacon_len++;
dataBlocks.push(dataBlock);
blockNum--;
continue;
}
dataBlockLength = dataBlockLength & 0x3F;
dataBlock.length = dataBlockLength;
dataBlock.type = bytesToHexString(bytes, parse_len, 1).toUpperCase();
parse_len++;
beacon_len++;
dataBlock.item = bytesToHexString(bytes, parse_len, dataBlockLength - 1).toUpperCase();
parse_len += dataBlockLength - 1;
beacon_len += dataBlockLength - 1;
dataBlocks.push(dataBlock);
blockNum--;
}
// item.dataBlocks = JSON.stringify(dataBlocks);
item.dataBlocks = dataBlocks;
}
if ((flag & 0x18)) {
item.raw_data_length = current_data_len - beacon_len;
item.raw_data = bytesToHexString(bytes, parse_len, item.raw_data_length).toUpperCase();
parse_len += item.raw_data_length;
}
datas.push(item);
} else if (beacon_type == 1) {
// iBeaconFlag
var flag = iBeaconFlag;
if (flag & 0x01) {
item.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
parse_len += 6;
beacon_len += 6;
}
if (flag & 0x02) {
item.rssi = bytes[parse_len++] - 256;
beacon_len += 1;
}
if (flag & 0x04) {
item.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
parse_len += 4;
beacon_len += 4;
}
// ================
if (flag & 0x08) {
var uuid1 = bytesToHexString(bytes, parse_len, 4);
parse_len += 4;
var uuid2 = bytesToHexString(bytes, parse_len, 2);
parse_len += 2;
var uuid3 = bytesToHexString(bytes, parse_len, 2);
parse_len += 2;
var uuid4 = bytesToHexString(bytes, parse_len, 2);
parse_len += 2;
var uuid5 = bytesToHexString(bytes, parse_len, 6);
parse_len += 6;
var uuid = uuid1 + "-" + uuid2 + "-" + uuid3 + "-" + uuid4 + "-" + uuid5;
item.uuid = uuid.toUpperCase();
beacon_len += 16;
}
if (flag & 0x10) {
item.major = bytesToInt(bytes, parse_len, 2);
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x20) {
item.minor = bytesToInt(bytes, parse_len, 2);
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x40) {
var rangingData = bytes[parse_len++];
item.rssi_1m = rangingData == 0 ? "0dBm" : rangingData - 256 + "dBm";
beacon_len++;
}
if (flag & 0x0180) {
item.raw_data_length = current_data_len - beacon_len;
item.raw_data = bytesToHexString(bytes, parse_len, item.raw_data_length).toUpperCase();
parse_len += item.raw_data_length;
}
datas.push(item);
} else if (beacon_type == 2) {
// EddystoneUIDFlag
var flag = EddystoneUIDFlag;
if (flag & 0x01) {
item.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
parse_len += 6;
beacon_len += 6;
}
if (flag & 0x02) {
item.rssi = bytes[parse_len++] - 256;
beacon_len += 1;
}
if (flag & 0x04) {
item.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
parse_len += 4;
beacon_len += 4;
}
// ================
if (flag & 0x08) {
item.rssi_0m = signedHexToInt(bytesToHexString(bytes, parse_len, 1));
parse_len++;
beacon_len++;
}
if (flag & 0x10) {
item.namespace = bytesToHexString(bytes, parse_len, 10).toUpperCase();
parse_len += 10;
beacon_len += 10;
}
if (flag & 0x20) {
item.instance_id = bytesToHexString(bytes, parse_len, 6).toUpperCase();
parse_len += 6;
beacon_len += 6;
}
if (flag & 0xC0) {
item.raw_data_length = current_data_len - beacon_len;
item.raw_data = bytesToHexString(bytes, parse_len, item.raw_data_length).toUpperCase();
parse_len += item.raw_data_length;
}
datas.push(item);
} else if (beacon_type == 3) {
// EddystoneURLFlag
var flag = EddystoneURLFlag;
if (flag & 0x01) {
item.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
parse_len += 6;
beacon_len += 6;
}
if (flag & 0x02) {
item.rssi = bytes[parse_len++] - 256;
beacon_len += 1;
}
if (flag & 0x04) {
item.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
parse_len += 4;
beacon_len += 4;
}
// ================
if (flag & 0x08) {
item.rssi_0m = signedHexToInt(bytesToHexString(bytes, parse_len, 1));
parse_len++;
beacon_len++;
}
if (flag & 0x10) {
var length = bytes[parse_len++];
beacon_len++;
var urlSchemeDesc = urlSchemeArray[bytes[parse_len++]];
beacon_len++;
var urlExpansionValue = bytes[parse_len + length - 2];
if (urlExpansionValue > 13) {
item.url = urlSchemeDesc + bytesToString(bytes, parse_len, length - 1);
} else {
var urlExpansionDesc = urlExpansionArray[urlExpansionValue];
item.url = urlSchemeDesc + bytesToString(bytes, parse_len, length - 2) + urlExpansionDesc;
}
parse_len += length - 1;
beacon_len += length - 1;
}
if (flag & 0x60) {
item.raw_data_length = current_data_len - beacon_len;
item.raw_data = bytesToHexString(bytes, parse_len, item.raw_data_length).toUpperCase();
parse_len += item.raw_data_length;
}
datas.push(item);
} else if (beacon_type == 4) {
// EddystoneTLMFlag
var flag = EddystoneTLMFlag;
if (flag & 0x01) {
item.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
parse_len += 6;
beacon_len += 6;
}
if (flag & 0x02) {
item.rssi = bytes[parse_len++] - 256;
beacon_len += 1;
}
if (flag & 0x04) {
item.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
parse_len += 4;
beacon_len += 4;
}
// ================
if (flag & 0x08) {
item.tlm_version = bytes[parse_len++] == 0 ? "Unencrypted TLM" : "Encrypted TLM";
beacon_len++;
}
if (flag & 0x10) {
item.battery_voltage = bytesToInt(bytes, parse_len, 2) + "mV";
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x20) {
var tempInt = bytes[parse_len++];
beacon_len++;
var tempDecimal = bytes[parse_len++];
beacon_len++;
tempInt = tempInt > 128 ? tempInt - 256 : tempInt;
tempDecimal = tempDecimal / 256;
var temperature = (tempInt + tempDecimal).toFixed(1) + '℃';
item.temperature = temperature;
}
if (flag & 0x40) {
item.adv_cnt = bytesToInt(bytes, parse_len, 4);
parse_len += 4;
beacon_len += 4;
}
if (flag & 0x80) {
item.sec_cnt = bytesToInt(bytes, parse_len, 4);
parse_len += 4;
beacon_len += 4;
}
if (flag & 0x0300) {
item.raw_data_length = current_data_len - beacon_len;
item.raw_data = bytesToHexString(bytes, parse_len, item.raw_data_length).toUpperCase();
parse_len += item.raw_data_length;
}
datas.push(item);
} else if (beacon_type == 5) {
// BXPACCFlag
var flag = BXPACCFlag;
if (flag & 0x01) {
item.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
parse_len += 6;
beacon_len += 6;
}
if (flag & 0x02) {
item.rssi = bytes[parse_len++] - 256;
beacon_len += 1;
}
if (flag & 0x04) {
item.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
parse_len += 4;
beacon_len += 4;
}
// ================
if (flag & 0x08) {
var tx_power = bytes[parse_len] < 128 ? bytes[parse_len++] : bytes[parse_len++] - 256;
item.tx_power = tx_power + "dBm";
beacon_len++;
}
if (flag & 0x10) {
var rangingData = bytes[parse_len++];
item.ranging_data = rangingData == 0 ? "0dBm" : rangingData - 256 + "dBm";
beacon_len++;
}
if (flag & 0x20) {
item.adv_interval = bytes[parse_len++] * 100 + "ms";
beacon_len++;
}
if (flag & 0x40) {
item.battery_voltage = bytesToInt(bytes, parse_len, 2) + "mV";
//item.batt_vol = bytesToInt(bytes, parse_len, 2);
parse_len += 2;
beacon_len += 2;
}
// ================
if (flag & 0x80) {
item.sample_rate = sampleRateArray[bytes[parse_len++]];
beacon_len++;
}
if (flag & 0x0100) {
item.full_scale_index = bytes[parse_len];
item.full_scale = fullScaleArray[bytes[parse_len]];
parse_len++;
beacon_len++;
}
if (flag & 0x0200) {
item.motion_threshold = bytes[parse_len++] / 10 + "g";
beacon_len++;
}
if (flag & 0x0400) {
var scaleIndex = item.full_scale_index ?? 0;

var scale = 0.9765625;
if (scaleIndex == 1) {
scale = 1.953125;
}else if (scaleIndex == 2) {
scale = 3.90625;
}else if (scaleIndex == 3) {
scale = 7.8125;
}

item.x_axis_data = fetchRawString(bytesToInt(bytes,parse_len,2),scale);
parse_len += 2;
beacon_len += 2;
item.y_axis_data = fetchRawString(bytesToInt(bytes,parse_len,2),scale);
parse_len += 2;
beacon_len += 2;
item.z_axis_data = fetchRawString(bytesToInt(bytes,parse_len,2),scale);
parse_len += 2;
beacon_len += 2;

var x_axis = '0x' + item.x_axis_data.toString(16).toUpperCase();
var y_axis = '0x' + item.y_axis_data.toString(16).toUpperCase();
var z_axis = '0x' + item.z_axis_data.toString(16).toUpperCase();
item.axis_data = "X:" + x_axis + " Y:" + y_axis + " Z:" + z_axis;

}
if ((flag & 0x1800)) {
item.raw_data_length = current_data_len - beacon_len;
item.raw_data = bytesToHexString(bytes, parse_len, item.raw_data_length).toUpperCase();
parse_len += item.raw_data_length;
}
datas.push(item);
} else if (beacon_type == 6) {
// BXPTHFlag
var flag = BXPTHFlag;
if (flag & 0x01) {
item.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
parse_len += 6;
beacon_len += 6;
}
if (flag & 0x02) {
item.rssi = bytes[parse_len++] - 256;
beacon_len += 1;
}
if (flag & 0x04) {
item.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
parse_len += 4;
beacon_len += 4;
}
// ================
if (flag & 0x08) {
var tx_power = bytes[parse_len] < 128 ? bytes[parse_len++] : bytes[parse_len++] - 256;
item.tx_power = tx_power + "dBm";
beacon_len++;
}
if (flag & 0x10) {
var rangingData = bytes[parse_len++];
item.ranging_data = rangingData == 0 ? "0dBm" : rangingData - 256 + "dBm";
beacon_len++;
}
if (flag & 0x20) {
item.adv_interval = bytes[parse_len++] * 100 + "ms";
beacon_len++;
}
if (flag & 0x40) {
item.battery_voltage = bytesToInt(bytes, parse_len, 2) + "mV";
parse_len += 2;
beacon_len += 2;
}
// ================
if (flag & 0x80) {
var temperature = bytesToInt(bytes, parse_len, 2);
if (temperature > 0x8000)
item.temperature = "-" + (0x10000 - temperature) / 10 + '℃';
else
item.temperature = temperature / 10 + '℃';
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x0100) {
item.humidity = bytesToInt(bytes, parse_len, 2) / 10 + '%';
parse_len += 2;
beacon_len += 2;
}
if ((flag & 0x0600)) {
item.raw_data_length = current_data_len - beacon_len;
item.raw_data = bytesToHexString(bytes, parse_len, item.raw_data_length).toUpperCase();
parse_len += item.raw_data_length;
}
datas.push(item);
} else if (beacon_type == 7) {
// BXPTagFlag
var flag = BXPTagFlag;
if (flag & 0x01) {
item.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
parse_len += 6;
beacon_len += 6;
}
if (flag & 0x02) {
item.rssi = bytes[parse_len++] - 256;
beacon_len += 1;
}
if (flag & 0x04) {
item.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
parse_len += 4;
beacon_len += 4;
}
// ================
if (flag & 0x08) {
item.hall_sensor_status = bytes[parse_len] & 0x01 ? "Magnet away/absent" : "Magnet approach/present";
//item.hall_sensor_status_code = bytes[parse_len] & 0x01;
item.accelerometer_sensor_status = bytes[parse_len] & 0x02 ? "In move" : "In static";
//item.accelerometer_check_move = bytes[parse_len] & 0x02;
item.accelerometer_sensor_equipped_status = bytes[parse_len] & 0x04 ? "Equipped" : "Not equipped";
parse_len++;
beacon_len++;
}
if (flag & 0x10) {
item.hall_trigger_count = bytesToInt(bytes, parse_len, 2);
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x20) {
item.motion_trigger_count = bytesToInt(bytes, parse_len, 2);
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x40) {
var x_axis = bytesToHexString(bytes, parse_len, 2);
parse_len += 2;
beacon_len += 2;
var y_axis = bytesToHexString(bytes, parse_len, 2);
parse_len += 2;
beacon_len += 2;
var z_axis = bytesToHexString(bytes, parse_len, 2);
parse_len += 2;
beacon_len += 2;
//item.axis_data = "X:0x" + x_axis + " Y:0x" + y_axis + " Z:0x" + z_axis;
item.x_axis_data = signedHexToInt(x_axis);
item.y_axis_data = signedHexToInt(y_axis);
item.z_axis_data = signedHexToInt(z_axis);
}
if (flag & 0x80) {
item.temperature = Number(signedHexToInt(bytesToHexString(bytes, parse_len, 2)) * 0.1).toFixed(1) + '℃';
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x0100) {
item.humidity = Number(signedHexToInt(bytesToHexString(bytes, parse_len, 2)) * 0.1).toFixed(1) + '%';
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x0200) {
item.battery_voltage = bytesToInt(bytes, parse_len, 2) + "mV";
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x0400) {
var length = bytes[parse_len++];
beacon_len++;
item.tag_id = bytesToHexString(bytes, parse_len, length);
parse_len += length;
beacon_len += length;
}
if (!no_response_package) {
if (flag & 0x0800) {
var length = bytes[parse_len++];
beacon_len++;
item.adv_name = bytesToString(bytes, parse_len, length);
parse_len += length;
beacon_len += length;
}
}
if ((flag & 0x3000)) {
item.raw_data_length = current_data_len - beacon_len;
item.raw_data = bytesToHexString(bytes, parse_len, item.raw_data_length).toUpperCase();
parse_len += item.raw_data_length;
}
datas.push(item);
} else if (beacon_type == 8) {
// BXPDeviceInfoFlag
var flag = BXPDeviceInfoFlag;
if (flag & 0x01) {
item.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
parse_len += 6;
beacon_len += 6;
}
if (flag & 0x02) {
item.rssi = bytes[parse_len++] - 256;
beacon_len += 1;
}
if (flag & 0x04) {
item.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
parse_len += 4;
beacon_len += 4;
}
// ================
if (flag & 0x08) {
var tx_power = bytes[parse_len] < 128 ? bytes[parse_len++] : bytes[parse_len++] - 256;
item.tx_power = tx_power + "dBm";
beacon_len++;
}
if (flag & 0x10) {
var rangingData = bytes[parse_len++];
item.ranging_data = rangingData == 0 ? "0dBm" : rangingData - 256 + "dBm";
beacon_len++;
}
if (flag & 0x20) {
item.adv_interval = bytes[parse_len++] * 100 + "ms";
beacon_len++;
}
if (flag & 0x40) {
item.battery_voltage = bytesToInt(bytes, parse_len, 2) + "mV";

parse_len += 2;
beacon_len += 2;
}
// ================
if (flag & 0x80) {
item.password_verification_status = (bytes[parse_len] & 0x02) ? "Disabled" : "Enabled";
item.ambient_light_sensor_status = (bytes[parse_len] & 0x04) ? "Equipped" : "Not equipped";
parse_len++;
beacon_len++;
}
if (flag & 0x0100) {
item.connectable_switch_status = (bytes[parse_len] & 0x01) ? "Connectable" : "Unconnectable";
item.ambient_light_switch_status = (bytes[parse_len] & 0x02) ? "Ambient light detected" : "Ambient light not detected";
parse_len++;
beacon_len++;
}
if (flag & 0x0200) {
var firmware_ver_major = bytes[parse_len] >> 4;
var firmware_ver_minor = bytes[parse_len++] & 0x0F;
var firmware_ver_patch = bytes[parse_len++];
item.firmware_version = "V" + firmware_ver_major + "." + firmware_ver_minor + "." + firmware_ver_patch;
beacon_len += 2;
}
if (!no_response_package) {
if (flag & 0x0400) {
var length = bytes[parse_len++];
beacon_len++;
item.adv_name = bytesToString(bytes, parse_len, length);
parse_len += length;
beacon_len += length;
}
}
if ((flag & 0x1800)) {
item.raw_data_length = current_data_len - beacon_len;
item.raw_data = bytesToHexString(bytes, parse_len, item.raw_data_length).toUpperCase();
parse_len += item.raw_data_length;
}
datas.push(item);
} else if (beacon_type == 9) {
// BXPButtonFlag
var flag = BXPButtonFlag;
if (flag & 0x01) {
item.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
parse_len += 6;
beacon_len += 6;
}
if (flag & 0x02) {
item.rssi = bytes[parse_len++] - 256;
beacon_len += 1;
}
if (flag & 0x04) {
item.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
parse_len += 4;
beacon_len += 4;
}
// ================
if (flag & 0x08) {
item.frame_type_code = bytes[parse_len++] & 0x03;
item.frame_type = frameTypeArray[item.frame_type_code];
beacon_len++;
}
if (flag & 0x10) {
item.password_verification_status = (bytes[parse_len] & 0x01) ? "Password verification enabled" : "Password verification disabled";
item.alarm_triggered_status = (bytes[parse_len] & 0x02) ? "Alarm be triggered" : "Alarm not be triggered";
//item.alarm_status = bytes[parse_len] & 0x02;
parse_len++;
beacon_len++;
}
if (flag & 0x20) {
item.trigger_count = bytesToInt(bytes, parse_len, 2);
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x40) {
var length = bytes[parse_len++];
beacon_len++;
item.device_id = bytesToHexString(bytes, parse_len, length);
parse_len += length;
beacon_len += length;
}
if (flag & 0x80) {
item.firmware_type = bytes[parse_len++];
beacon_len++;
}
if (flag & 0x0100) {
var length = bytes[parse_len++];
beacon_len++;
item.adv_name = bytesToString(bytes, parse_len, length);
parse_len += length;
beacon_len += length;
}
if (!no_response_package) {
if (flag & 0x0200) {
item.full_scale = fullScaleArray[bytes[parse_len++]];
beacon_len++;
}
if (flag & 0x0400) {
item.motion_threshold = bytesToInt(bytes, parse_len, 2);
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x0800) {
var x_axis = bytesToHexString(bytes, parse_len, 2);
parse_len += 2;
beacon_len += 2;
var y_axis = bytesToHexString(bytes, parse_len, 2);
parse_len += 2;
beacon_len += 2;
var z_axis = bytesToHexString(bytes, parse_len, 2);
parse_len += 2;
beacon_len += 2;
//item.axis_data = "X:0x" + x_axis + " Y:0x" + y_axis + " Z:0x" + z_axis;
item.x_axis_data = signedHexToInt(x_axis);
item.y_axis_data = signedHexToInt(y_axis);
item.z_axis_data = signedHexToInt(z_axis);
}
if (flag & 0x1000) {
item.temperature = Number(signedHexToInt(bytesToHexString(bytes, parse_len, 2)) * 0.1).toFixed(1) + '℃';
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x2000) {
var rangingData = bytes[parse_len++];
item.ranging_data = rangingData == 0 ? "0dBm" : rangingData - 256 + "dBm";
beacon_len++;
}
if (flag & 0x4000) {
item.battery_voltage = bytesToInt(bytes, parse_len, 2) + "mV";
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x8000) {
var tx_power = bytes[parse_len] < 128 ? bytes[parse_len++] : bytes[parse_len++] - 256;
item.tx_power = tx_power + "dBm";
beacon_len++;
}
}
if ((flag & 0x030000)) {
item.raw_data_length = current_data_len - beacon_len;
item.raw_data = bytesToHexString(bytes, parse_len, item.raw_data_length).toUpperCase();
parse_len += item.raw_data_length;
}
datas.push(item);
} else if (beacon_type == 10) {
// BXPPirFlag
var flag = BXPPirFlag;
if (flag & 0x01) {
item.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
parse_len += 6;
beacon_len += 6;
}
if (flag & 0x02) {
item.rssi = bytes[parse_len++] - 256;
beacon_len += 1;
}
if (flag & 0x04) {
item.timestamp = parse_time(bytesToInt(bytes, parse_len, 4),0);
parse_len += 4;
beacon_len += 4;
}

if (flag & 0x08) {
item.delay_response_status = '0x' + bytesToHexString(bytes, parse_len, 1);
parse_len++;
beacon_len++;
}
if (flag & 0x10) {
item.door_status = '0x' + bytesToHexString(bytes, parse_len, 1);
parse_len++;
beacon_len++;
}
if (flag & 0x20) {
item.sensor_sensitivity = '0x' + bytesToHexString(bytes, parse_len, 1);
parse_len++;
beacon_len++;
}
if (flag & 0x40) {
item.sensor_detection_status = '0x' + bytesToHexString(bytes, parse_len, 1);
parse_len++;
beacon_len++;
}
if (flag & 0x80) {
item.battery_voltage = bytesToInt(bytes, parse_len, 2) + 'mV';
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x0100) {
item.major = bytesToInt(bytes, parse_len, 2);
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x0200) {
item.minor = bytesToInt(bytes, parse_len, 2);
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x0400) {
item.rssi_1m = bytes[parse_len++] - 256 + 'dBm';
beacon_len += 1;
}
if (!no_response_package) {
if (flag & 0x0800) {
var length = bytes[parse_len++];
beacon_len++;
item.adv_name = bytesToString(bytes, parse_len, length);
parse_len += length;
beacon_len += length;
}
}
if ((flag & 0x3000)) {
item.raw_data_length = current_data_len - beacon_len;
item.raw_data = bytesToHexString(bytes, parse_len, item.raw_data_length).toUpperCase();
parse_len += item.raw_data_length;
}
datas.push(item);
} else if (beacon_type == 11) {
// BXPTofFlag
var flag = BXPPirFlag;
if (flag & 0x01) {
item.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
parse_len += 6;
beacon_len += 6;
}
if (flag & 0x02) {
item.rssi = bytes[parse_len++] - 256;
beacon_len += 1;
}
if (flag & 0x04) {
item.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
parse_len += 4;
beacon_len += 4;
}

if (flag & 0x08) {
item.mfg_code = '0x' + bytesToHexString(bytes, parse_len, 2);
parse_len +=2;
beacon_len +=2;
}
if (flag & 0x10) {
item.beacon_code = '0x' + bytesToHexString(bytes, parse_len, 2);
parse_len +=2;
beacon_len +=2;
}
if (flag & 0x20) {
item.battery_voltage = bytesToInt(bytes, parse_len, 2) + 'mV';
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x40) {
item.ranging_data = bytesToInt(bytes, parse_len, 2) + 'mm';
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x80) {
item.user_data = '0x' + bytesToHexString(bytes, parse_len, 2);
parse_len +=2;
beacon_len +=2;
}
if (flag & 0x0100) {
item.sub_type = '0x' + bytesToHexString(bytes, parse_len, 1);
parse_len++;
beacon_len++;
}
if (!no_response_package) {
if (flag & 0x0200) {
var length = bytes[parse_len++];
beacon_len++;
item.adv_name = bytesToString(bytes, parse_len, length);
parse_len += length;
beacon_len += length;
}
}
if ((flag & 0x0c00)) {
item.raw_data_length = current_data_len - beacon_len;
item.raw_data = bytesToHexString(bytes, parse_len, item.raw_data_length).toUpperCase();
parse_len += item.raw_data_length;
}
datas.push(item);
} else if (beacon_type == 12) {
// BXPiBeaconFlag
var flag = BXPiBeaconFlag;
if (flag & 0x01) {
item.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
parse_len += 6;
beacon_len += 6;
}
if (flag & 0x02) {
item.rssi = bytes[parse_len++] - 256;
beacon_len += 1;
}
if (flag & 0x04) {
item.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
parse_len += 4;
beacon_len += 4;
}
// ================
if (!no_response_package) {
if (flag & 0x08) {
var uuid1 = bytesToHexString(bytes, parse_len, 4);
parse_len += 4;
var uuid2 = bytesToHexString(bytes, parse_len, 2);
parse_len += 2;
var uuid3 = bytesToHexString(bytes, parse_len, 2);
parse_len += 2;
var uuid4 = bytesToHexString(bytes, parse_len, 2);
parse_len += 2;
var uuid5 = bytesToHexString(bytes, parse_len, 6);
parse_len += 6;
var uuid = uuid1 + "-" + uuid2 + "-" + uuid3 + "-" + uuid4 + "-" + uuid5;
item.uuid = uuid.toUpperCase();
beacon_len += 16;
}
if (flag & 0x10) {
item.major = bytesToInt(bytes, parse_len, 2);
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x20) {
item.minor = bytesToInt(bytes, parse_len, 2);
parse_len += 2;
beacon_len += 2;
}
if (flag & 0x40) {
var rangingData = bytes[parse_len++];
item.rssi_1m = rangingData == 0 ? "0dBm" : rangingData - 256 + "dBm";
beacon_len++;
}
if (flag & 0x80) {
var tx_power = bytes[parse_len] < 128 ? bytes[parse_len++] : bytes[parse_len++] - 256;
item.tx_power = tx_power + "dBm";
beacon_len++;
}
if (flag & 0x0100) {
item.adv_interval = bytes[parse_len++] * 100 + "ms";
beacon_len++;
}
}
if (flag & 0x0600) {
item.raw_data_length = current_data_len - beacon_len;
item.raw_data = bytesToHexString(bytes, parse_len, item.raw_data_length).toUpperCase();
parse_len += item.raw_data_length;
}
datas.push(item);
}
}
data.scan_data = datas;
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
// 去除首字符，将0转为1，将1转为0 反码
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

function parse_time_zone(timezone) {
timezone = timezone > 64 ? timezone - 128 : timezone;
return timezone;
}

function get_timestamp(timestamp) {
if (timestamp < 0) {
timestamp = 0;
}
return timestamp * 1000;
}

function formatNumber(number) {
return number < 10 ? "0" + number : number;
}

function fetchRawString(xHex, scale) {
let value = 0;

if (xHex & 0x8000) {
value = ((xHex >> 4) - 0x1000) * scale;
} else {
value = (xHex >> 4) * scale;
}

return Math.round(value);
}
