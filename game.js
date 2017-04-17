
$(document).ready( function() {
"use strict";

// Listen to incoming messages, if the messageType
// is LOAD then the game state will be loaded.
// Note that no checking is done, whether the
// gameState in the incoming message contains
// correct information.
//
// Also handles any errors that the service
// wants to send.

window.addEventListener( "message", function( evt ) {

  if ( evt.data.messageType === "LOAD" ) {

    var gameState = evt.data.gameState;

    countSaved = parseInt( gameState.count );
    scoreSaved = parseInt( gameState.score );
    aveDistSaved = parseFloat( gameState.aveDist );
    aveTimeSaved = parseInt( gameState.aveTime );

    count = countSaved;
    score = scoreSaved;
    aveDist = aveDistSaved;
    aveTime = aveTimeSaved;

    displayScore( score );

  } else if ( evt.data.messageType === "ERROR" ) {

    $("#errorMessage").html( evt.data.info );
    $("#errorDiv").css( "display", "block" ); // Show the hidden error div

  }
});



var message =  {
  messageType: "SETTING",
  options: {
    width: 300,
    height: 400
  }
};

window.parent.postMessage( message, "*" ); // Request the game store to set the game's resolution



var score = 0; // The score

var clickTime = 0; // The time it takes for the player to click the div/pic (ms)
var count = 0; // Counting the times the div/pic to click has been shown
var maxClicks = 30; // The times the pic is shown. After this the game ends.

var aveDist = 0; // The average distance of the click to the center of the pic (pixels)
var aveTime = 0; // The average time it took for the player to click the pic (ms)

var timer = 0; // Timer used to start the move of the dartboard pic
var timerMove = 0; // Timer used for moving the dartboard pic

// Saved and loaded values
var countSaved = 0;
var scoreSaved = 0;
var aveDistSaved = 0;
var aveTimeSaved = 0;

var gameIsOn = false; // True if the game is being played


// Initialize the game

function initGame() {

  $("#clickMeDiv").css( "display", "none" ); // Hide the dartboard pic that should be clicked in the game

  if ( gameIsOn || countSaved >= maxClicks ) { // The game is on or it was finished last time so start a new game

    count = 0;
    score = 0;
    aveDist = 0;
    aveTime = 0;

  } else { // The game was not finished last time so continue the game with the saved parameter values

    count = countSaved;
    score = scoreSaved;
    aveDist = aveDistSaved;
    aveTime = aveTimeSaved;
  }

}


$("#clickMeDiv").mousedown( function ( evt ) { picClicked( evt, false ); }); // The dartboard pic has been "clicked" (left mouse button pressed)

$("#clickMeDiv").on( "touchstart", function ( evt ) { picClicked( evt, true ); }); // The dartboard pic has been "clicked" on a touch screen



// The pic has been clicked by the player (mouse down, touch start)

function picClicked( evt, touch ) {

  var time = Date.now() - clickTime; // The time in ms it took for the player to click the pic

  clearTimeout( timerMove ); // Stop moving the div/pic

  var mouseXnew;
  var mouseYnew;

  if ( touch ) { // Touch screen was used

  	mouseXnew = event.changedTouches[0].pageX;
    mouseYnew = event.changedTouches[0].pageY;

  } else { // Mouse was used

    mouseXnew = mouseX( evt );
    mouseYnew = mouseY( evt );
  }

  count++;

  var clickMeDiv = document.getElementById("clickMeDiv");

  var pos = findPos( clickMeDiv ); // The position of the pic

  var x = mouseXnew - pos[0] - 20; // The horizontal distance in pix of the click to the center of the pic
  var y = mouseYnew - pos[1] - 20; // The vertical distance in pix of the click to the center of the pic

  var dist = Math.sqrt( x * x + y * y ); // The distance between the click and the center of the pic

  aveDist += dist;
  aveTime += time;

  $("#clickMeDiv").css( "display", "none" ); // Hide the pic

  var addScore = parseInt( 10000 - ( time / 2000 ) * 5000 - ( dist / 20 ) * 7000 );

  if ( addScore > 0 ) { // Only add positive scores

    score += addScore;
  }

  displayScore( score );

  isGameOver();
}


// Check if it was the last click. If it was the game is over.

function isGameOver() {

  if ( count == maxClicks ) { // The game is over

    gameIsOn = false;

    countSaved = maxClicks; // Makes initGame to zero the game

    var aveDistStr = aveDist / maxClicks;
    var aveTimeStr = aveTime / maxClicks;

    aveDistStr = aveDistStr.toFixed(3);
    aveTimeStr = parseInt( Math.round( aveTimeStr ) ) + "";

    //var code = "<br><table><tr><td>Score:</td><td>" + score + "</td></tr><tr><td>Time (ms):</td><td>" + aveTimeStr + "</td></tr><tr><td>Distance (pix):</td><td>" + aveDistStr + "</td></tr></table>";
    //$("#gameOverContent").html( code ); // Update content of gameOverContent

    $("#gameOverScore").html( score );
    $("#gameOverTime").html( aveTimeStr );
    $("#gameOverDistance").html( aveDistStr );

    $("#gameOverDiv").css( "display", "block" ); // Show the hidden gameOver container


    var msg = {
      messageType: "SCORE",
      score: score
    };

    window.parent.postMessage( msg, "*" ); // Send the score to the game store

    //saveGame();

  } else { // The game continues

    var showTime = 1000 + parseInt( Math.random() * 1000 ); // Time it takes to show the pic

    timer = setTimeout( function(){ showClickMeDiv(); }, showTime ); // showClickMeDiv() is called (show the pic to click) after some delay
  }
}


// Display and update the score and click count on the screen

function displayScore( score ) {

  var showScore;

  if ( count == 0 ) {

    showScore = "";
  } else {

    showScore = count + "/" + maxClicks + "&nbsp;&nbsp;&nbsp;" + score;
  }

  $("#score").html( showScore ); // Set the score to the score span element (show score on screen)
}

  
function clearTimers() {

  if ( timer ) {

    clearTimeout( timer );
  }

  if ( timerMove ) {

    clearTimeout( timerMove );
  }
  
}

// Start game button was clicked so let's start the game

$("#startBut").click( function () {

  clearTimers();

  initGame();

  // Empty the score on the screen and hide all popup divs

  displayScore( score );

  $("#gameOverDiv").css( "display", "none" );
  $("#rulesDiv").css( "display", "none" );
  $("#errorDiv").css( "display", "none" );

  gameIsOn = true;

  timer = setTimeout( function(){ showClickMeDiv(); }, 1500 ); // Show the pic after 1500 ms

});


// Rules button was clicked and the rules (div) are shown on the screen

$("#rulesBut").click( function () {

  $("#rulesDiv").css( "display", "block" );

});


// Close rules button was clicked. The rules div is hidden.

$("#closeRulesBut").click( function () {

  $("#rulesDiv").css( "display", "none" );

});


// The close game over button was clicked. The game over div is hidden.

$("#closeGameOverBut").click( function () {

  $("#gameOverDiv").css( "display", "none" );

});


// Close error button was clicked. The error div is hidden.

$("#closeErrorBut").click( function () {

  $("#errorDiv").css( "display", "none" );

});


// End game button was clicked. Abort the game by canceling the time out to show the pic.
// Also save the state of the game.

$("#endBut").click( function () {

  clearTimers();

  $("#clickMeDiv").css( "display", "none" ); // Hide the pic

  gameIsOn = false;

  countSaved = count;
  scoreSaved = score;
  aveDistSaved = aveDist;
  aveTimeSaved = aveTime;

  saveGame();

});


// Load the saved game state when Load button has been clicked

$("#loadBut").click( function () {
  
  clearTimers();
  
  gameIsOn = false;
  
  $("#clickMeDiv").css( "display", "none" ); // Hide the dartboard pic that should be clicked in the game

  var messageLoad = {
    messageType: "LOAD_REQUEST"
  };

  window.parent.postMessage( messageLoad, "*" ); // Request the game store to load the saved game state

});



// Save the game state at store

function saveGame() {

  var msg = {
    messageType: "SAVE",
    gameState: {
  	  score: score,
  	  count: count,
  	  aveDist: aveDist,
  	  aveTime: aveTime
  	}
  };

  window.parent.postMessage( msg, "*" ); // Post the game's state to the store for saving the state
  
  countSaved = 0;
  scoreSaved = 0;
  aveDistSaved = 0;
  aveTimeSaved = 0;
  
  count = 0; // Makes displayScore show nothing
  displayScore( 0 );
}


// Show the div/pic to click (dartboard pic)

function showClickMeDiv() {

  var width = $(document).width(); // The width of the document
  var height = $(document).height(); // The height of the document

  // Define randomly the new position of the pic
  //var left = parseInt( Math.random() * ( width - $("#clickMeDiv").css( "width" ).replace("px","") ) ) + "px";
  //var top = parseInt( Math.random() * ( height - $("#clickMeDiv").css( "height" ).replace("px","") ) ) + "px";


  startPointX = 0;
  startPointY = parseInt( Math.random() * ( height - $("#clickMeDiv").css( "height" ).replace("px","") ) );

  endPointX = width;
  endPointY = parseInt( Math.random() * ( height - $("#clickMeDiv").css( "height" ).replace("px","") ) );


  movedFactor = 0;


  // Update the pics position
  $("#clickMeDiv").css( "left", startPointX + "px" );
  $("#clickMeDiv").css( "top", startPointY + "px" );

  $("#clickMeDiv").css( "display", "block" ); // Show the hidden div/pic

  clickTime = Date.now(); // Start time when the pic is shown. Used to calculate the time it took for the player to click the pic.

  timerMove = setTimeout( function () { moveClickMeDiv(); }, 33 );

}


var startPointX = 0; // The start x coordinate for the dartboard pic (left edge of the game)
var startPointY = 0; // The start y coordinate for the dartboard pic (left edge of the game)

var endPointX = 0; // The end x coordinate for the dartboard pic (right edge of the game)
var endPointY = 0; // The end y coordinate for the dartboard pic (right edge of the game)

var movedFactor = 0; // The fraction where the dartboard pic is on the linear move
var moveSpeed = 0; // How much the movedFactor is changed for each move (frame). Define the value in moveClickMeDiv function.


// Moves the div/pic on the screen

function moveClickMeDiv() {

  var width = $(document).width(); // The width of the document
  var height = $(document).height(); // The height of the document

  moveSpeed = 0.015 * 300 / width; // Make the speed the same regardles of the width of the game

  movedFactor += moveSpeed;

  if ( movedFactor >= 1 ) { // The pic has moved out of the screen. It wasn't clicked.

    $("#clickMeDiv").css( "display", "none" ); // Hide the pic

    count++;
    displayScore( score );

    isGameOver();

  } else {

    // Calculate the new position for the dartboard pic
    var left = parseInt( Math.round( startPointX + ( endPointX - startPointX ) * movedFactor ) );
    var top = parseInt( Math.round( startPointY + ( endPointY - startPointY ) * movedFactor ) );

    if ( left > width || left < 0 || top > height || top < 0 ) { // The pic has moved out of the screen. It wasn't clicked.

      count++;
      displayScore( score );

      isGameOver();
    }

    // Update the pic's position
    $("#clickMeDiv").css( "left", left + "px" );
    $("#clickMeDiv").css( "top", top + "px" );

    timerMove = setTimeout( function () { moveClickMeDiv(); }, 33 ); // 33 ms => frame rate = 30
  }

}


// Get the (click) event's x-coordinate

function mouseX( evt ) {

  if ( evt.pageX ) {

    return evt.pageX;
  } else if ( evt.clientX ) {

    return evt.clientX + (document.documentElement.scrollLeft ?
    document.documentElement.scrollLeft :
    document.body.scrollLeft);

  } else { return null; }
}


// Get the (click) event's y-coordinate

function mouseY( evt ) {

  if ( evt.pageY ) {

    return evt.pageY;
  } else if ( evt.clientY ) {

    return evt.clientY + (document.documentElement.scrollTop ?
    document.documentElement.scrollTop :
    document.body.scrollTop);

  } else { return null; }
}


// Find the position of the object. Goes through all the object's parents and takes scrolling into acount too.

function findPos( obj ) {

  var curleft = 0;
  var scrollleft = 0;
  var scrLeft = 0;
  var curtop = 0;
  var scrolltop = 0;
  var scrTop = 0;

  if ( obj && obj.offsetParent ) {

    do {
      curleft += obj.offsetLeft;
      curtop += obj.offsetTop;

      if ( obj.tagName != "BODY" ) {

        scrLeft = obj.scrollLeft;
        scrTop = obj.scrollTop;

        scrollleft += scrLeft;
        scrolltop += scrTop;

        curleft -= scrLeft;
        curtop -= scrTop;

      }

    } while ( obj = obj.offsetParent );

    var scrollX = 0;
    var scrollY = 0;

    if ( window.pageXOffset ) {

      scrollX = window.pageXOffset;
    } else if ( document.body.scrollLeft ) {

      scrollX = document.body.scrollLeft;
    }

    if ( window.pageYOffset ) {

      scrollY = window.pageYOffset;
    } else if ( document.body.scrollTop ) {

      scrollY = document.body.scrollTop;
    }

    curleft -= scrollX;
    curtop -= scrollY;

    return [curleft,curtop,scrollleft,scrolltop];

  } else {

    return undefined;
  }
}


});
