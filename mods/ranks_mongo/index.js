var moment = require('moment');
var mongoose = require('mongoose');
var Player = require('./player');

var c = Config.ranks_mongo;
var db = mongoose.connection;
var antispamCache = {};


/** Arranging connection for mongoose **/

db.once('open', function callback() {
  Logger.KScript2("Cool, I connected to Mongo DB named " + c.db + " on " + c.host);
});
db.on('error', function (err) {
  Logger.Failure(err.toString());
  Logger.Failure("Cannot connect to Mongo DB named " + c.db + " on " + c.host);
});

var uri = 'mongodb://' + c.host + '/' + c.db;
mongoose.connect(uri, {
  user: c.user,
  pass: c.password
});

/** Script compiler for RCON execution. Quite ugly thing **/
function compileMessageCommand(username, message) {
  return "CBitStream stream();" +
    "stream.write_string(\"" + username + "\");" +
    "stream.write_string(\"" + message + "\");" +
    "getRules().SendCommand(getRules().getCommandID(\"dummychat\"), stream);";
}

/** Gathering statistins **/

GameEvents.on("flag_captured", function (capturer) {
  if (capturer)
    GetPlayerByLogin(capturer, function (err, playerObject) {
      playerObject.caps += 1;
      playerObject.save();
    }, true);
});

GameEvents.on("player_killed", function (victim, attacker) {

  if (victim)
    GetPlayerByLogin(victim, function (err, playerObject) {
      playerObject.deaths += 1;
      playerObject.save(function(){
        GameEvents.emit('rank_victim');
      });
    }, true);

  if (attacker)
    GetPlayerByLogin(attacker, function (err, playerObject) {
      playerObject.kills += 1;
      playerObject.save(function(){
        GameEvents.emit('rank_updated',attacker);
      });
    }, true);

});

GameEvents.on('chat_command', function (player, command, args) {
  if (command != "rank") return;
  var argument = args[0];

  if(!isNaN(argument)){
    argument = parseInt(argument);
    if(argument <= 0) return;
    Player.find().sort({ points: -1 }).limit(argument).exec(function(err, requested){
      var login = requested[requested.length-1].login;
      showRank(player, login);
    });
    return;
  }

  switch (argument) {
    case 'top':
      showTop(player);
      break;
    case 'reset':
      resetRank(player);
      break;
      resetRank(player);
      break;
    default:
      showRank(player, argument);
      break;
  }
});

function showTop(player) {
  GetPlayerByLogin(player, function (err, requesterObject) {
    if (err) return console.log(err);
    if (!isAllowedToDoRankCommands(requesterObject)) return; //Should we inform somehow?

    antispamCache[player] = moment().format();

    Player.find().sort({ points: -1 }).limit(10).exec(function (err, topPlayers) {
      var topStr = "";

      for (var i = 0; i < topPlayers.length; i++)
        topStr += (i + 1) + ". " + topPlayers[i].login + " with " + topPlayers[i].points + " points\\n";
      Window.sendMessage(player,topStr,10000);
    });
  }, true);
}


function showRank(requester, player) {
  GetPlayerByLogin(requester, function (err, requesterObject) {
    if (err) return console.log(err);

    if (!isAllowedToDoRankCommands(requesterObject)) return;

    player = player || requester;

    antispamCache[requester] = moment().format();


    GetPlayerByLogin(player, function (err, playerObject) {
      if (err) return console.log(err);


      if (playerObject == null) {

        var rankStr = "Sorry, I don't know " + player + "\\nHas he killed anyone?";
        Window.sendMessage(requester, rankStr,10000);

      } else {
        Player.count({ points: { $gt: playerObject.points } }, function (err, countBetter) {
          Player.count({}, function (err, countAll) {
            var rankStr = playerObject.login + " is " + (countBetter + 1) + " of " + countAll + " :" + "\\n" +
              "Points: " + playerObject.points + "\\n" +
              "Kills: " + playerObject.kills + "\\n" +
              "Deaths: " + playerObject.deaths + "\\n" +
              "Caps: " + playerObject.caps + "\\n";

            Window.sendMessage(requester,rankStr,10000);
          });
        });
      }
    });
  }, true);
}

function resetRank(requester) {
  GetPlayerByLogin(requester, function (err, requesterObject) {
    if (err) {
      console.log(err);
      return;
    }

    if (!isAllowedToDoRankCommands(requesterObject)) return; //Should we inform somehow?

    antispamCache[requester] = moment().format();

    if (!isAllowedToReset(requesterObject)) {
      var rankStr = "You can only reset ranks once in 3 days!\\n";
      Window.sendMessage(requester, rankStr,10000);
      return;
    }

    requesterObject.lastRankReset = moment().format();
    requesterObject.kills = 0;
    requesterObject.deaths = 0;
    requesterObject.points = 0;
    requesterObject.caps = 0;
    requesterObject.save(function (err) {
      if (err) return console.log(err);

      var rankStr = "Congratulations, " + requesterObject.login + "\\n" +
        "You are a baby born now!";
      Window.sendMessage(requester,rankStr,10000);
    });


  }, true);
}


function isAllowedToReset(requesterObject) {
  //Potential bug. not sure how this comparison goes
  if (requesterObject.lastRankReset == 0) return true;

  return moment().diff(moment(requesterObject.lastRankReset), "seconds") > c.resetCooldown;
}

function isAllowedToDoRankCommands(requesterObject) {
  //Potential bug. not sure how this comparison goes
  if (!antispamCache[requesterObject.login] || antispamCache[requesterObject.login] == 0) return true;
  return moment().diff(moment(antispamCache[requesterObject.login]), "seconds") > c.antispamCooldown;
}

function GetPlayerByLogin(username, cb, createNew) {
  createNew = createNew || false;

  Player.find({ login: new RegExp(username, 'i') }, function (err, players) {
    var player;
    for (var i = 0; i < players.length; i++)
      if(!player || players[i].login.length <= player.login.length)
        player = players[i];

    if (err) return cb(err, null);
    if (!player && createNew) {

      player = new Player();
      player.login = username;
      player.save(function (err, newPlayer) {
        return cb(null, newPlayer);
      }); //needs cleaning
      return;
    } else if (player == null && !createNew) {
      return cb(null, null);
    }
    cb(null, player);
  });
}


GameEvents.on('player_disconnected', function (player) {
  delete antispamCache[player];
});

GameEvents.on('player_connect', function (player) {
  antispamCache[player] = 0;
});

global.RankedPlayers = Player;
global.RankedPlayers.getByLogin = GetPlayerByLogin;