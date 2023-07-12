function Decoder(fPort, bytes) {
    var decoded = {};
    if(bytes[0] == 1)
    {
      decoded.a_payloadtype = "The 1st payload for device information";
      decoded.b_batterylevel = ( bytes[1] == 0 )? 'battery is normal':'low battery';
      decoded.c_battery_voltage = (bytes[3]*256 + bytes[2]) /1000 + 'V';
      decoded.d_firmware_version = 'V' + bytes[4] +'.'+bytes[5] +'.' +bytes[6];
      if(bytes[7] == 0)
      {
        decoded.e_Frequency_Plan = "EU868";
      }
      else if (bytes[7]== 1)
      {
           decoded.e_Frequency_Plan = "US915";
      }
      else if (bytes[7]== 2)
      {
           decoded.e_Frequency_Plan = "US915 HYBRID";
      }
      else if (bytes[7]== 3)
      {
           decoded.e_Frequency_Plan = "CN779";
      }
      else if (bytes[7]== 4)
      {
           decoded.e_Frequency_Plan = "EU433";
         
      }
      else if (bytes[7]== 5)
      {
           decoded.e_Frequency_Plan = "AU915";
      }
      else if (bytes[7]== 6)
      {
           decoded.e_Frequency_Plan = "AU915 OLD";
      }
      else if (bytes[7]== 7)
      {
           decoded.e_Frequency_Plan = "CN470";
      }
      else if (bytes[7]== 8)
      {
           decoded.e_Frequency_Plan = "AS923";
      }
      else if (bytes[7]== 9)
      {
           decoded.e_Frequency_Plan = "KR920";
      }
      else if (bytes[7]== 10)
      {
           decoded.e_Frequency_Plan = "IN865";
      }
      else if (bytes[7]== 11)
      {
           decoded.e_Frequency_Plan = "CN470 PREQEL";
      }
      else 
      {
           decoded.e_Frequency_Plan = "STE920";
      }
      decoded.f_BLE_Open_Time = (bytes[9]*256 + bytes[8]) + 'minutes';
    }  
    else if ( bytes[0]==16 )
    {
      decoded.a_payloadtype = "The 2nd payload for Sensor data";
      decoded.g_Sensor_Type = (bytes[1]==1)?'I2C':'unknown';
      decoded.h_Temperature_Value = ((bytes[3]*256 +bytes[2])-4500)/100;
      decoded.i_Temperature_alarm = (bytes[4]==0)?'Non-Alarm':'Alarm';
      decoded.j_Humidity_Value = ((bytes[6]*256 + bytes[5])/100) + '%';
      decoded.k_Humidity_alarm =  (bytes[7]==0)?'Non-Alarm':'Alarm';
    }    
    return decoded;
}

