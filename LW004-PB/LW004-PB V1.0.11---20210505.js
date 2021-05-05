//LW004-PB Payload Decoder rule
//Creation time：2021-01-27 
//Creator：Allen Zhang
//Suitable firmware versions：LW004-PB V1.0.11 
//Programming languages：Javascript
//Suitable platforms：TTN
function Decoder(bytes) {
  // Decode an uplink message from a buffer
  // (array) of bytes to an object of fields.
  var decoded = {};
  var a;
  var c;
  var d;
  decoded.a_batterylevle = bytes[0] + '%';
  decoded.b_alarmstatus = (bytes[1] === 0) ? 'Non-alarm mode':'alarm mode';
  if (bytes[9]>127) 
  {
    decoded.c_longitude = ( ( (bytes[9]*16777216) + (bytes[8]*65536) + (bytes[7]*256) + bytes[6] - 4294967296) *180 )/8388607 + '°';
  }
  else
  {
    decoded.c_longitude = ( ( (bytes[9]*16777216) + (bytes[8]*65536) + (bytes[7]*256) + bytes[6] ) *180 )/8388607 + '°';
  }
  if (bytes[5]>127)
  {
    decoded.d_latitude = ( ( (bytes[5]*16777216) + (bytes[4]*65536) + (bytes[3]*256) + bytes[2] - 4294967296) *90 )/8388607 + '°';
  }
  else
  {
    decoded.d_latitude = ( ( (bytes[5]*16777216) + (bytes[4]*65536) + (bytes[3]*256) + bytes[2] ) *90 )/8388607 + '°';
  }
  if(bytes[10]<16)
  {
    
    d = 0 +(bytes[10].toString(16));

  }
  else
  {
    d = (bytes[10].toString(16));
  }
  for(c=11;c<16;c++)
  {
    if(bytes[c]<16)
    {
      
      d = d + 0 +(bytes[c].toString(16));

    }
    else
    {
      d = d + (bytes[c].toString(16));
    }
  }
  decoded.e_Beacon_Mac_Address = d.toUpperCase();
  a = ((bytes[16] << 8) | bytes[17]);
  if(a>0X8000)
  {
    decoded.f_Xaxis = "-"+(0x10000-a)/ 16384 + 'g';
  }
  else
  {
    decoded.f_Xaxis = a / 16384 + 'g';
  }
  a = ((bytes[18] << 8) | bytes[19]);
  if(a>0X8000)
  {
    decoded.g_Yaxis = "-"+(0x10000-a)/ 16384 + 'g';
  }
  else
  {
    decoded.g_Yaxis = a / 16384 + 'g';
  }
  a = ((bytes[20] << 8) | bytes[21]);
  if(a>0X8000)
  {
    decoded.h_Zaxis = "-"+(0x10000-a)/ 16384 + 'g';
  }
  else
  {
    decoded.h_Zaxis = a / 16384 + 'g';
  }
  decoded.i_Angular = (bytes[22]*256 + bytes[23]) + '°';
  return decoded;
}