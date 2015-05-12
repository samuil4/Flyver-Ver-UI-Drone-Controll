var net = require('net');

var HOST = '192.168.1.102'; //your device IP
var PORT = 51423;

var client = new net.Socket();
client.connect(PORT, HOST, function() {

    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
    client.setNoDelay(true);
    client.write('{"key":"mq","value1":"consumer","value2":"sensors.raw"}\n');

});

client.on('data', function(data) {
    console.log(data.toString());
});