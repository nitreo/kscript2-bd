GameEvents.on("connect",function(){
  setInterval(function(){
     RCON.send('getRules().SetGlobalMessage("FART FART FART");');
  },1000)
});

GameEvents.on("player_killed", function (victim, attacker) {
});