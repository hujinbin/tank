var
canvas = document.createElement("canvas"),
socket = io(),
stage,

targetX = 0,
targetY = 0,
ctx = canvas.getContext("2d"),
left = false,
right = false,
up = false,
down = false,
chat=false,
W = 3000,
H = 1800,
winW = window.innerWidth,
winH = window.innerHeight,
turnSpeed = 2.4, //转弯角度
speed = 1.4,  //移动速度
tankId = new Array(),
tankArray = new Array(),
tankCount,
player,
radian,
playerBase,
playerHud,
oldPlayerX,
oldPlayerY,
oldPlayerRotation,
oldHudRotation,
playerId,
distance,
shellCount,
shellArray = new Array(),
shellSpeed = 5, //子弹飞行速度
// shellX,
// shellY,
// tankX,
// tankY,
shoot=800, //射速
range=600,  //射程
currentTank = 0,
rooms=new Array(),//房间号
alive = false,
cool=true,
createjs;



window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000);
          };
})();

window.cancelRequestAnimFrame = ( function() {
  return window.cancelAnimationFrame          ||
    window.webkitCancelRequestAnimationFrame  ||
    window.mozCancelRequestAnimationFrame     ||
    window.oCancelRequestAnimationFrame       ||
    window.msCancelRequestAnimationFrame      ||
    clearTimeout
})();	


function startEngine(){
  requestAnimFrame(startEngine);
  engine();
}

function stopEngine(){
  cancelRequestAnimFrame(stopEngine);
}

function engine() {
   if(left)
  {
    leftCtrl();
  }
  if(right)
  {
    rightCtrl();
  }
  if(up)
  {
    upCtrl();
  }
  if(down)
  {
    downCtrl();
  }

  targetX += (stage.mouseX - targetX) / 10;
  targetY += (stage.mouseY - targetY) / 10;
  playerHud.rotation = Math.atan2((player.y - targetY),(player.x - targetX)) / (Math.PI / 180);
  for(var i = 0; i < shellCount; i++)
  {
    shellArray[i].update();
  }
}

function destroyShell(shell) {
  stage.removeChild(shell.shellobj);
  shellArray.splice(shellArray.indexOf(shell, 1));
  shellCount = shellArray.length;
}

// 创建地图
function goFullScreen() {
    var
        el = document.documentElement,
    rfs = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen;
    rfs.call(el);
    canvas.width = W;
    canvas.height = H;
    ctx.fillStyle="#333";
    ctx.fillRect(0,0, canvas.width, canvas.height);
}

// 坦克控制
function onKeyboardDown(event) {
  if(event.keyCode == 37) {
        left = true;
    }
    else if(event.keyCode == 38) {
      up = true;
    }
    else if(event.keyCode == 39) {
        right = true;
    }
    else if(event.keyCode == 40) {
      down = true;
    }
    else if(event.keyCode == 13) {
      chat = true;
    }
}

function onKeyboardUp(event) {
  if(event.keyCode == 37) {
        left = false;
    }
    else if(event.keyCode == 38) {
      up = false;
    }
    else if(event.keyCode == 39) {
        right = false;
    }
    else if(event.keyCode == 40) {
      down = false;
    }
    else if(event.keyCode == 13) {
      chat = false;
    }
}

function onMouseDown(event) {

  if(alive && cool)
  {
      cool=false;
      var
          X = player.x - (player.x + (Math.cos(playerHud.rotation * (Math.PI / 180)) * shellSpeed)),
          Y = player.y - (player.y + (Math.sin(playerHud.rotation * (Math.PI / 180)) * shellSpeed));
      socket.emit('fire', {id:playerId, x:player.x, y:player.y, incX:X, incY:Y});
      setTimeout(function () {
          cool=true;
      },shoot);
  }
}

// 创建坦克
function tankBuilder(data) {
  this.tankobj = new createjs.Container();
  this.tankobj.name = data.id;

  var base = new createjs.Shape();
  base.name = "base";
  base.graphics.beginFill(data.color).drawRect(-20, -30, 40, 60);
  this.tankobj.x = data.initX;
  this.tankobj.y = data.initY;

  var hud = new createjs.Shape();
  hud.name = "hud";
  hud.graphics.beginFill("#624900").drawRect(-16, -12, 32, 24);
  hud.graphics.beginFill("#624900").drawRect(-46, -3, 30, 6);
  hud.x = base.x;
  hud.y = base.y;

  //this.tankobj.addChild(hitArea);
  this.tankobj.addChild(base);
  this.tankobj.addChild(hud);
  
  return this;
}

  // tankBuilder.prototype.fire = function() {
  //   console.log('Firing the tank');
  // }

// 子弹击中
function hit(data) {

}


// 消灭坦克
function destroyTank(data) {

  var ind = tankId.indexOf(data.id)
  stage.removeChild(tankArray[ind].tankobj);
  tankArray.splice(ind, 1);
  tankId.splice(ind, 1);
  tankCount = tankArray.length;
  if(data.id == playerId)
    {
      destroyPlayer()
    }
}


// 死亡界面
function destroyPlayer() {
  stopEngine();
  alive = false;
  var text = new createjs.Text("阵亡 :(. \n刷新浏览器可继续游戏.", "40px Arial", "#ff7700");
    text.y = 200;
    text.x = 100; 
    text.textBaseline = "alphabetic";
    stage.addChild(text);
}


function control(data) {
  playerId = data;
  player = tankArray[tankId.indexOf(data)].tankobj;
  playerBase = player.getChildByName('base');
  playerHud = player.getChildByName('hud');
  startEngine();

  createjs.Ticker.addEventListener("tick", render);
  alive = true;
}

function render(e) {
   stage.update();
   if(alive)
   {
    if(oldPlayerX != player.x || oldPlayerY != player.y || oldPlayerRotation != playerBase.rotation || oldHudRotation != playerHud.rotation)
    {
      socket.emit('move', {id:playerId, x:player.x, y:player.y, rotBase:playerBase.rotation, rotHud:playerHud.rotation});
    }
    oldPlayerX = player.x;
    oldPlayerY = player.y;
    oldPlayerRotation = playerBase.rotation;
    oldHudRotation = playerHud.rotation;
   }
    
}

function leftCtrl()
{
    playerBase.rotation = playerBase.rotation - turnSpeed;
}
function rightCtrl()
{
    playerBase.rotation = playerBase.rotation + turnSpeed;
}

function upCtrl()
{
    if(player.x>=0 & player.x<=W && player.y>=0 && player.y<H){
        radian = playerBase.rotation * Math.PI / 180;
        player.x = player.x - Math.sin(-radian) * speed;
        player.y = player.y - Math.cos(-radian) * speed;
    }else if (player.x<0){
        player.x=0;
    }else if (player.x>W){
        player.x=W;
    }else if (player.y<0){
        player.y=0;
    }else if (player.y>H){
        player.y=0;
    }
}
function downCtrl()
{
    if(player.x>=0 & player.x<=W && player.y>=0 && player.y<H){
        radian = playerBase.rotation * Math.PI / 180;
        player.x = player.x + Math.sin(-radian) * speed;
        player.y = player.y + Math.cos(-radian) * speed;
    }else if (player.x<0){
        player.x=0;
    }else if (player.x>W){
        player.x=W;
    }else if (player.y<0){
        player.y=0;
    }else if (player.y>H){
        player.y=H;
    }
}

function move(tank) {
  var enemy = tankArray[tankId.indexOf(tank.id)].tankobj;
  enemy.x = tank.x;
  enemy.y = tank.y;
  enemy.getChildByName('base').rotation = tank.rotBase;
  enemy.getChildByName('hud').rotation = tank.rotHud;
}

function createTank(data) {
  var tank = new tankBuilder(data);
  tankId.push(data.id);
  tankArray.push(tank);
  stage.addChild(tank.tankobj);
  tankCount = tankArray.length;
}

// 射击
function fire(data) {
  //tankArray[tankId.indexOf(data.id)].fire();
  var shell = new shellBuilder(data);
  shellArray.push(shell);
  shellCount = shellArray.length;
  stage.addChild(shell.shellobj);
}

// 构建子弹
function shellBuilder(data) {
  this.shellobj = new createjs.Shape();
  this.shellobj.graphics.beginFill('#fff').drawCircle(0,0,3);
  this.shellobj.graphics.shadowBlur=3;
  this.shellobj.graphics.shadowColor="#ffd230";
  this.shellobj.name = data.id;
  this.incX = data.incX;
  this.incY = data.incY;
  this.shellobj.x = data.x + (data.incX * 8);
  this.shellobj.y = data.y + (data.incY * 8);
  this.destroyShell = function() {
      stage.removeChild(this.shellobj);
      shellArray.splice(shellArray.indexOf(this), 1);
      shellCount = shellArray.length;
    }
  return this;
}


shellBuilder.prototype.update = function() {
  this.shellobj.x += this.incX;
  this.shellobj.y += this.incY;

  if(this.shellobj.y < 0 || this.shellobj.y > H || this.shellobj.x < 0 || this.shellobj.x > W)
  {
    this.destroyShell();
  }
  distance = Math.sqrt(Math.pow(this.shellobj.x - tankArray[currentTank].tankobj.x, 2) + Math.pow(this.shellobj.y - tankArray[currentTank].tankobj.y, 2));

  if(distance < 40)
  {
    this.destroyShell();
    destroyTank({id:tankArray[currentTank].tankobj.name}) //死亡
    //socket.emit('hit', tankArray[currentTank].tankobj.name);
  }else if(distance>range) {
      this.destroyShell();
  }
  currentTank++;
  if(currentTank >= tankCount)
  {
    currentTank = 0;
  }
}



function createCanvas() {
  canvas.width = W;
  canvas.height = H;
  canvas.id = "stage";
  document.body.appendChild(canvas);

  stage = new createjs.Stage("stage");
  var bg = new createjs.Shape();
  // bg.graphics.beginFill('#297F87').drawRect(0,0,W,H);
  // bg.graphics.beginLinearGradientFill(["#ff0000", "#0000ff"], [0, 1],0, 0, 0, 100).drawRect(0,0,W,H);

  stage.addChild(bg);
  //document.addEventListener("mouseup", goFullScreen);
  document.addEventListener('keydown', onKeyboardDown);
  document.addEventListener('keyup', onKeyboardUp);
  document.addEventListener('mousedown', onMouseDown);

  createjs.Ticker.setFPS(15);

  socket.on('create', createTank);
  socket.on('destroy', destroyTank);
  socket.on('control', control);
  socket.on('move', move);
  socket.on('fire', fire);
  socket.on('hit', hit);
}

createCanvas();