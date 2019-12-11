var 
express = require('express'),
app = express(),
http = require('http').Server(app),
io = require('socket.io')(http),
uid = 0;
count = 0;
pool = new Array();

app.use(express.static(__dirname + '/'));

app.get('/', function(req, res){
  res.sendfile('index.html',{root:__dirname});
});  


io.on('connection', function(socket){

  ++uid;


  var tank = {
    id:uid,
    initX:Math.random() * 500,
    initY:Math.random() * 500,
    nickname:'tank'+uid,
    color:'#'+Math.floor(Math.random()*16777215).toString(16)
  }
  socket.tank = tank;
 
  for(var i = 0; i < count; i++)
  {
    pool[i].emit('create', socket.tank);
  }
  pool.push(socket);

  count = pool.length;
  for(var i = 0; i < count; i++)
  {
    socket.emit('create', pool[i].tank);
  }

  socket.emit('control', socket.tank.id);

  console.log("Total players " + count);
 

  socket.on('disconnect', function(){
    var des = socket.tank.id;
    pool.splice(pool.indexOf(socket), 1);
    count = pool.length;
    for(var j = 0; j < count; j++)
    {
      pool[j].emit('destroy', socket.tank);
    }

    console.log("Total players " + count);
  });
  
  socket.on('move', function(tank){
    for(var j = 0; j < count; j++)
    {
      if(pool[j].tank.id != tank.id)
      {
        pool[j].emit('move', tank);
      }
    }
  });

  socket.on('fire', function(tank){
    for(var j = 0; j < count; j++)
    {
      pool[j].emit('fire', tank);
    }
  });


});

http.listen(3030, function(){
  console.log('listening on *:3030');
});