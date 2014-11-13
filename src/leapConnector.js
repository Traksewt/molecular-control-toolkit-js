var Leap = require('leapjs');
var Pointer = require('./pointer')

/** constant for scaling pointing in the x axis */
var X_SCALE = 150;

/** constant for scaling pointing in the y axis */
var Y_SCALE = -400;

/** constant for offsetting pointing in the y axis */
var Y_OFFSET = 400;

var ROTATION_SCALE = 100;

var MAX_ROTATION = 30;

var MIN_ROTATION = 0.00001;

var LeapConnector = function(gestureDispatcher) {
  this.gestureDispatcher = gestureDispatcher;


  /** Store the lastX for custom pointing algorithm */
  this.lastX = -1;

  /** Store the lastY for custom pointing algorithm */
  this.lastY = -1;

};

LeapConnector.prototype.start = function() {
  var that = this;
  this.controller = Leap.loop({
//    frameEventName: 'deviceFrame',
    enableGestures : false
  }, function(frame) {
    return that.onFrame(frame);
  });
  return that;
}

LeapConnector.prototype.limitRotation = function(r) {
  r *= ROTATION_SCALE;
  r = Math.max(-MAX_ROTATION, r);
  r = Math.min(MAX_ROTATION, r);
  if (Math.abs(r) < MIN_ROTATION) {
    r = 0;
  }
  return r;
}

// workaround for LeapJS bug
// see http://jsfiddle.net/kLs8ymye/2/
// https://github.com/leapmotion/leapjs/issues/188
LeapConnector.prototype.axisAngle = function(rotation) {
    //NOTE: Index = 3*row + col when basis vector 
  var axis = [
    rotation[5] - rotation[7],
    rotation[6] - rotation[2],
    rotation[1] - rotation[3]
  ];
  var sin = Leap.vec3.len(axis);
  var cos = ((rotation[0] + rotation[4] + rotation[8]) - 1.0)*0.5;
  var angle = Math.atan2(sin,cos);

    if (-1e-6 < sin && sin < 1e-6) {
        axis = [0, 0, 0];
        angle = 0;
        return [axis, angle];
    }
    
    Leap.vec3.scale(axis, axis, 1 / sin);
  return [axis,angle];
}

LeapConnector.prototype.getBasis = function (frame) {

  var handLast = frame.hands[0];
  var dir = handLast.direction;
  var nor = handLast.palmNormal;
  var dxn = Leap.vec3.create();
  Leap.vec3.cross(dxn, dir, nor);
  var basisLast = [].concat(dir).concat(nor);
  basisLast[6] = dxn[0];
  basisLast[7] = dxn[1];
  basisLast[8] = dxn[2];
  
  return basisLast;
}

LeapConnector.prototype.onFrame = function(frame) {
  var that = this;
  if (frame.hands.length == 1) {
    if (frame.fingers.length > 3) {
      var lastFrame = this.controller.frame(1);
      if (lastFrame && lastFrame.hands.length > 0) {
        
        // rotate
        that.lastY = -1;
        that.lastX = -1;
  
        var hand = frame.hands[0];
        var translation = hand.translation(lastFrame);
        // comment out for the moment until JS Leap Motion rotation bugs are fixed.
        that.gestureDispatcher.triggerPan(translation[0], -translation[1]);
        that.gestureDispatcher.triggerZoom(-translation[2]);
        
        var basis = that.getBasis(frame); 
        var basisLast = that.getBasis(lastFrame); 
        
        Leap.mat3.transpose(basisLast, basisLast);
        var rotation = Leap.mat3.create();
        Leap.mat3.multiply(rotation, basis, basisLast) 

        //Get axis-angle representation
        var axisAngle = that.axisAngle(rotation);
                      
        Leap.vec3.scale(axisAngle[0], axisAngle[0], axisAngle[1]);
        
        
        
        // yaw pitch roll are slightly better, but there still seems to be an issue.
//        var xRotation = this.limitRotation(hand.pitch() - lastFrame.hands[0].pitch());
//        var yRotation = this.limitRotation(hand.yaw() - lastFrame.hands[0].yaw());
//        var zRotation = this.limitRotation(hand.roll() - lastFrame.hands[0].roll());
        
        // these rotations have an issue where changes aren't updated properly.
        // see https://github.com/leapmotion/leapjs/issues/188
//        var xRotation = this.limitRotation(hand.rotationAngle(lastFrame, [ 1, 0, 0 ]));
//        var yRotation = this.limitRotation(hand.rotationAngle(lastFrame, [ 0, 1, 0 ]));
//        var zRotation = this.limitRotation(hand.rotationAngle(lastFrame, [ 0, 0, 1 ]));
        // console.log('lastframe1: ' + that.lastFrame);
        if (Math.abs(axisAngle[0][0]) > MIN_ROTATION || 
            Math.abs(axisAngle[0][1]) > MIN_ROTATION || 
            Math.abs(axisAngle[0][2]) > MIN_ROTATION) {
          that.gestureDispatcher.triggerRotate(this.limitRotation(axisAngle[0][0]),
              this.limitRotation(axisAngle[0][1]), this.limitRotation(axisAngle[0][2]));
        }
      }
    } else if (frame.fingers.length > 0) {

      try {
        var finger = frame.fingers[0];
        var hit = Pointer(finger);
        // Vector hit =
        // controller.locatedScreens().closestScreenHit(finger).intersect(finger,true);
        var zVel = finger.tipVelocity.getZ[2];
        var absZVel = Math.abs(zVel);
        var y = hit.getY();
        var x = hit.getX();

        if (absZVel > 50 && that.lastY != -1) {
          var scale = 2500 / (absZVel * absZVel);
          x = (hit.x - that.lastX) * scale + that.lastX;
          y = (hit.y - that.lastY) * scale + that.lastY;
        }
        that.lastY = y;
        that.lastX = x;
        if (!isNaN(x) && !isNaN(y)) {
          // that.gestureDispatcher.point(x, y);
        }
      } catch (e) {
        console.log('error occurred when pointing: ' + e);
      }
    } else {
      that.lastY = -1;
      that.lastX = -1;

    }
    var i;
    if (frame.gestures) {

      frame.gestures.forEach(function(gesture) {
        switch (gesture.type) {
        case 'swipe':
          that.gestureDispatcher.reset();
          break;
        case 'screenTap':

          that.gestureDispatcher.selectMouseCursor();
          // add a delay so the app can process the mouse clicks.
          setTimeout(that.gestureDispatcher.zoomToSelection, 100);
          break;
        case 'keyTap':
          that.gestureDispatcher.zoomToSelection();
          break;
        default:
          console.log("Unknown gesture type: " + gesture.type);
          break;
        }
      });
    }
  }
  // console.log('lastframe2: ' + that.lastFrame);
}

module.exports = LeapConnector;
