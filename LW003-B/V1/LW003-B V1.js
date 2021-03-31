//LW003-B Payload Decoder rule
//Creation time：2021-02-01
//Creator：Allen Zhang
//Suitable firmware versions：LW003-B v1
//Programming languages：Javascript
//Suitable platforms：TTN
function Decoder(bytes, port) {
  var decoded = {};
  var array;
  var b;
  array = base64_to_hexarray(bytes);  //将数组进行转化
  if (bytes[0] == 1 )    
  {
   decoded.a_Payload_Type = "The 1st Payload for device information";
   decoded.b_battery_level = bytes[1] + '%';
   decoded.c_battery_voltage = (bytes[3]*256 + bytes[2])/1000 + 'V';
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

    decoded.f_Scan_Switch_Status = (bytes[8] == 0)?'Switch off':'Switch on';
    decoded.g_BLE_Connection_Status = (bytes[9]==0)?'Disconnected':'Connected';
    decoded.h_BLE_Connection_Times = (bytes[11]*256 + bytes[10]) + 'time';
  }
  else
  {
    decoded.a0_Payload_Type = "The Payload for Beacon Data"
    decoded.a0_Total_Beacons_Quantities = bytes[1];
    if(bytes[1]>0)
    {
      decoded.a1_1st_Beacon_data_length = bytes[2] + 'bytes';
      decoded.a2_1st_Beacon_timestamp = (bytes[3]*256 + bytes[4])+ '/' + bytes[5] + '/' + bytes[6] + ' ' + bytes[7] + ':' + bytes[8] + ':' + bytes[9];
      decoded.a3_1st_Beacon_Mac_Address = little_endian_array_to_hex(10,15,array);
      decoded.a4_1st_Beacon_rssi = ( bytes[16] -256 )+ 'dBm';
      decoded.a5_1st_Beacon_raw_data = big_endian_array_to_hex(17,(bytes[2]+2),array)
    }
    if(bytes[1] > 1)
    {     
      b = bytes[2] + 3;
      decoded.b1_2nd_Beacon_data_length = bytes[b] + 'bytes';
      decoded.b2_2nd_Beacon_timestamp = (bytes[b + 1]*256 + bytes[b +2])+ '/' + bytes[b + 3] + '/' + bytes[b +4] + ' ' + bytes[b + 5] + ':' + bytes[b + 6] + ':' + bytes[b + 7];
      decoded.b3_2nd_Beacon_Mac_Address = little_endian_array_to_hex((b+8),(b+13),array);
      decoded.b4_2nd_Beacon_rssi = ( bytes[b + 14] -256 )+ 'dBm';
      decoded.b5_2nd_Beacon_raw_data = big_endian_array_to_hex((b+15),(b+(bytes[b])),array);
    }
    if(bytes[1] > 2)
    {
      b= b + (bytes[b]) + 1;
      decoded.c1_3rd_Beacon_data_length = bytes[b] + 'bytes';
      decoded.c2_3rd_Beacon_timestamp = (bytes[b + 1]*256 + bytes[b +2])+ '/' + bytes[b + 3] + '/' + bytes[b +4] + ' ' + bytes[b + 5] + ':' + bytes[b + 6] + ':' + bytes[b + 7];
      decoded.c3_3rd_Beacon_Mac_Address = little_endian_array_to_hex((b+8),(b+13),array);
      decoded.c4_3rd_Beacon_rssi = ( bytes[b + 14] -256 )+ 'dBm';
      decoded.c5_3rd_Beacon_raw_data = big_endian_array_to_hex((b+15),(b+(bytes[b])),array);
    }
    if(bytes[1] > 3)
    {
      b= b + (bytes[b]) + 1;
      decoded.d1_4th_Beacon_data_length = bytes[b] + 'bytes';
      decoded.d2_4th_Beacon_timestamp = (bytes[b + 1]*256 + bytes[b +2])+ '/' + bytes[b + 3] + '/' + bytes[b +4] + ' ' + bytes[b + 5] + ':' + bytes[b + 6] + ':' + bytes[b + 7];
      decoded.d3_4th_Beacon_Mac_Address = little_endian_array_to_hex((b+8),(b+13),array);
      decoded.d4_4th_Beacon_rssi = ( bytes[b + 14] -256 )+ 'dBm';
      decoded.d5_4th_Beacon_raw_data = big_endian_array_to_hex((b+15),(b+(bytes[b])),array);
    }
    if(bytes[1] > 4)
    {
      b= b + (bytes[b]) + 1;
      decoded.e1_5th_Beacon_data_length = bytes[b] + 'bytes';
      decoded.e2_5th_Beacon_timestamp = (bytes[b + 1]*256 + bytes[b +2])+ '/' + bytes[b + 3] + '/' + bytes[b +4] + ' ' + bytes[b + 5] + ':' + bytes[b + 6] + ':' + bytes[b + 7];
      decoded.e3_5th_Beacon_Mac_Address = little_endian_array_to_hex((b+8),(b+13),array);
      decoded.e4_5th_Beacon_rssi = ( bytes[b + 14] -256 )+ 'dBm';
      decoded.e5_5th_Beacon_raw_data = big_endian_array_to_hex((b+15),(b+(bytes[b])),array);
    }
    if(bytes[1] > 5)
    {
      b= b + (bytes[b]) + 1;
      decoded.f1_6th_Beacon_data_length = bytes[b] + 'bytes';
      decoded.f2_6th_Beacon_timestamp = (bytes[b + 1]*256 + bytes[b +2])+ '/' + bytes[b + 3] + '/' + bytes[b +4] + ' ' + bytes[b + 5] + ':' + bytes[b + 6] + ':' + bytes[b + 7];
      decoded.f3_6th_Beacon_Mac_Address = little_endian_array_to_hex((b+8),(b+13),array);
      decoded.f4_6th_Beacon_rssi = ( bytes[b + 14] -256 )+ 'dBm';
      decoded.f5_6th_Beacon_raw_data = big_endian_array_to_hex((b+15),(b+(bytes[b])),array);
    }
    if(bytes[1] > 6)
    {
      b= b + (bytes[b]) + 1;
      decoded.g1_7th_Beacon_data_length = bytes[b] + 'bytes';
      decoded.g2_7th_Beacon_timestamp = (bytes[b + 1]*256 + bytes[b +2])+ '/' + bytes[b + 3] + '/' + bytes[b +4] + ' ' + bytes[b + 5] + ':' + bytes[b + 6] + ':' + bytes[b + 7];
      decoded.g3_7th_Beacon_Mac_Address = little_endian_array_to_hex((b+8),(b+13),array);
      decoded.g4_7th_Beacon_rssi = ( bytes[b + 14] -256 )+ 'dBm';
      decoded.g5_7th_Beacon_raw_data = big_endian_array_to_hex((b+15),(b+(bytes[b])),array);
    } 
  }
  return decoded;
}

function big_endian_array_to_hex(start_point,end_point,array){
  var c;
  var d = '';
  for(c = start_point;c <= end_point;c++)
   {
       d = d + array[c] + ' ';
   }
   return d;
  }
  
function little_endian_array_to_hex(start_point,end_point,array){
    var c;
    var d = '';
    for(c = end_point; c >= start_point;c--)
     {
         d = d + array[c] + ' ';
     }
     return d;
    }
  
function base64_to_hexarray(bytes) {
    var a = bytes.length; 
    var bytesarray = []; 
    for(b =0; b < a;b++)   
    {
      if(bytes[b]<16)
      {
        bytesarray[b] = (0 + (bytes[b].toString(16))).toUpperCase();
      }
      else
      { 
        bytesarray[b] = bytes[b].toString(16).toUpperCase();
      }
    }
    return bytesarray; 
}
    
  