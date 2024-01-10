var dev_state = ["Heartbeat report", "Parking spaces become empty", "Parking spaces was occuiped", "Strong magnetic interference", "Low battery alert", "Magnetic sensor failed", "TT&H sensor failed", "Radar sensor failed"];
function determineType(val) {
  var newVal = ""
  if (val === 133) {
    newVal = 'LW009-SM'
  }
  return newVal
}

// Decode uplink function.
//
// Input is an object with the following fields:
// - bytes = Byte array containing the uplink payload, e.g. [255, 230, 255, 0]
// - fport = Uplink fport.
// - variables = Object containing the configured device variables.
//
// Output must be an object with the following fields:
// - data = Object representing the decoded payload.
function decodeUplink(input) {
  var bytes = input.bytes;
  var port = input.fport;
  var data = {};
  var payload_offset = 11;
  if (port == 1) {
    if (bytes[payload_offset + 1] == 3) {
      data.payload_type = 'Device Parameter payload';
      data.device_model = determineType(bytes[payload_offset + 3]);
      data.device_version = bytes[[payload_offset + 6]].toString(16);
      data.heartbeat_interval = (bytes[payload_offset + 9] * 65536 + bytes[payload_offset + 10] * 256 + bytes[payload_offset + 11] + 1) * 30 + 's';
      data.sensitivity = 'Level' + bytes[payload_offset + 17];

    }
    if (bytes[payload_offset + 1] == 2) {
      switch (bytes[payload_offset + 3]) {
        case 0:
          data.payload_type = dev_state[0];
          break;
        case 0x0b:
          data.payload_type = dev_state[1];
          break;
        case 0x0c:
          data.payload_type = dev_state[2];
          break;
        case 0x0d:
          data.payload_type = dev_state[3];
          break;
        case 0x0e:
          data.payload_type = dev_state[4];
          break;
        case 0x10:
          data.payload_type = dev_state[5];
          break;
        case 0x11:
          data.payload_type = dev_state[6];
          break;
        case 0x12:
          data.payload_type = dev_state[7];
          break;
      }
      payload_offset += 3;
      data.radar_data = bytes[payload_offset + 4] * 256 + bytes[payload_offset + 5];
      payload_offset += 5;
      data.battery_level = bytes[payload_offset + 3] + "%";
      payload_offset += 3;
      data.magenetic_sensor_X_axis_data = bytes[payload_offset + 3] * 256 + bytes[payload_offset + 4];
      data.magenetic_sensor_Y_axis_data = bytes[payload_offset + 5] * 256 + bytes[payload_offset + 7];
      data.magenetic_sensor_Z_axis_data = bytes[payload_offset + 7] * 256 + bytes[payload_offset + 8];
      payload_offset += 8;
      if (bytes[payload_offset + 3] == 1) {
        data.parking_status = 'Parking space with car';
      }
      else {
        data.parking_status = 'No car';
      }
      payload_offset += 3;
      data.temperature = bytes[payload_offset + 3] + "°C";
      payload_offset += 3;
      data.humidity = bytes[payload_offset + 3] + "%";
    }
  }

  return data;
} 