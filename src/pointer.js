// adapted from a forum post by cabbibo:
// https://github.com/leapmotion/leapjs/issues/31
// http://cabbibo.com/leap/lmlab/mouse/test.html

/*

Below are all of the starting parameters for the different
Pointer Acceleration Functions. 

Additionally the look and feel of the graph is created here.

*/
var PARAMS = function(){
  
  
  //Function Type that we are starting with 
  this.functionType = 'atan'
  
  
  //power function
  this.power = {
    division:300,
    divisionRange:[1,10000],
    power:1,
    powerRange:[0,3]
    
  }
  
  
  this.atan = {
    division1:660,
    division1Range:[0,10000],
    division2:0.5,
    division2Range:[0,1]
  }
  
  this.asymp1 = {
    max:0.5,
    maxRange:[0,1],
    min:0.001,
    minRange:[0,.1],
    Vo:200,
    VoRange:[1,10000]
  }
  
  this.asymp2 = {
    max:0.001,
    maxRange:[0,.01],
    min:0.001,
    minRange:[0,.01],
    Vo:1500,
    VoRange:[0,3000],
  }
  
  
  
  //Look and Feel Section
  this.mouseSize = 10
  this.frameOpacity = 800
  
  this.gainGraphFrames = 200
  
  
  
  

  //Moves Cursor to the center of the screen
  this.resetPosition = function(){
    curPos.x = window.innerWidth/2
    curPos.y = window.innerHeight/2
  }
}

//Initialize params
var params = new PARAMS();


//setting up the current position to be in the very center of the screen
var curPos = {
  x:window.innerWidth/2,
  y:window.innerHeight/2
}


var point = function (pointer) {
  
  //get the amount to be added by calling the 'convert' function.
  //The convert function will basically use whatever equation that we have selected
  //In order to create Pointer Acceleration
  var addAmount = convert(pointer.tipVelocity[0],pointer.tipVelocity[1], params.functionType)
  
  
  //Add the altered velocity to the current Position
  var newPos = {
    x:(curPos.x + addAmount.x),
    y:(curPos.y + addAmount.y)
  }
  
  
  /*
    Setting up the bounding box
  */
  if(newPos.x >= window.innerWidth){
    newPos.x = window.innerWidth
  }
  
  if(newPos.x <= 0 ){
    newPos.x =  0
  }
    
  if(newPos.y >= window.innerHeight){
    newPos.y = window.innerHeight
  }
  
  if(newPos.y <= 0 ){
    newPos.y =  0
  }
    
  //Assign the current position to the be the new position for use in the next frame
  curPos = newPos;
  return newPos;
} 


//Function to convert the velocity to something useful
function convert(velocityX, velocityY, type){

  //Gets the magnitude outside the individual functions
  //Becasue it will be the same for every function type
  var magnitude = Math.sqrt((velocityX*velocityX)+(velocityY*velocityY))

  //CD or Control Display Gain, is the amount that 
  var cdGain = 1
  
  
  
  
  
  if(type == 'power'){
    
    cdGain = Math.pow(magnitude,params.power.power) / Math.pow(params.power.division,params.power.power) 
    
  }else if (type == 'atan'){
    
    cdGain = Math.atan(magnitude/params.atan.division1) / params.atan.division2
    
  }else if(type == 'asymp1'){
    
    cdGain = ((params.asymp1.max) *(1- Math.exp(-magnitude/params.asymp1.Vo))+params.asymp1.min)
  
  }else if(type == 'asymp2'){
    
    cdGain = (((params.asymp2.max) * magnitude * Math.exp(-magnitude/params.asymp2.Vo))+params.asymp2.min)
    
  }

  //The amount that we are going to be adding to the current position
  //is simply the Control Display Gain Multiplied by the Velocity
  //the velocityY is negated becasue of the change of Axis direction in browser
  toReturn = {
    x:cdGain*velocityX,
    y:-cdGain*velocityY
  }
  
  //console.log(toReturn.x)
  return toReturn 
  
}


module.exports = point;
module.exports.reset = params.resetPosition;