
var timers = {};

GameEvents.on('player_disconnected', function (player) {
  delete timers[player];
});

function compileWindowCommand(username,text) {
  return "CBitStream stream();" +
    "stream.write_string(\"" + username + "\");" +
    "stream.write_string(\"" + text + "\");" +
    "getRules().SendCommand(getRules().getCommandID(\"window\"), stream);";
}

GameEvents.on('player_update',function(_,playerObject){
  playerObject.sendMessage = function(text,time){
   windowService.sendMessage(this.login,text,time);
  }
});

GameEvents.on('injected',function(){
  RCON.send("getRules().addCommandID(\"window\"); getRules().AddScript(\"Challenge_PrincessMiddle.as\");");
});

var windowService = {
  sendMessage : function(playerName,text,time){
    RCON.send(compileWindowCommand(playerName,text));
    if(timers[playerName])
      clearTimeout(timers[playerName]);
    timers[playerName] = setTimeout(function(){
      RCON.send(compileWindowCommand(playerName,""));
      delete timers[playerName];
    },time);
  }
}


global.Window = windowService;