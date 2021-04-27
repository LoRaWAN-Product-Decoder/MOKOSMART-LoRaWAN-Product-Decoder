//LW001-BG Payload Decoder rule
//Creation time：2021-01-27
//Suitable firmware versions：LW001-BG V1.2.5 & V1.2.4 &V1.2.3
//Programming languages：Javascript
//Suitable platforms：TTN
/* Decoder MOKO LW001-BG GPS tracker with The Things Network
 * by Emanuele Goldoni, Sitip.net, 2020. <emanuele.goldoni@gmail.com>*/

function Decoder(bytes, port) {
    var decoded = {};
    
    if (bytes[0] !== 0x02) { return decoded; }
    
    decoded.sensor = "MOKO LW001-BG";
    decoded.current_pkt = bytes[1];

    if (bytes[1]==1 && bytes.length==10) {

        var f_lat = Bytes2Float(bytes.slice(2,6))
        var deg_lat = Math.floor(f_lat/100);
        decoded.latitude = deg_lat + (f_lat - deg_lat*100)/60;

        var f_lon = Bytes2Float(bytes.slice(6, 10))
        var deg_lon = Math.floor(f_lon/100);
        decoded.longitude = deg_lon + (f_lon - deg_lon*100)/60;
      
    } else if (bytes[1]==2 && bytes.length==11) {

        decoded.battery = (bytes[2] === 0x00) ? "ok" : "warning";
        var f_speed = Bytes2Float(bytes.slice(3, 7))
        decoded.speed = f_speed * 1.852;  // from knots to km/h

        raw_xdir = ((bytes[8] << 8) | bytes[7])
        if(raw_xdir>0X8000)
          raw_xdir = 0x10000-raw_xdir;
        decoded.xdir = raw_xdir / 100

        raw_ydir = ((bytes[10] << 8) | bytes[9])
        if(raw_ydir>0X8000)
          raw_ydir = 0x10000-raw_ydir;
        decoded.ydir = raw_ydir / 100
      
    }
    
    return decoded;
}


/*
   Convert to float a value represented in the 4-byte IEEE 754 standard.
   Byte order is low byte first.
   Implementation based on https://stackoverflow.com/a/37471538 by Ilya Bursov
*/

function Bytes2Float(bytes) {
    var bits = ((bytes[3] << 24) | (bytes[2] << 16) | (bytes[1] << 8) | (bytes[0]));
    var sign = ((bits >>> 31) === 0) ? 1.0 : -1.0;
    var e = ((bits >>> 23) & 0xff);
    var m = (e === 0) ? (bits & 0x7fffff) << 1 : (bits & 0x7fffff) | 0x800000;
    var f = sign * m * Math.pow(2, e - 150);
    return f
}