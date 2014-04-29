var c = Config.welcome;

GameEvents.on('player_connect',function(player,playerObject){
  Window.sendMessage(player, c.message, c.time * 1000);
})