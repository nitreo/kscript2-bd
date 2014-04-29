var moment = require('moment')
var path = require('path');
var Datastore = require('nedb')
, db = new Datastore({ filename: path.join(process.cwd(),'db/statistics' )});

GameEvents.on("connect",function(){
  db.loadDatabase(function (err) {
    GameEvents.on("player_connect",function(player){
      db.insert({
        name:player,
        type:'connect',
        time:moment().format()
      }, function (err, newDoc) {});
    });
    GameEvents.on("player_disconnect",function(player){
      db.insert({
        name:player,
        type:'disconnect',
        time:moment().format()
      }, function (err, newDoc) {});
    });
  });
})


