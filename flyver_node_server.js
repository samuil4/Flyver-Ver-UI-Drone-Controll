/********************************
* File Name : flyver_node_server.js
* Purpose :
*
* Creation Date : 02-05-2015
*
* Last Modified : Sat 02 May 2015 12:41:53 PM EEST
*
* Created By : Peter Petrov
********************************/

// "sensors.motors.json"
// "LocationServices"
// "sensors.raw.json"
// "dronestate.raw"
// "sensors.raw"
// "airquality.mapped"
// "sensors.airquality"
// "battery.status"

var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    port = process.argv[2] || 8080;

var mimeTypes = {
    "htm": "text/html",
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
    "js": "text/javascript",
    "css": "text/css"};

var virtualDirectories = {
    //"images": "../images/"
};

var instances = {};

var net = require('net');
var HOST = '192.168.1.102'; //your device IP
var PORT = 51423;
// // var client = new net.Socket();
// var topics = {
//     'rawsensordata': new net.Socket(),
//     ''
// };

http.createServer(function(request, response) {

  var uri = url.parse(request.url).pathname,
    filename = path.join(process.cwd(), uri),
    root = uri.split("/")[1],
    virtualDirectory;

  virtualDirectory = virtualDirectories[root];
  if(virtualDirectory){
    uri = uri.slice(root.length + 1, uri.length);
    filename = path.join(virtualDirectory ,uri);
  }

  fs.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      console.error('404: ' + filename);
      return;
    }

    if (fs.statSync(filename).isDirectory()) filename += '/index.html';

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        console.error('500: ' + filename);
        return;
      }

      var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
      response.writeHead(200, {"Content-Type": mimeType});
      response.write(file, "binary");
      response.end();
      console.log('200: ' + filename + ' as ' + mimeType);
    });
  });
}).listen(parseInt(port, 10));

var client = new net.Socket();

client.connect(PORT, HOST, function() {

    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
    client.setNoDelay(true);
    client.write('{"key":"mq","value1":"producers","value2":null}\n');

});

client.on('data', function(data) {
    // console.log(data.toString());

    var topics = data.toString().replace(/\[/, "").replace(/\]/, "").split(",");
    console.log(JSON.parse(data.toString()));
    createSocketTopicCommunication(JSON.parse(data.toString()));
});

function createSocketTopicCommunication (topics) {

    // console.log(topics);
    for (var i = 0; i < topics.length; i++) {

        instances[topics[i]] = new net.Socket();
        instances[topics[i]].on('data', function(data) {
            console.log(data);
        });
        // console.log(topics[i] + " " + i);
        (function(currentSocket, topic){
            console.log(topic);
            currentSocket.connect(PORT, HOST, function() {

                var json = {
                    "key" : "mq",
                    "value1" : "consumer",
                    "value2" : topic //sensors.raw
                };

                currentSocket.setNoDelay(true);
                currentSocket.write(JSON.stringify(json) + "\n");
            });


        })(instances[topics[i]], topics[i]);
    }
}


console.log("Static file server running at\n  => http://localhost:" + 8080 + "/\nCTRL + C to shutdown");