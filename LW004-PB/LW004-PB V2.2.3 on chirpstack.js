//LW004-PB Payload Decoder rule
//Creation time：2021-01-27 
//Creator：Allen Zhang
//Suitable firmware versions：LW004-PB V2.2.3 
//Programming languages：Javascript
//Suitable platforms：TTN

function Decode(port,bytes)
{
  // Decode an uplink message from a buffer
  // (array) of bytes to an object of fields.
  var decoded = {}; 
  decoded.a_batterylevle = bytes[0] + '%';  //Parse  Battery Level 
  decoded.b_alarmstatus = (bytes[1] === 0) ? 'Non-alarm mode':'alarm mode';  //Parse Alarm mode

  // Parse longitude
  if (bytes[9]>127)   // If the longitude is negative
  {
    decoded.c_longitude = ( ( (bytes[9]*16777216) + (bytes[8]*65536) + (bytes[7]*256) + bytes[6] - 4294967296) *180 )/8388607 + '°';
  }
  else               // If the longitude is positive
  {
    decoded.c_longitude = ( ( (bytes[9]*16777216) + (bytes[8]*65536) + (bytes[7]*256) + bytes[6] ) *180 )/8388607 + '°';
  }


  // Parse latitude
  if (bytes[5]>127)  // If the latitude is negative
  {
    decoded.d_latitude = ( ( (bytes[5]*16777216) + (bytes[4]*65536) + (bytes[3]*256) + bytes[2] - 4294967296) *90 )/8388607 + '°';
  }
  else               // If the latitude is positive
  {
    decoded.d_latitude = ( ( (bytes[5]*16777216) + (bytes[4]*65536) + (bytes[3]*256) + bytes[2] ) *90 )/8388607 + '°';
  }

  var a = bytes.length; // According the length of the payload, Calculate the quantity of beacon devices
  var c;    
  var d;
  if(a == 25)  // When the quantity of beacon devices uploaded is 1, the length of payload should be 25
  { 
    // Parse beacon's MAC Address
    d = ' ';   // Set d to space
    for(c=10;c<16;c++)  
    {
      if(bytes[c]<16)
      {        
        d = d + 0 +(bytes[c].toString(16)) + ' '; // If the high value of the byte is 0        
      }
      else
      {
        d = d + (bytes[c].toString(16)) + ' ';    // If the high value of the byte isn't 0
      }
    }
    decoded.e_Beacon_Mac_Address = d.toUpperCase();   // Represents beacon's MAC Address in uppercase numbers   
    decoded.f_MAC_RSSI = (bytes[16] -256) + 'dBm';  // Parse beacon's RSSI 
    decoded.g_Xaxis = bytes[17]*256 + bytes[18]// Parse X-axis Acceleration
    decoded.h_Yaxis = bytes[19]*256 + bytes[20]  // Parse Y-axis Acceleration
    decoded.i_Zaxis = bytes[21]*256 + bytes[22] // Parse Z-axis Acceleration
    if(decoded.g_Xaxis>32767)
             decoded.g_Xaxis -= 65536;
    if(decoded.h_Yaxis>32767)
             decoded.h_Yaxis -= 65536;
    if(decoded.i_Zaxis>32767)
             decoded.i_Zaxis -= 65536;
    decoded.g_Xaxis += "mg";
    decoded.h_Yaxis += "mg";
    decoded.i_Zaxis += "mg";
    decoded.j_Angular = (bytes[23]*256 + bytes[24]) + '°'; // 
  }


  if(a == 32)  // When the quantity of beacon devices uploaded is 2, the length of payload should be 32
  {  
    // Parse 1st beacon's MAC Address
    d = ' ';   // Set d to space
    for(c=10;c<16;c++)  
    {
      if(bytes[c]<16)
      {       
        d = d + 0 +(bytes[c].toString(16)) + ' '; // If the high value of the byte is 0       
      }
      else
      {
        d = d + (bytes[c].toString(16)) + ' ';    // If the high value of the byte isn't 0
      }
    }
    decoded.e_1st_Beacon_Mac_Address = d.toUpperCase();   // Represents 1st beacon's MAC Address in uppercase numbers
    decoded.f_1st_MAC_RSSI = (bytes[16] -256) + 'dBm';  // Parse 1st beacon's  RSSI

    // Parse 2nd beacon's MAC Address
    d = ' ';   // Set d to space
    for(c=17;c<23;c++)  
    {
      if(bytes[c]<16)
      {       
        d = d + 0 +(bytes[c].toString(16)) + ' '; // If the high value of the byte is 0      
      }
      else
      {
        d = d + (bytes[c].toString(16)) + ' ';    // If the high value of the byte isn't 0
      }
    }
    decoded.g_2nd_Beacon_Mac_Address = d.toUpperCase();   // Represents 2nd beacon's MAC Address uppercase numbers   
    decoded.h_2nd_MAC_RSSI = (bytes[23] -256) + 'dBm';  // Parse 2nd beacon's RSSI
    decoded.i_Xaxis = bytes[24]*256 + bytes[25]// Parse X-axis Acceleration
    decoded.j_Yaxis = bytes[26]*256 + bytes[27]  // Parse Y-axis Acceleration
    decoded.k_Zaxis = bytes[28]*256 + bytes[29] // Parse Z-axis Acceleration
    if(decoded.i_Xaxis>32767)
             decoded.i_Xaxis -= 65536;
    if(decoded.j_Yaxis>32767)
             decoded.j_Yaxis -= 65536;
    if(decoded.k_Zaxis>32767)
             decoded.k_Zaxis -= 65536;
    decoded.i_Xaxis += "mg";
    decoded.j_Yaxis += "mg";
    decoded.k_Zaxis += "mg";
    decoded.l_Angular = (bytes[30]*256 + bytes[31]) + '°'; // 
  }

  if(a == 39)  // When the quantity of beacon devices uploaded is 3, the length of payload should be 39
  {
   
    // Parse 1st beacon's MAC Address
    d = ' ';   // Set d to space
    for(c=10;c<16;c++)  
    {
      if(bytes[c]<16)
      {       
        d = d + 0 +(bytes[c].toString(16)) + ' '; // If the high value of the byte is 0      
      }
      else
      {
        d = d + (bytes[c].toString(16)) + ' ';    // If the high value of the byte isn't 0
      }
    }
    decoded.e_1st_Beacon_Mac_Address = d.toUpperCase();   // Represents 1st beacon's MAC Address in uppercase numbers
    decoded.f_1st_MAC_RSSI = (bytes[16] -256) + 'dBm';  // Parse 1st beacon's  RSSI

    // Parse 2nd beacon's MAC Address
    d = ' ';   // Set d to space
    for(c=17;c<23;c++)  
    {
      if(bytes[c]<16)
      {      
        d = d + 0 +(bytes[c].toString(16)) + ' '; // If the high value of the byte is 0      
      }
      else
      {
        d = d + (bytes[c].toString(16)) + ' ';    // If the high value of the byte isn't 0
      }
    }
    decoded.g_2nd_Beacon_Mac_Address = d.toUpperCase();   // Represents 2nd beacon's MAC Address uppercase numbers   
    decoded.h_2nd_MAC_RSSI = (bytes[23] -256) + 'dBm';  // Parse 2nd beacon's RSSI

    // Parse 3rd beacon's MAC Address
    d = ' ';   // Set d to space
    for(c=24;c<30;c++)  
    {
      if(bytes[c]<16)
      {       
        d = d + 0 +(bytes[c].toString(16)) + ' '; // If the high value of the byte is 0       
      }
      else
      {
        d = d + (bytes[c].toString(16)) + ' ';    // If the high value of the byte isn't 0
      }
    }
    decoded.i_3rd_Beacon_Mac_Address = d.toUpperCase();   // Represents 3rd beacon's MAC Address uppercase numbers   
    decoded.j_3rd_MAC_RSSI = (bytes[30] -256) + 'dBm';  // Parse 3rd beacon's RSSI
    decoded.k_Xaxis = bytes[31]*256 + bytes[32]// Parse X-axis Acceleration
    decoded.l_Yaxis = bytes[33]*256 + bytes[34]  // Parse Y-axis Acceleration
    decoded.m_Zaxis = bytes[35]*256 + bytes[36] // Parse Z-axis Acceleration
    if(decoded.k_Xaxis>32767)
             decoded.k_Xaxis -= 65536;
    if(decoded.l_Yaxis>32767)
             decoded.l_Yaxis -= 65536;
    if(decoded.m_Zaxis>32767)
             decoded.m_Zaxis -= 65536;
    decoded.k_Xaxis += "mg";
    decoded.l_Yaxis += "mg";
    decoded.m_Zaxis += "mg";
    decoded.n_Angular = (bytes[37]*256 + bytes[38]) + '°'; // 
  }

  if(a == 46)  // When the quantity of beacon devices uploaded is 4, the length of payload should be 46
  {  
    // Parse 1st beacon's MAC Address
    d = ' ';   // Set d to space
    for(c=10;c<16;c++)  
    {
      if(bytes[c]<16)
      {       
        d = d + 0 +(bytes[c].toString(16)) + ' '; // If the high value of the byte is 0       
      }
      else
      {
        d = d + (bytes[c].toString(16)) + ' ';    // If the high value of the byte isn't 0
      }
    }
    decoded.e_1st_Beacon_Mac_Address = d.toUpperCase();   // Represents 1st beacon's MAC Address in uppercase numbers
    decoded.f_1st_MAC_RSSI = (bytes[16] -256) + 'dBm';  // Parse 1st beacon's  RSSI

    // Parse 2nd beacon's MAC Address
    d = ' ';   // Set d to space
    for(c=17;c<23;c++)  
    {
      if(bytes[c]<16)
      {       
        d = d + 0 +(bytes[c].toString(16)) + ' '; // If the high value of the byte is 0       
      }
      else
      {
        d = d + (bytes[c].toString(16)) + ' ';    // If the high value of the byte isn't 0
      }
    }
    decoded.g_2nd_Beacon_Mac_Address = d.toUpperCase();   // Represents 2nd beacon's MAC Address uppercase numbers    
    decoded.h_2nd_MAC_RSSI = (bytes[23] -256) + 'dBm';  // Parse 2nd beacon's RSSI

    // Parse 3rd beacon's MAC Address
    d = ' ';   // Set d to space
    for(c=24;c<30;c++)  
    {
      if(bytes[c]<16)
      {       
        d = d + 0 +(bytes[c].toString(16)) + ' '; // If the high value of the byte is 0       
      }
      else
      {
        d = d + (bytes[c].toString(16)) + ' ';    // If the high value of the byte isn't 0
      }
    }
    decoded.i_3rd_Beacon_Mac_Address = d.toUpperCase();   // Represents 3rd beacon's MAC Address uppercase numbers    
    decoded.j_3rd_MAC_RSSI = (bytes[30] -256) + 'dBm';  // Parse 3rd beacon's RSSI

    // Parse 4th beacon's MAC Address
    d = ' ';   // Set d to space
    for(c=31;c<37;c++)  
    {
      if(bytes[c]<16)
      {       
        d = d + 0 +(bytes[c].toString(16)) + ' '; // If the high value of the byte is 0       
      }
      else
      {
        d = d + (bytes[c].toString(16)) + ' ';    // If the high value of the byte isn't 0
      }
    }
    decoded.k_4th_Beacon_Mac_Address = d.toUpperCase();   // Represents 4th beacon's MAC Address uppercase numbers  
    decoded.l_4th_MAC_RSSI = (bytes[37] -256) + 'dBm';  // Parse 4th beacon's RSSI
    decoded.m_Xaxis = bytes[38]*256 + bytes[39]// Parse X-axis Acceleration
    decoded.n_Yaxis = bytes[40]*256 + bytes[41]  // Parse Y-axis Acceleration
    decoded.o_Zaxis = bytes[42]*256 + bytes[43] // Parse Z-axis Acceleration
    if(decoded.m_Xaxis>32767)
             decoded.m_Xaxis -= 65536;
    if(decoded.n_Yaxis>32767)
             decoded.n_Yaxis -= 65536;
    if(decoded.o_Zaxis>32767)
             decoded.o_Zaxis -= 65536;
    decoded.m_Xaxis += "mg";
    decoded.n_Yaxis += "mg";
    decoded.o_Zaxis += "mg";
    decoded.p_Angular = (bytes[44]*256 + bytes[45]) + '°'; // 
  }
  return decoded;
}