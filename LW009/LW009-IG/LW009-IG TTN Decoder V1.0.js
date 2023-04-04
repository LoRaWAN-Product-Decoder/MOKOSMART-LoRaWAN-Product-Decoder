var dev_state = ["Heartbeat message","Parking spaces become empty","Parking spaces was occuiped","Strong magnetic interference","Low battery alert","Magenetic sensor failed(IC can be read)","Magenetic sensor failed(IC can't be read)"];

function determineType(val) {
	var newVal = ""
	if(val === 130) {
		newVal = 'LW009-IG'
	}
	return newVal
}


function Decoder(bytes, port)
{
	var dev_info = {};
	var payload_offset = 11;
	if(port == 1)
	{
    if(bytes[payload_offset +1] == 3)
    {
      dev_info.payload_type = 'Device Parameter payload';
      dev_info.device_model = determineType(bytes[payload_offset +3]);
      dev_info.device_version = bytes[[payload_offset+6]].toString(16);
      dev_info.heartbeat_interval = (bytes[payload_offset +9]*65536 + bytes[payload_offset +10]*256 + bytes[payload_offset +11] + 1) * 30 + 's';
      dev_info.sensitivity = 'Level' + bytes[payload_offset+ 17];

    }
    if(bytes[payload_offset +1] == 2)
    {
		switch(bytes[payload_offset +3 ])
		{
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
        case 0x0f:
        dev_info.payload_type = dev_state[5];
        break;
        case 0x10:
        dev_info.payload_type = dev_state[6];
        break;
		}
		payload_offset += 3;
		payload_offset  += 5;
		dev_info.battery_level =  bytes[payload_offset +3 ] + "%";
		payload_offset  +=3;
		dev_info.magenetic_sensor_X_axis_data = bytes[payload_offset +3 ]*256 +bytes[payload_offset +4 ];
    dev_info.magenetic_sensor_Y_axis_data = bytes[payload_offset +5 ]*256 +bytes[payload_offset +7 ];
    dev_info.magenetic_sensor_Z_axis_data = bytes[payload_offset +7 ]*256 +bytes[payload_offset +8 ];
    payload_offset  +=8;
    if(bytes[payload_offset +3 ] == 1)
    {
      dev_info.parking_status = 'Parking space with car';
    }
    else 
    {
      dev_info.parking_status = 'No car';
    }
    //payload_offset  +=3;
    //dev_info.tem =  bytes[payload_offset +3 ] + "°C";
    //payload_offset  +=3;
    //dev_info.hum =  bytes[payload_offset +3 ] + "%";
  }
	}

	return dev_info;
} 