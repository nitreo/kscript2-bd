var c = Config.help;

GameEvents.on('chat_command', function (player, command, args) {
  if(command!="help") return;
  Window.sendMessage(player, c.message, c.time*1000);
});
