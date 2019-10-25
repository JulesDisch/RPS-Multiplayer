$(document).ready(function () {
  $("#inPlay").hide();

  // Initialize Firebase
  var firebaseConfig = {
    apiKey: "AIzaSyCWPg0GagUbv9N140YnZ68lMmjvnTT1NeE",
    authDomain: "rps-multi-134e8.firebaseapp.com",
    databaseURL: "https://rps-multi-134e8.firebaseio.com",
    projectId: "rps-multi-134e8",
    storageBucket: "rps-multi-134e8.appspot.com",
    messagingSenderId: "191593318510",
    appId: "1:191593318510:web:46631bf18f15e2b029fe7f",
    measurementId: "G-X4XPQQLERW"
  };

  firebase.initializeApp(firebaseConfig);

  var database = firebase.database();
  var chatData = database.ref("/chatBox");
  var playersRef = database.ref("players");
  var currentTurnRef = database.ref("turn");
  var username;
  var currentPlayers = null;
  var currentTurn = null;
  var playerNum = false;
  var playerOneExists = false;
  var playerTwoExists = false;
  var playerOneData = null;
  var playerTwoData = null;

  // All them event listeners:

  // get the party started:
  // If user clicks the start button: 
  $("#start").on("click", function () {
    if ($("#username").val() !== "") {
      username = capitalize($("#username").val());
      startGame();
    }
  });

  // If user clicks "enter":
  $("#username").on("keypress", function (e) {
    if (e.which === 13 && $("#username").val() !== "") {
      username = capitalize($("#username").val());
      startGame();
    }
  });

  // let's chat:
  // If user clicks the send button: 
  $("#chat-send").on("click", function () {
    if ($("#chat-input").val() !== "") {
      chat();
    }
  });

  // If user clicks "enter":
  $("#chat-input").on("keypress", function (e) {
    if (e.which === 13 && $("#chat-input").val() !== "") {
      chat();
    }
  });

  // Update the chat on the screen:
  chatData.orderByChild("time").on("child_added", function (snapshot) {
    $("#chat-messages").append(
      $("<p>").addClass("player-" + snapshot.val().idNum),
      $("<span>").text(snapshot.val().name + ":" + snapshot.val().message)
    );

    // Shows most recent message:
    $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);
  });

  // Tracks changes in key which contains player objects:
  playersRef.on("value", function (snapshot) {
    currentPlayers = snapshot.numChildren();

    // Check to see if players exist:
    playerOneExists = snapshot.child("1").exists();
    playerTwoExists = snapshot.child("2").exists();

    // Player data objects:
    playerOneData = snapshot.child("1").val();
    playerTwoData = snapshot.child("2").val();

    // If there is a player 1, populate name, wins, and losses:
    if (playerOneExists) {
      $("#player1-name").text(playerOneData.name);
      $("#player1-wins").text("Wins: " + playerOneData.wins);
      $("#player1-losses").text("Losses: " + playerOneData.losses);

    } else {
      // If there is no player 1, clear wins and losses, and show waiting for another player:
      $("#current-turn").html("<h2>Waiting for another player.</h2>");
      $("#player1-name").text("Waiting for Player 1");
      $("#player1-wins").empty();
      $("#player1-losses").empty();
    }

    // If there is a player 2, populate name, wins, and losses:
    if (playerTwoExists) {
      $("#player2-name").text(playerTwoData.name);
      $("#player2-wins").text("Wins: " + playerTwoData.wins);
      $("#player2-losses").text("Losses: " + playerTwoData.losses);
      //  If there are two players, chat header will say "Chat with [other player]":
      if (username === playerTwoData.name) { $("#chat-header").text("Chat with " + playerOneData.name); }
      else if (username === playerOneData.name) { $("#chat-header").text("Chat with " + playerTwoData.name); }
    } else {
      // If there is no player 2, clear wins and losses, and show waiting for another player:
      $("#current-turn").html("<h2>Waiting for another player.</h2>");
      $("#player2-name").text("Waiting for Player 2");
      $("#player2-wins").empty();
      $("#player2-losses").empty();
    }
  });

  // Detects changes in current turn:
  currentTurnRef.on("value", function (snapshot) {
    // Gets current turn value from snapshot:
    currentTurn = snapshot.val();
    if (playerNum) {
      if (currentTurn === 1) {
        // If its the current player's turn, tell them and show choices:
        if (currentTurn === playerNum) {
          setTimeout( generateChoices(), 3000);
        } else {
          // If it isn't the current players turn, tells them they're waiting for the other player:
          $("#current-turn h2").text("Waiting for " + playerOneData.name + " to choose.");
        }
        // Shows active player:
        $("#player1").css("border", "5px groove white");
        $("#player2").css("border", "5px groove navy");
      } else if (currentTurn === 2) {
        if (currentTurn === playerNum) {
          generateChoices();
        } else {
          $("#current-turn h2").text("Waiting for " + playerTwoData.name + " to choose.");
        }

        $("#player2").css("border", "5px groove white");
        $("#player1").css("border", "5px groove navy");
      } else if (currentTurn === 3) {
        // Where the game win logic happens:
        gameLogic(playerOneData.choice, playerTwoData.choice);

        // Shows both players' choices:
        $("#player1-chosen").text(playerOneData.choice);
        $("#player2-chosen").text(playerTwoData.choice);

        //  Then resets after a timeout:
        var moveOn = function () {
          $("#player1-chosen").empty();
          $("#player2-chosen").empty();
          $("#result h2").empty();

          // Checks that players didn't leave before timeout:
          if (playerOneExists && playerTwoExists) {
            currentTurnRef.set(1);
          }
        };

        //  Show results for 3 seconds, before resetting:
        setTimeout(moveOn, 3000);
      } else {
        $("#player1 ul").empty();
        $("#player2 ul").empty();
        $("#current-turn").html("<h2>Waiting for another player to join.</h2>");
        $("#player2").css("border", "5px groove #010D27");
        $("#player1").css("border", "5px groove #010D27");
      }
    }
  });

  // Allows the Startgame fuction to work once two players join:
  playersRef.on("child_added", function (snapshot) {
    if (currentPlayers === 1) {
      // Sets turn to 1, starting the game:
      currentTurnRef.set(1);
    }
  });

  // Generates the images for Rock, Paper, Scissors, and creates the on click functionality:
  function generateChoices() {
    $("#current-turn h2").text("It's Your Turn!");
    var choicesDiv = $("<div>");
    var RockDiv = $("<div class = 'RPS'>");
    var PaperDiv = $("<div class = 'RPS'>");
    var ScissorsDiv = $("<div class = 'RPS'>");
    var RockImage = $("<img class='choice-image' choice-value='Rock' src='assets/images/rock.png' alt='Rock'>");
    var PaperImage = $("<img class='choice-image' choice-value='Paper' src='assets/images/paper2.png' alt='Paper'>");
    var ScissorsImage = $("<img class='choice-image' choice-value='Scissors' src='assets/images/scissors2.png' alt='Scissors'>");
    RockDiv.append(RockImage);
    PaperDiv.append(PaperImage);
    ScissorsDiv.append(ScissorsImage);
    choicesDiv.append(RockDiv, PaperDiv, ScissorsDiv);
    $("#player" + playerNum + " #choices").prepend(choicesDiv);
    $(".choice-image").on("click", function () {
      var clickChoice = ($(this).attr("choice-value"));
      // Sets the choice in the current player object in firebase:
      playerRef.child("choice").set(clickChoice);
      $("#player" + playerNum + " #choices").empty();
      $("#player" + playerNum + "chosen").text(clickChoice);
      // Increments the turn:
      currentTurnRef.transaction(function (turn) {
        return turn + 1;
      });
    });
  }

  // Let's capitalize usernames:
  function capitalize(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  // Function that actually starts the game:
  function startGame() {
    // Hides Directions once game is in play:
    $("#Directions").hide();
    // Shows game play once username is entered:
    $("#inPlay").show();
    var chatDataDisc = database.ref("/chatBox/" + Date.now());
    if (currentPlayers < 2) {
      if (playerOneExists) {
        playerNum = 2;
      } else {
        playerNum = 1;
      }

      // Creates key based on assigned player number:
      playerRef = database.ref("/players/" + playerNum);

      // Creates player object:
      playerRef.set({
        name: username,
        wins: 0,
        losses: 0,
        choice: null
      });

      // If a player disconnects. . .

      // . . .remove their player object:
      playerRef.onDisconnect().remove();

      // . . .set the current turn to 'null', stopping the game:
      currentTurnRef.onDisconnect().remove();

      //. . . send disconnect message to chat with Firebase server generated timestamp and id of '0' to denote system message:
      chatDataDisc.onDisconnect().set({
        name: username,
        time: firebase.database.ServerValue.TIMESTAMP,
        message: "has disconnected.",
        idNum: 0
      });

      // Welcome the current player:
      $("#which-player").empty();
      $("#which-player").append($("<h2>").text("Hi " + username + "!"));
    } else {
      // If there already are two players, pop a modal for anyone else trying to play:
      fullModal();
      function fullModal() {
        var fullModal = document.getElementById("game-full");
        var okBtn = document.getElementById("ok");
        fullModal.style.display = "block";
        okBtn.onclick = function () {
          fullModal.style.display = "none";
        }
      }
    }
  }

  // How the game goes:
  function gameLogic(player1choice, player2choice) {
    $("#current-turn").html("<h2></h2>");
    // If player one wins:
    var playerOneWon = function () {
      $("#result h2").text(playerOneData.name + " Wins!");
      if (playerNum === 1) {
        playersRef
          .child("1")
          .child("wins")
          .set(playerOneData.wins + 1);
        playersRef
          .child("2")
          .child("losses")
          .set(playerTwoData.losses + 1);
      }
    };
    // If player two wins:
    var playerTwoWon = function () {
      $("#result h2").text(playerTwoData.name + " Wins!");
      if (playerNum === 2) {
        playersRef
          .child("2")
          .child("wins")
          .set(playerTwoData.wins + 1);
        playersRef
          .child("1")
          .child("losses")
          .set(playerOneData.losses + 1);
      }
    };
    // If it's a tie:
    var tie = function () {
      $("#result h2").text("Tie Game!");
    };

    // How we define winners and losers:
    if (player1choice === "Rock" && player2choice === "Rock") {
      tie();
    } else if (player1choice === "Paper" && player2choice === "Paper") {
      tie();
    } else if (player1choice === "Scissors" && player2choice === "Scissors") {
      tie();
    } else if (player1choice === "Rock" && player2choice === "Paper") {
      playerTwoWon();
    } else if (player1choice === "Rock" && player2choice === "Scissors") {
      playerOneWon();
    } else if (player1choice === "Paper" && player2choice === "Rock") {
      playerOneWon();
    } else if (player1choice === "Paper" && player2choice === "Scissors") {
      playerTwoWon();
    } else if (player1choice === "Scissors" && player2choice === "Rock") {
      playerTwoWon();
    } else if (player1choice === "Scissors" && player2choice === "Paper") {
      playerOneWon();
    }
  }

  // How we push the chat data:
  function chat() {
    var message = $("#chat-input").val();
    chatData.push({
      name: username,
      message: message,
      time: firebase.database.ServerValue.TIMESTAMP,
      idNum: playerNum
    });
    $("#chat-input").val("");
  }
});
