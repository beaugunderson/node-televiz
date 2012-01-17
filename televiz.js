var express = require('express');
var io = require('socket.io');

/* WWW */
var app = express.createServer();

app.configure(function() {
   app.set('views', __dirname + '/views');
   app.set('view engine', 'jade');

   app.use(express.bodyParser());
   app.use(express.methodOverride());

   app.use(require('stylus').middleware({
      src: __dirname + '/public'
   }));

   app.use(app.router);

   return app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
   return app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
   }));
});

app.get('/', function(req, res) {
   res.render('index', {
      title: 'Televiz: Telehash debugger/vizualiser'
   });
});

/* Websockets */
io = io.listen(app);

io.sockets.on('connection', function(socket) {
   initTelehash();
});

app.listen(8081);

console.log('Express server listening on port %d', app.address().port);

/* Telehash */
function initTelehash() {
   // XXX
   var slib = require("./node-telehash/switch");
   var th = require("./node-telehash/telehash");

   th.init({
      port: 42424,
      incomingCB: function(from, telex) {
         io.sockets.emit('incoming', {
            from: from,
            telex: telex
         });
      },
      outgoingCB: function(to, telex) {
         io.sockets.emit('outgoing', {
            to: to,
            telex: telex
         });
      }
   });

   th.seed(function(err) {
      if (err) {
         return console.error("seeding error: " + err);
      }
   });
}
