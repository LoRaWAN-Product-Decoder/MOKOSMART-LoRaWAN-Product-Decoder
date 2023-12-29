//LW002-TH Payload Decoder, based on TTN decoder code
//Creation time：2023-07-12
//Creator: Valentin Kim
//Suitable firmware versions：
//Programming languages：Javascript
//Suitable platforms：ChirpStack v4.x
function decodeUplink(input) {
     /* Decodes an uplink message from the input and return an object containing the decoded data.
     Result example, device report:
     {
          "data": {
               "device": {
                    "battery": 1,
                    "battery_voltage": 3.6,
                    "firmware": "v1.0.0",
                    "frequency": "EU868",
                    "bt_open_time": 0
               }
          }
     }
     Result example, payload report:
     {
          "data": {
               "payload": {
                    "ext_sensor": "I2C",
                    "temperature": 25.5,
                    "humidity": 50,
                    "alarms": {
                         "temperature": "normal",
                         "humidity": "normal"
                    }
               }
          }
     }
     */
	function round(value, precision) {
		var multiplier = Math.pow(10, precision || 0);
		return Math.round(value * multiplier) / multiplier;
	}
     var bytes = input.bytes;
     var data = {};
     if (bytes[0] == 1) {
          var frequency = "STE920";
          switch (bytes[7]) {
               case (0): frequency = "EU868"; break;
               case (1): frequency = "US915"; break;
               case (2): frequency = "US915 HYBRID"; break;
               case (3): frequency = "CN779"; break;
               case (4): frequency = "EU433"; break;
               case (5): frequency = "AU915"; break;
               case (6): frequency = "AU915 OLD"; break;
               case (7): frequency = "CN470"; break;
               case (8): frequency = "AS923"; break;
               case (9): frequency = "KR920"; break;
               case (10): frequency = "IN865"; break;
               case (11): frequency = "CN470 PREQEL"; break;
          }
          data.device = {
               battery: (bytes[1] == 0) ? 0 : 1, // 0 - low, 1 - normal
               battery_voltage: round((bytes[3] * 256 + bytes[2]) / 1000, 2), // number, volts
               firmware: `v${bytes[4]}.${bytes[5]}.${bytes[6]}`, // firmware, string
               frequency: frequency, // LoRaWAN band, string
               bt_open_time: (bytes[9] * 256 + bytes[8]), // BTE open time, minutes
          }
     }
     else if (bytes[0] == 16) {
          data.payload = {
               ext_sensor: (bytes[1] == 1) ? 'I2C' : 'unknown',
               temperature: round(((bytes[3] * 256 + bytes[2]) - 4500) / 100, 1), // number, ˚C
               humidity: round(((bytes[6] * 256 + bytes[5]) / 100), 1), // number, % 
               alarms: {
                    temperature: (bytes[4] == 0) ? 'normal' : 'alarm',
                    humidity: (bytes[7] == 0) ? 'normal' : 'alarm',
               }
          }
     }
     return { data: data };
}
