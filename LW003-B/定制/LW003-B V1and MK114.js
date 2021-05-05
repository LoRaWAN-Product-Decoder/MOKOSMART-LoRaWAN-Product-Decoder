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
  var beacon_rawdata_array;
  var beacon_rawdata_length;
  var MK114_Name_length;
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
    decoded.a0_Payload_Type = "The Payload for Beacon Data";
    decoded.a0_Total_Beacons_Quantities = bytes[1];
    if(bytes[1]>0)
    {
      decoded.a1_1st_Beacon_data_length = bytes[2] + 'bytes';
      decoded.a2_1st_Beacon_timestamp = (bytes[3]*256 + bytes[4])+ '/' + bytes[5] + '/' + bytes[6] + ' ' + bytes[7] + ':' + bytes[8] + ':' + bytes[9];
      decoded.a3_1st_Beacon_Mac_Address = little_endian_array_to_hex(10,15,array);
      decoded.a4_1st_Beacon_rssi = ( bytes[16] -256 )+ 'dBm';
      decoded.a5_1st_Beacon_raw_data = big_endian_array_to_hex(17,(bytes[2]+2),array);
      beacon_rawdata_array = array.slice(17,(bytes[2]+2+1));
      beacon_rawdata_length = beacon_rawdata_array.length;
      MK114_Name_length = hex_to_decimal(beacon_rawdata_array[0]);
      if(beacon_rawdata_length<=31 && beacon_rawdata_length>=22)
      {
        if( MK114_Name_length == (beacon_rawdata_length - 21) && hex_to_decimal(beacon_rawdata_array[1]) == 9)
        {
          if(beacon_rawdata_array[MK114_Name_length + 1] == "02" && beacon_rawdata_array[MK114_Name_length + 2] == "01" && beacon_rawdata_array[MK114_Name_length + 3] == "05")
          { 
            if(beacon_rawdata_array[MK114_Name_length + 4] == "10" && beacon_rawdata_array[MK114_Name_length + 5] == "FF")
              {
               if(beacon_rawdata_array[MK114_Name_length + 6] == "FF" && beacon_rawdata_array[MK114_Name_length + 7] == "20")
                 {
                  decoded.a6_MK114_MAC_Address = big_endian_array_to_hex((MK114_Name_length + 8),(MK114_Name_length + 9),beacon_rawdata_array);
                 
                  decoded.a7_MK114_Voltage = ( bytes[17 + MK114_Name_length + 10 ]*256 + bytes[17 + MK114_Name_length + 10 + 1] ) / 10 + 'V';
                
                  decoded.a8_MK114_Current = ( (bytes[17 + MK114_Name_length + 10 + 2]*65536) + (bytes[17 + MK114_Name_length + 10  + 3]*256) + bytes[17 + MK114_Name_length + 10 +4 ] ) / 1000 + 'mA';

                  decoded.a9_MK114_Power =  ( bytes[17 + MK114_Name_length + 10 + 5]*256 + bytes[17 + MK114_Name_length + 10 + 6] ) / 10 + 'W';

                  decoded.aa_MK114_Energy = ( (bytes[17 + MK114_Name_length + 10 + 7]*65536) + (bytes[17 + MK114_Name_length + 10  + 8]*256) + bytes[17 + MK114_Name_length + 10 +9 ] ) / 100 + 'KWH';
                  
                  decoded.ab_MK114_Loadstatus = (parseInt( bytes[17 + MK114_Name_length + 10 + 10]/ 32768) == 1)?'YES':'NO';
                  decoded.ac_MK114_OverLoadstatus = (parseInt( (bytes[17 + MK114_Name_length + 10 + 10] % 32768) / 16384) ==1)?'YES':'NO';
                  decoded.ad_MK114_Switch_status = (parseInt( (bytes[17 + MK114_Name_length + 10 + 10] % 16384) / 8192) ==1)?'ON':'OFF';
                 }
              }
          }
        }
      }
  
    if(bytes[1] > 1)
    {     
      b = bytes[2] + 3;
      decoded.b1_2nd_Beacon_data_length = bytes[b] + 'bytes';
      decoded.b2_2nd_Beacon_timestamp = (bytes[b + 1]*256 + bytes[b +2])+ '/' + bytes[b + 3] + '/' + bytes[b +4] + ' ' + bytes[b + 5] + ':' + bytes[b + 6] + ':' + bytes[b + 7];
      decoded.b3_2nd_Beacon_Mac_Address = little_endian_array_to_hex((b+8),(b+13),array);
      decoded.b4_2nd_Beacon_rssi = ( bytes[b + 14] -256 )+ 'dBm';
      decoded.b5_2nd_Beacon_raw_data = big_endian_array_to_hex((b+15),(b+(bytes[b])),array);
      beacon_rawdata_array = array.slice((b+15),(b+(bytes[b])+1));
      beacon_rawdata_length = beacon_rawdata_array.length;
      MK114_Name_length = hex_to_decimal(beacon_rawdata_array[0]);
      if(beacon_rawdata_length<=31 && beacon_rawdata_length>=22)
      {
        if( MK114_Name_length == (beacon_rawdata_length - 21) && hex_to_decimal(beacon_rawdata_array[1]) == 9)
        {
          if(beacon_rawdata_array[MK114_Name_length + 1] == "02" && beacon_rawdata_array[MK114_Name_length + 2] == "01" && beacon_rawdata_array[MK114_Name_length + 3] == "05")
          { 
            if(beacon_rawdata_array[MK114_Name_length + 4] == "10" && beacon_rawdata_array[MK114_Name_length + 5] == "FF")
              {
               if(beacon_rawdata_array[MK114_Name_length + 6] == "FF" && beacon_rawdata_array[MK114_Name_length + 7] == "20")
                 {
                  decoded.b6_MK114_MAC_Address = big_endian_array_to_hex((MK114_Name_length + 8),(MK114_Name_length + 9),beacon_rawdata_array);
                 
                  decoded.b7_MK114_Voltage = ( bytes[b + 15 + MK114_Name_length + 10 ]*256 + bytes[b + 15 + MK114_Name_length + 10 + 1] ) / 10 + 'V';
                
                  decoded.b8_MK114_Current = ( (bytes[b + 15 + MK114_Name_length + 10 + 2]*65536) + (bytes[b + 15 + MK114_Name_length + 10  + 3]*256) + bytes[b + 15 + MK114_Name_length + 10 +4 ] ) / 1000 + 'mA';

                  decoded.b9_MK114_Power =  ( bytes[b + 15 + MK114_Name_length + 10 + 5]*256 + bytes[b + 15 + MK114_Name_length + 10 + 6] ) / 10 + 'W';

                  decoded.ba_MK114_Energy = ( (bytes[b + 15 + MK114_Name_length + 10 + 7]*65536) + (bytes[b + 15 + MK114_Name_length + 10  + 8]*256) + bytes[b + 15 + MK114_Name_length + 10 +9 ] ) / 100 + 'KWH';
                  
                  decoded.bb_MK114_Loadstatus = (parseInt( bytes[b + 15 + MK114_Name_length + 10 + 10]/ 32768) == 1)?'YES':'NO';
                  decoded.bc_MK114_OverLoadstatus = (parseInt( (bytes[b + 15 + MK114_Name_length + 10 + 10] % 32768) / 16384) ==1)?'YES':'NO';
                  decoded.bd_MK114_Switch_status = (parseInt( (bytes[b + 15 + MK114_Name_length + 10 + 10] % 16384) / 8192) ==1)?'ON':'OFF';
                 }
              }
          }
        }
      }
    }
    if(bytes[1] > 2)
    {
      b= b + (bytes[b]) + 1;
      decoded.c1_3rd_Beacon_data_length = bytes[b] + 'bytes';
      decoded.c2_3rd_Beacon_timestamp = (bytes[b + 1]*256 + bytes[b +2])+ '/' + bytes[b + 3] + '/' + bytes[b +4] + ' ' + bytes[b + 5] + ':' + bytes[b + 6] + ':' + bytes[b + 7];
      decoded.c3_3rd_Beacon_Mac_Address = little_endian_array_to_hex((b+8),(b+13),array);
      decoded.c4_3rd_Beacon_rssi = ( bytes[b + 14] -256 )+ 'dBm';
      decoded.c5_3rd_Beacon_raw_data = big_endian_array_to_hex((b+15),(b+(bytes[b])),array);
      beacon_rawdata_array = array.slice((b+15),(b+(bytes[b])+1));
      beacon_rawdata_length = beacon_rawdata_array.length;
      MK114_Name_length = hex_to_decimal(beacon_rawdata_array[0]);
      if(beacon_rawdata_length<=31 && beacon_rawdata_length>=22)
      {
        if( MK114_Name_length == (beacon_rawdata_length - 21) && hex_to_decimal(beacon_rawdata_array[1]) == 9)
        {
          if(beacon_rawdata_array[MK114_Name_length + 1] == "02" && beacon_rawdata_array[MK114_Name_length + 2] == "01" && beacon_rawdata_array[MK114_Name_length + 3] == "05")
          { 
            if(beacon_rawdata_array[MK114_Name_length + 4] == "10" && beacon_rawdata_array[MK114_Name_length + 5] == "FF")
              {
               if(beacon_rawdata_array[MK114_Name_length + 6] == "FF" && beacon_rawdata_array[MK114_Name_length + 7] == "20")
                 {
                  decoded.c6_MK114_MAC_Address = big_endian_array_to_hex((MK114_Name_length + 8),(MK114_Name_length + 9),beacon_rawdata_array);
                 
                  decoded.c7_MK114_Voltage = ( bytes[b + 15 + MK114_Name_length + 10 ]*256 + bytes[b + 15 + MK114_Name_length + 10 + 1] ) / 10 + 'V';
                
                  decoded.c8_MK114_Current = ( (bytes[b + 15 + MK114_Name_length + 10 + 2]*65536) + (bytes[b + 15 + MK114_Name_length + 10  + 3]*256) + bytes[b + 15 + MK114_Name_length + 10 +4 ] ) / 1000 + 'mA';

                  decoded.c9_MK114_Power =  ( bytes[b + 15 + MK114_Name_length + 10 + 5]*256 + bytes[b + 15 + MK114_Name_length + 10 + 6] ) / 10 + 'W';

                  decoded.ca_MK114_Energy = ( (bytes[b + 15 + MK114_Name_length + 10 + 7]*65536) + (bytes[b + 15 + MK114_Name_length + 10  + 8]*256) + bytes[b + 15 + MK114_Name_length + 10 +9 ] ) / 100 + 'KWH';
                  
                  decoded.cb_MK114_Loadstatus = (parseInt( bytes[b + 15 + MK114_Name_length + 10 + 10]/ 32768) == 1)?'YES':'NO';
                  decoded.cc_MK114_OverLoadstatus = (parseInt( (bytes[b + 15 + MK114_Name_length + 10 + 10] % 32768) / 16384) ==1)?'YES':'NO';
                  decoded.cd_MK114_Switch_status = (parseInt( (bytes[b + 15 + MK114_Name_length + 10 + 10] % 16384) / 8192) ==1)?'ON':'OFF';
                 }
              }
          }
        }
      }
    }
    if(bytes[1] > 3)
    {
      b= b + (bytes[b]) + 1;
      decoded.d1_4th_Beacon_data_length = bytes[b] + 'bytes';
      decoded.d2_4th_Beacon_timestamp = (bytes[b + 1]*256 + bytes[b +2])+ '/' + bytes[b + 3] + '/' + bytes[b +4] + ' ' + bytes[b + 5] + ':' + bytes[b + 6] + ':' + bytes[b + 7];
      decoded.d3_4th_Beacon_Mac_Address = little_endian_array_to_hex((b+8),(b+13),array);
      decoded.d4_4th_Beacon_rssi = ( bytes[b + 14] -256 )+ 'dBm';
      decoded.d5_4th_Beacon_raw_data = big_endian_array_to_hex((b+15),(b+(bytes[b])),array);
      beacon_rawdata_array = array.slice((b+15),(b+(bytes[b])+1));
      beacon_rawdata_length = beacon_rawdata_array.length;
      MK114_Name_length = hex_to_decimal(beacon_rawdata_array[0]);
      if(beacon_rawdata_length<=31 && beacon_rawdata_length>=22)
      {
        if( MK114_Name_length == (beacon_rawdata_length - 21) && hex_to_decimal(beacon_rawdata_array[1]) == 9)
        {
          if(beacon_rawdata_array[MK114_Name_length + 1] == "02" && beacon_rawdata_array[MK114_Name_length + 2] == "01" && beacon_rawdata_array[MK114_Name_length + 3] == "05")
          { 
            if(beacon_rawdata_array[MK114_Name_length + 4] == "10" && beacon_rawdata_array[MK114_Name_length + 5] == "FF")
              {
               if(beacon_rawdata_array[MK114_Name_length + 6] == "FF" && beacon_rawdata_array[MK114_Name_length + 7] == "20")
                 {
                  decoded.d6_MK114_MAC_Address = big_endian_array_to_hex((MK114_Name_length + 8),(MK114_Name_length + 9),beacon_rawdata_array);
                 
                  decoded.d7_MK114_Voltage = ( bytes[b + 15 + MK114_Name_length + 10 ]*256 + bytes[b + 15 + MK114_Name_length + 10 + 1] ) / 10 + 'V';
                
                  decoded.d8_MK114_Current = ( (bytes[b + 15 + MK114_Name_length + 10 + 2]*65536) + (bytes[b + 15 + MK114_Name_length + 10  + 3]*256) + bytes[b + 15 + MK114_Name_length + 10 +4 ] ) / 1000 + 'mA';

                  decoded.d9_MK114_Power =  ( bytes[b + 15 + MK114_Name_length + 10 + 5]*256 + bytes[b + 15 + MK114_Name_length + 10 + 6] ) / 10 + 'W';

                  decoded.da_MK114_Energy = ( (bytes[b + 15 + MK114_Name_length + 10 + 7]*65536) + (bytes[b + 15 + MK114_Name_length + 10  + 8]*256) + bytes[b + 15 + MK114_Name_length + 10 +9 ] ) / 100 + 'KWH';
                  
                  decoded.db_MK114_Loadstatus = (parseInt( bytes[b + 15 + MK114_Name_length + 10 + 10]/ 32768) == 1)?'YES':'NO';
                  decoded.dc_MK114_OverLoadstatus = (parseInt( (bytes[b + 15 + MK114_Name_length + 10 + 10] % 32768) / 16384) ==1)?'YES':'NO';
                  decoded.dd_MK114_Switch_status = (parseInt( (bytes[b + 15 + MK114_Name_length + 10 + 10] % 16384) / 8192) ==1)?'ON':'OFF';
                 }
              }
          }
        }
      }
    }
    if(bytes[1] > 4)
    {
      b= b + (bytes[b]) + 1;
      decoded.e1_5th_Beacon_data_length = bytes[b] + 'bytes';
      decoded.e2_5th_Beacon_timestamp = (bytes[b + 1]*256 + bytes[b +2])+ '/' + bytes[b + 3] + '/' + bytes[b +4] + ' ' + bytes[b + 5] + ':' + bytes[b + 6] + ':' + bytes[b + 7];
      decoded.e3_5th_Beacon_Mac_Address = little_endian_array_to_hex((b+8),(b+13),array);
      decoded.e4_5th_Beacon_rssi = ( bytes[b + 14] -256 )+ 'dBm';
      decoded.e5_5th_Beacon_raw_data = big_endian_array_to_hex((b+15),(b+(bytes[b])),array);
      beacon_rawdata_array = array.slice((b+15),(b+(bytes[b])+1));
      beacon_rawdata_length = beacon_rawdata_array.length;
      MK114_Name_length = hex_to_decimal(beacon_rawdata_array[0]);
      if(beacon_rawdata_length<=31 && beacon_rawdata_length>=22)
      {
        if( MK114_Name_length == (beacon_rawdata_length - 21) && hex_to_decimal(beacon_rawdata_array[1]) == 9)
        {
          if(beacon_rawdata_array[MK114_Name_length + 1] == "02" && beacon_rawdata_array[MK114_Name_length + 2] == "01" && beacon_rawdata_array[MK114_Name_length + 3] == "05")
          { 
            if(beacon_rawdata_array[MK114_Name_length + 4] == "10" && beacon_rawdata_array[MK114_Name_length + 5] == "FF")
              {
               if(beacon_rawdata_array[MK114_Name_length + 6] == "FF" && beacon_rawdata_array[MK114_Name_length + 7] == "20")
                 {
                  decoded.e6_MK114_MAC_Address = big_endian_array_to_hex((MK114_Name_length + 8),(MK114_Name_length + 9),beacon_rawdata_array);
                 
                  decoded.e7_MK114_Voltage = ( bytes[b + 15 + MK114_Name_length + 10 ]*256 + bytes[b + 15 + MK114_Name_length + 10 + 1] ) / 10 + 'V';
                
                  decoded.e8_MK114_Current = ( (bytes[b + 15 + MK114_Name_length + 10 + 2]*65536) + (bytes[b + 15 + MK114_Name_length + 10  + 3]*256) + bytes[b + 15 + MK114_Name_length + 10 +4 ] ) / 1000 + 'mA';

                  decoded.e9_MK114_Power =  ( bytes[b + 15 + MK114_Name_length + 10 + 5]*256 + bytes[b + 15 + MK114_Name_length + 10 + 6] ) / 10 + 'W';

                  decoded.ea_MK114_Energy = ( (bytes[b + 15 + MK114_Name_length + 10 + 7]*65536) + (bytes[b + 15 + MK114_Name_length + 10  + 8]*256) + bytes[b + 15 + MK114_Name_length + 10 +9 ] ) / 100 + 'KWH';
                  
                  decoded.eb_MK114_Loadstatus = (parseInt( bytes[b + 15 + MK114_Name_length + 10 + 10]/ 32768) == 1)?'YES':'NO';
                  decoded.ec_MK114_OverLoadstatus = (parseInt( (bytes[b + 15 + MK114_Name_length + 10 + 10] % 32768) / 16384) ==1)?'YES':'NO';
                  decoded.ed_MK114_Switch_status = (parseInt( (bytes[b + 15 + MK114_Name_length + 10 + 10] % 16384) / 8192) ==1)?'ON':'OFF';
                 }
              }
          }
        }
      }
    }
    if(bytes[1] > 5)
    {
      b= b + (bytes[b]) + 1;
      decoded.f1_6th_Beacon_data_length = bytes[b] + 'bytes';
      decoded.f2_6th_Beacon_timestamp = (bytes[b + 1]*256 + bytes[b +2])+ '/' + bytes[b + 3] + '/' + bytes[b +4] + ' ' + bytes[b + 5] + ':' + bytes[b + 6] + ':' + bytes[b + 7];
      decoded.f3_6th_Beacon_Mac_Address = little_endian_array_to_hex((b+8),(b+13),array);
      decoded.f4_6th_Beacon_rssi = ( bytes[b + 14] -256 )+ 'dBm';
      decoded.f5_6th_Beacon_raw_data = big_endian_array_to_hex((b+15),(b+(bytes[b])),array);
      beacon_rawdata_array = array.slice((b+15),(b+(bytes[b])+1));
      beacon_rawdata_length = beacon_rawdata_array.length;
      MK114_Name_length = hex_to_decimal(beacon_rawdata_array[0]);
      if(beacon_rawdata_length<=31 && beacon_rawdata_length>=22)
      {
        if( MK114_Name_length == (beacon_rawdata_length - 21) && hex_to_decimal(beacon_rawdata_array[1]) == 9)
        {
          if(beacon_rawdata_array[MK114_Name_length + 1] == "02" && beacon_rawdata_array[MK114_Name_length + 2] == "01" && beacon_rawdata_array[MK114_Name_length + 3] == "05")
          { 
            if(beacon_rawdata_array[MK114_Name_length + 4] == "10" && beacon_rawdata_array[MK114_Name_length + 5] == "FF")
              {
               if(beacon_rawdata_array[MK114_Name_length + 6] == "FF" && beacon_rawdata_array[MK114_Name_length + 7] == "20")
                 {
                  decoded.f6_MK114_MAC_Address = big_endian_array_to_hex((MK114_Name_length + 8),(MK114_Name_length + 9),beacon_rawdata_array);
                 
                  decoded.f7_MK114_Voltage = ( bytes[b + 15 + MK114_Name_length + 10 ]*256 + bytes[b + 15 + MK114_Name_length + 10 + 1] ) / 10 + 'V';
                
                  decoded.f8_MK114_Current = ( (bytes[b + 15 + MK114_Name_length + 10 + 2]*65536) + (bytes[b + 15 + MK114_Name_length + 10  + 3]*256) + bytes[b + 15 + MK114_Name_length + 10 +4 ] ) / 1000 + 'mA';

                  decoded.f9_MK114_Power =  ( bytes[b + 15 + MK114_Name_length + 10 + 5]*256 + bytes[b + 15 + MK114_Name_length + 10 + 6] ) / 10 + 'W';

                  decoded.fa_MK114_Energy = ( (bytes[b + 15 + MK114_Name_length + 10 + 7]*65536) + (bytes[b + 15 + MK114_Name_length + 10  + 8]*256) + bytes[b + 15 + MK114_Name_length + 10 +9 ] ) / 100 + 'KWH';
                  
                  decoded.fb_MK114_Loadstatus = (parseInt( bytes[b + 15 + MK114_Name_length + 10 + 10]/ 32768) == 1)?'YES':'NO';
                  decoded.fc_MK114_OverLoadstatus = (parseInt( (bytes[b + 15 + MK114_Name_length + 10 + 10] % 32768) / 16384) ==1)?'YES':'NO';
                  decoded.fd_MK114_Switch_status = (parseInt( (bytes[b + 15 + MK114_Name_length + 10 + 10] % 16384) / 8192) ==1)?'ON':'OFF';
                 }
              }
          }
        }
      }
    }
    if(bytes[1] > 6)
    {
      b= b + (bytes[b]) + 1;
      decoded.g1_7th_Beacon_data_length = bytes[b] + 'bytes';
      decoded.g2_7th_Beacon_timestamp = (bytes[b + 1]*256 + bytes[b +2])+ '/' + bytes[b + 3] + '/' + bytes[b +4] + ' ' + bytes[b + 5] + ':' + bytes[b + 6] + ':' + bytes[b + 7];
      decoded.g3_7th_Beacon_Mac_Address = little_endian_array_to_hex((b+8),(b+13),array);
      decoded.g4_7th_Beacon_rssi = ( bytes[b + 14] -256 )+ 'dBm';
      decoded.g5_7th_Beacon_raw_data = big_endian_array_to_hex((b+15),(b+(bytes[b])),array);
      beacon_rawdata_array = array.slice((b+15),(b+(bytes[b])+1));
      beacon_rawdata_length = beacon_rawdata_array.length;
      MK114_Name_length = hex_to_decimal(beacon_rawdata_array[0]);
      if(beacon_rawdata_length<=31 && beacon_rawdata_length>=22)
      {
        if( MK114_Name_length == (beacon_rawdata_length - 21) && hex_to_decimal(beacon_rawdata_array[1]) == 9)
        {
          if(beacon_rawdata_array[MK114_Name_length + 1] == "02" && beacon_rawdata_array[MK114_Name_length + 2] == "01" && beacon_rawdata_array[MK114_Name_length + 3] == "05")
          { 
            if(beacon_rawdata_array[MK114_Name_length + 4] == "10" && beacon_rawdata_array[MK114_Name_length + 5] == "FF")
              {
               if(beacon_rawdata_array[MK114_Name_length + 6] == "FF" && beacon_rawdata_array[MK114_Name_length + 7] == "20")
                 {
                  decoded.g6_MK114_MAC_Address = big_endian_array_to_hex((MK114_Name_length + 8),(MK114_Name_length + 9),beacon_rawdata_array);
                 
                  decoded.g7_MK114_Voltage = ( bytes[b + 15 + MK114_Name_length + 10 ]*256 + bytes[b + 15 + MK114_Name_length + 10 + 1] ) / 10 + 'V';
                
                  decoded.g8_MK114_Current = ( (bytes[b + 15 + MK114_Name_length + 10 + 2]*65536) + (bytes[b + 15 + MK114_Name_length + 10  + 3]*256) + bytes[b + 15 + MK114_Name_length + 10 +4 ] ) / 1000 + 'mA';

                  decoded.g9_MK114_Power =  ( bytes[b + 15 + MK114_Name_length + 10 + 5]*256 + bytes[b + 15 + MK114_Name_length + 10 + 6] ) / 10 + 'W';

                  decoded.ga_MK114_Energy = ( (bytes[b + 15 + MK114_Name_length + 10 + 7]*65536) + (bytes[b + 15 + MK114_Name_length + 10  + 8]*256) + bytes[b + 15 + MK114_Name_length + 10 +9 ] ) / 100 + 'KWH';
                  
                  decoded.gb_MK114_Loadstatus = (parseInt( bytes[b + 15 + MK114_Name_length + 10 + 10]/ 32768) == 1)?'YES':'NO';
                  decoded.gc_MK114_OverLoadstatus = (parseInt( (bytes[b + 15 + MK114_Name_length + 10 + 10] % 32768) / 16384) ==1)?'YES':'NO';
                  decoded.gd_MK114_Switch_status = (parseInt( (bytes[b + 15 + MK114_Name_length + 10 + 10] % 16384) / 8192) ==1)?'ON':'OFF';
                 }
              }
          }
        }
      }
    } 
  }
  return decoded;
 }
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
function hex_to_decimal(hex)
{
  if(hex == "01"){ hex = 1;}
  else if(hex == "02"){ hex = 2;}
  else if(hex == "03"){ hex = 3;}
  else if(hex == "04"){ hex = 4;}
  else if(hex == "05"){ hex = 5;}
  else if(hex == "06"){ hex = 6;}
  else if(hex == "06"){ hex = 6;}
  else if(hex == "07"){ hex = 7;}
  else if(hex == "08"){ hex = 8;}
  else if(hex == "09"){ hex = 9;}
  else
  { hex = 10;}
  return hex;
}
    
  