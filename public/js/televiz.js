function update_clicks() {
   prettyPrint();

   $('span.title').unbind('click');

   $('span.title').click(function() {
      $(this).nextAll('pre').toggle();
   });
}

var socket;

var nodes = [];
var links = [];

var w = 200;
var h = 200;

var vis;
var force;

var fill = d3.scale.category20();

function restart_force() {
   force.start();

   vis.selectAll("line.link")
      .data(links)
         .enter()
            .insert("line", "circle.node")
               .attr("class", "link")
               .attr("x1", function(d) {
                  return d.source.x;
               }).attr("y1", function(d) {
                  return d.source.y;
               }).attr("x2", function(d) {
                  return d.target.x;
               }).attr("y2", function(d) {
                  return d.target.y;
               });

    vis.selectAll("circle.node")
      .data(nodes)
         .enter()
            .insert("circle", "circle.cursor")
               .attr("class", "node").attr("cx", function(d) {
                    return d.x;
                }).attr("cy", function(d) {
                    return d.y;
                }).attr("r", 4.5).call(force.drag);
}

function add_link(from, to) {
   if (from == to) {
      return;
   }

   var f = add_node(from);
   var t = add_node(to);

   var link = {
      source: f,
      target: t
   };

   if (jQuery.inArray(link, links) === -1) {
      links.push(link);
   }

   restart_force();
}

function add_node(address) {
   var node = {
      'address': address
   };

   var node_exists = _.find(nodes, function(node) {
      return node.address == address;
   });

   if (node_exists === undefined) {
      nodes.push(node);
   } else {
      return node_exists;
   }

   restart_force();

   return node;
}

function process_message(direction, data) {
   var snippet = JSON.stringify(data.telex).replace(/\n/g, '');

   if (snippet.length > 64) {
      snippet = snippet.substring(0, 64) + " &hellip;";
   }

   var s = JSON.stringify(data.telex, null, 4);

   var bullet = "&#9664;";
   var address = data.from;

   if (direction == 'out') {
      bullet = "&#9654;";
      address = data.to;
   }

   add_node(address);

   if (data.telex['.see'] !== undefined) {
      $.each(data.telex['.see'], function(i, v) {
         add_link(address, v);
      });
   }

   $('#messages').prepend(sprintf(
      '<div>%s <span class="title"><span class="timestamp">%s</span> %s</span> <span class="snippet">%s</span> <pre class="telex prettyprint"><code class="language-javascript">%s</code></pre></div>',
      bullet,
      moment().format('h:mm:ssa'),
      address,
      snippet,
      s));

   update_clicks();
}

$(function() {
   vis = d3.select("#graph")
      .append("svg")
      .attr("width", w)
      .attr("height", h);

   force = d3.layout.force()
      .nodes(nodes)
      .links(links)
      .size([w, h])
      .start();

   force.on("tick", function() {
      vis.selectAll("line.link")
         .attr("x1", function(d) {
            return d.source.x;
         }).attr("y1", function(d) {
            return d.source.y;
         }).attr("x2", function(d) {
            return d.target.x;
         }).attr("y2", function(d) {
            return d.target.y;
         });

      vis.selectAll("circle.node")
         .attr("cx", function(d) {
            return d.x;
         }).attr("cy", function(d) {
            return d.y;
         });
   });

   socket = io.connect();

   socket.on('connect', function(data) {
      $("#connection").html('Connected');
   });

   socket.on('disconnect', function(data) {
      $("#connection").html('Not connected');
   });

   socket.on('incoming', function(data) {
      process_message('in', data);
   });

   socket.on('outgoing', function(data) {
      process_message('out', data);
   });
});
