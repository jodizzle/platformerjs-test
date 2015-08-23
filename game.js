//Canvas setup//
var canvas = document.getElementById('game');
var context = canvas.getContext('2d');
var raf;

//Canvas dimensions//
canvas.width = 800;
canvas.height = 500;

//Movement booleans//
var leftPressed = false;
var rightPressed = false;
var upPressed = false;

//Jumping booleans//
var jumping = false;

//Global values//
var gravity = 0.2;
var spawnGravity = 2;
var playerScrollSpeed = -1;
var platformScrollSpeed = -1;
var spawnScrollSpeed = -1;

//Timers//
var gameScalingTimerShort = 0; //makes game harder with time
var gameScalingTargetShort = 900; //15 seconds
var gameScalingTimerLong = 0;
var gameScalingTargetLong = 1800; //30 seconds
var spawnCounter = 0;
var spawnCounterTarget = 120;
var platformCounter = 0;
var platformCounterTarget = 90;

//Player movement values//
var upSpeed = -8;
var leftSpeed = -5;
var rightSpeed = 5;

//Scoring//
var points = 0;

//Loss condition//
var loseKill = false; //Lose by touching ("killing") a falling object
var loseWall = false; //Lose by touching the leftside of the canvas

//Spawn definitions//
//ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight); //reference
function Spawn(x,y,vx,vy,width,height,color) {
	this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.width = width; this.height = height; this.color = color;
	this.onGround = false;
	this.touched = false;
}

Spawn.prototype.draw = function(){
	var guyImage = new Image();
	guyImage.src = 'assets/test_guy_1.png';
	context.drawImage(guyImage, 0, 0, 25, 25, this.x, this.y, this.width, this.height);
	// context.fillStyle = this.color;
	// context.fillRect(this.x,this.y,this.width,this.height);
}
Spawn.prototype.update = function(){
	//Horizontal movement//
	if(this.onGround) {
		this.x += spawnScrollSpeed
	}

	//Horizontal platform collision detection//
	for(var i=0; i<platforms.length; i++) {
		platform = platforms[i];
		if(this.y < platform.y+platform.height && this.y+this.height > platform.y && this.x+this.width > platform.x && this.x < platform.x+platform.width) {
			if(this.vx > 0) { //Leftside case
				this.x = platform.x-this.width;
			 	this.vx = 0;
			}
			else if (this.vx < 0) { //Rightside case
				this.x = platform.x+platform.width;
		 	 	this.vx = 0;
			}
		}
	}

	//Vertical movement//
	this.y += spawnGravity;
	//Vertical platform collision detection//
	for(var i=0; i<platforms.length; i++) {
		platform = platforms[i];
		//Since spawns only fall from the top, should only have to worry about one vertical case.
		if(this.y < platform.y+platform.height && this.y+this.height > platform.y && this.x+this.width > platform.x && this.x < platform.x+platform.width) {
			this.y = platform.y-this.height;
			this.vy = 0;
			this.onGround = true; //Might be a worthless (since platforms are already moving), but here just in case.
		}
	}

	//Bottomside canvas collision detection//
	if(this.y+this.height > canvas.height) {
		this.y = canvas.height-this.height;
		this.vy = 0;
		this.onGround = true;
	}
}

//Platform definitions//
function Platform(x,y,width,height,color) {
	this.x = x; this.y = y; this.width = width; this.height = height; this.color = color;
	this.removeNow = false;
}
Platform.prototype.draw = function(){
	context.fillStyle = this.color;
 	context.fillRect(this.x,this.y,this.width,this.height);
}
Platform.prototype.update = function(){
	this.x += playerScrollSpeed;
}

var monsterImage = new Image();
function makeMonsterImage()
{
  monsterImage.onload = function(){
    context.drawImage(monsterImage, 0,0);
  }
  monsterImage.src = 'assets/test_monster_2.png';
}
//player definition//
//ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight); //reference
var player = {
	x: canvas.width/2,
	y: canvas.height,
	vx: 0,
	vy: 0,
	width: 28,
	height: 30,
	color: 'red',
	onGround: false,

	draw: function() {
		var monsterImage = new Image();
		monsterImage.src = 'assets/test_monster_2.png';
		context.drawImage(monsterImage, 3, 2, 26, 28, this.x, this.y, this.width, this.height);
		// context.fillStyle = this.color;
		// context.fillRect(this.x,this.y,this.width,this.height);
	},
	update: function() {
		//Default horizontal scrolling//
		player.x += playerScrollSpeed;

		//Horizontal movement//
		if(leftPressed) {
			player.vx = leftSpeed;
		}
		else if(rightPressed) {
			player.vx = rightSpeed;
		}
		else {
			player.vx = 0;
		}
		player.x += player.vx;

		//Horizontal platform collision detection//
		for(var i=0; i<platforms.length; i++) {
			platform = platforms[i];
			if(player.y < platform.y+platform.height && player.y+player.height > platform.y && player.x+player.width > platform.x && player.x < platform.x+platform.width) {
				if(player.vx > 0) { //Leftside case
					player.x = platform.x-player.width;
				 	player.vx = 0;
				}
				else if (player.vx < 0) { //Rightside case
					player.x = platform.x+platform.width;
			 	 	player.vx = 0;
				}
			}
		}

		//Vertical movement//
		if(upPressed && player.onGround && !jumping) {
			player.vy = upSpeed;
			player.onGround = false;
			jumping = true;
		}
		else {
			player.vy += gravity; //Gravity is always applied except on the frame of jumping
		}
		player.y += player.vy;

		//Vertical platform collision detection//
		for(var i=0; i<platforms.length; i++) {
			platform = platforms[i];
			if(player.y < platform.y+platform.height && player.y+player.height > platform.y && player.x+player.width > platform.x && player.x < platform.x+platform.width) {
				if(player.vy > 0) { //Topside case
					player.y = platform.y-player.height;
				 	player.vy = 0;
				 	player.onGround = true;
				 	jumping = false;
				}
				else if (player.vy < 0) { //Bottomside case
					player.y = platform.y+platform.height;
			 	 	player.vy = 0;
				}
			}
		}

		//Spawn collision detection//
		for(var i=0; i<spawns.length; i++) {
			spawn = spawns[i];
			if(player.y < spawn.y+spawn.height && player.y+player.height > spawn.y && player.x+player.width > spawn.x && player.x < spawn.x+spawn.width) {
				spawn.touched = true;
				if(spawn.onGround) {
					points += 1;
				}
				else {
					loseKill = true;
				}
			}
		}

		//Rightside canvas collision detection//
		if(player.x+player.width > canvas.width) {
			player.x = canvas.width-player.width;
			player.vx = 0;
		}
		//Leftside canvas collision detection//
		else if(player.x < 0) {
			player.x = 0;
			player.vx = 0;
			loseWall = true;
		}

		//Bottomside canvas collision detection//
		if(player.y+player.height > canvas.height) {
			player.y = canvas.height-player.height;
			player.vy = 0;
			player.onGround = true;
			jumping = false;
		}
		//Topside canvas collision detection//
		else if(player.y < 0) {
			player.y = 0;
			player.vy = 0;
		}
	}
};

//platforms array//
//var platforms = [new Platform(250,400,80,10,'green'),new Platform(200,200,80,10,'blue'),new Platform(150,300,80,10,'orange')];
var platforms = [];
//spawns array//
var spawns = [];

//Displays the score//
function displayScore() {
	context.fillStyle = "orange";
	context.font = "48px serif";
	context.textAlign = "center";
	context.fillText("final score: " + points, canvas.width/2, canvas.height/2);
}
//Checks to see if an object is off screen//
function canDespawn(object){
	if(object instanceof Spawn) {
		if(object.touched) {
			return true;
		}
	}
	if(object instanceof Platform) {
		if(object.removeNow) {
			return true;
		}
	}
	else if(object.x+object.width < 0) { //Similar to a leftside canvas collision
		return true;
	}
	else {
		return false;
	}
}
//Spawns objects to the screen//
function spawnObjects() {
	//Spawn spawns (lol)//
	if(spawnCounter >= spawnCounterTarget) {
		randX = getRandomNumber(0,canvas.width);
		//randY = getRandomNumber(0,canvas.height/4); //Only spawn on top fourth of canvas screen
		spawns.push(new Spawn(randX,0,0,0,23,23,'yellow'));
		spawnCounter = 0;
	}
	else {
		spawnCounter += 1;
	}

	//Spawn platforms//
	if(platformCounter == platformCounterTarget) {
		randWidth = getRandomNumber(20,90);
		spawnHeight = 10;
		randX = getRandomNumber(canvas.width,canvas.width+(randWidth*2));
		randY = getRandomNumber(canvas.height/3,canvas.height-(spawnHeight*3));
		platforms.push(new Platform(randX,randY,randWidth,spawnHeight,'#C2203D'));
		platformCounter = 0;
	}
	else {
		platformCounter += 1;
	}
}
//Despawns (removes) objects that are offscreen//
function removeObjects(objectArray) {
	var toRemove = [];
	for(var i=0; i<objectArray.length; i++) {
		if(canDespawn(objectArray[i])) {
			toRemove.push(i); //push the index to remove
		}
	}
	for(var i=0; i<toRemove.length; i++) {
		objectArray.splice(toRemove[i],1);
	}
}
//Random number
function getRandomNumber(min, max) {
  return (Math.random()*Math.random())*(max-min)+min;
}
// var monsterImage = new Image();
// function makeMonsterImage()
// {
//   monsterImage.onload = function(){
//     context.drawImage(monsterImage, 0,0);
//   }
//   monsterImage.src = 'assets/test_monster_2.png';
// }

//Main loop functions//
function draw() {
	context.clearRect(0,0,canvas.width,canvas.height); //Clears the screen every frame

	player.draw();
	//monsterImage.onload();
	//Display text//
	context.fillStyle = "orange";
	context.font = "48px serif";
	context.textAlign = "start";
	if(loseKill) {
		context.fillText("u r the monster", 10, 50);
		displayScore();
	}
	else if(loseWall) {
		context.fillText("the army got u", 10, 50);
		displayScore();
	}
	else {
		context.fillText(points, 10, 50);
		//Draws objects//
		for(var i=0; i<spawns.length; i++) {
			spawns[i].draw();
		}
		for(var i=0; i<platforms.length; i++) {
			platforms[i].draw();
		}
	}
}
function update() {
	//Updates objects//
	if(gameScalingTimerShort == gameScalingTargetShort) {
		if(spawnCounterTarget > 10) {
			spawnCounterTarget -= 10; //faster spawns
		}
		spawnGravity += 0.5; //faster falling spawns
		gameScalingTimerShort = 0;
	}
	else {
		gameScalingTimerShort += 1;
	}
	if(gameScalingTimerLong == gameScalingTargetLong) {
		platformScrollSpeed -= 0.5;
		spawnScrollSpeed -= 0.5;
		gameScalingTargetLong = 0;
	}
	else {
		gameScalingTargetLong += 1;
	}

	player.update();
	if(!loseKill && !loseWall) {
		removeObjects(spawns);
		for(var i=0; i<spawns.length; i++) {
			spawns[i].update();
		}
		removeObjects(platforms);
		for(var i=0; i<platforms.length; i++) {
			platforms[i].update();
		}
	}
	else {
		//Empty arrays
		platforms.splice(0,platforms.length);
		spawns.splice(0,spawns.length);
		//Remove scrolling
		playerScrollSpeed = 0;
		platformScrollSpeed = 0;
		spawnScrollSpeed = 0;
		//Teleport player
		// player.x = canvas.width/2;
		// player.y = canvas.height/2;
	}
}
function mainLoop() {
	spawnObjects();
	update();
	draw();
	raf = window.requestAnimationFrame(mainLoop);
}

//Keyboard listeners//
window.addEventListener('keydown',function(e) {
	switch (e.which) {
		case 37:
			leftPressed = true;
			break;
		case 38:
			upPressed = true;
			jumping = true;
			break;
		case 39:
			rightPressed = true;
			break;
	}
});
window.addEventListener('keyup',function(e){
	switch (e.which) {
		case 37:
			leftPressed = false;
			break;
		case 38:
			upPressed = false;
			break;
		case 39:
			rightPressed = false;
			break;
	}
});

function init() {
	mainLoop()
}
//makeMonsterImage();
init();