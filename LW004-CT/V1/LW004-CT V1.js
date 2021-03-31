//LW004-CT Payload Decoder rule
//Creation time：2021-01-27
//Creator:Allen Zhang
//Suitable firmware versions：V1.0.13
//Programming languages：Javascript
//Suitable platforms：TTN
function Decoder(bytes, port) {
  var decoded = {};
  var b;
  var c;
  var d;
  decoded.a_payload_data_type = (bytes[0]===0)?'Non-alarm mode':'alarm mode';
  decoded.b_Beacon_Timestamp = (bytes[1]*256 + bytes[2])+ '/' + bytes[3] + '/' + bytes[4] + ' ' + bytes[5] + ':' + bytes[6] + ':' + bytes[7];
  if(bytes[8]<16)
  {
    
    d = 0 +(bytes[8].toString(16));

  }
  else
  {
    d = (bytes[8].toString(16));
  }
  for(c=9;c<14;c++)
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
  decoded.c_Beacon_Mac_Address = d.toUpperCase();
  decoded.d_Beaocn_RSSI = (bytes[14] - 256) + 'dBm';
  b = bytes.length;
  if(bytes[15]<16)
    {
      
      d = 0 +(bytes[15].toString(16)) + ' ';

    }
    else
    {
      d = (bytes[15].toString(16)) + ' ';
    }
  for(c=16;c<b;c++)
  {
    if(bytes[c]<16)
    {
      
      d = d + 0 +(bytes[c].toString(16)) + ' ';

    }
    else
    {
      d = d + (bytes[c].toString(16)) + ' ';
    }
  }
  decoded.e_Beacon_Raw_Data = d.toUpperCase();
  return decoded;
}