var slib = require("./switch");
var th = require("./telehash");

th.init();

th.seed(function(err) {
   if (err) {
      return console.error("seeding error: " + err);
   }
});
