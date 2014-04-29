/**
 * Created by sinitreo on 4/25/14.
 */

var c = Config.beginner;

GameEvents.on('player_connect',function(player){
  checkPlayer(player, c.ByeMessageTime * 1000);
});

GameEvents.on('rank_updated',function(username){
  checkPlayer(username, c.ByeMessageTime * 1000);
});

function checkPlayer(username,kickIn){
  if(c.Admins.indexOf(username) >=0) return;
  RankedPlayers.getByLogin(username,function(err,player){
    if(!player) return;
    if(player.points > c.MaxPoints || (player.pointsRecord && player.pointsRecord > c.MaxPoints)){
      setTimeout(function(){
        Players[username].kick();
      },kickIn);
      Window.sendMessage(username,"Congratulations!\\nYou have reached "+c.MaxPoints+" and now can play on more professional servers!\\nYou will be automatically disconnected in 20 seconds!\\nBye!",kickIn);
    }
  });
}