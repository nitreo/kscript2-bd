
var path = require('path');
var spawn = require('child_process').spawn;
var fs = require('fs');

var c = Config.injector;
var autostartPath = path.join(c.kagPath,'Base','Scripts/autostart.as');
var injectionTimeout;

GameEvents.on('connect',function(){
  inject();
});

GameEvents.on('reconnect',function(){
  inject();
});

function preventInjection(){
  Logger.Warning("Server has already been modified. Stopping injection.");
  clearTimeout(injectionTimeout);
}

function inject(){

  Parser.onceOnRegex("^Loading\\sscript\\sScripts/autostart\\.as",
    function(){
      setTimeout(function(){
        cleanUp();
      },3000);
    });

  Parser.onceOnRegex( "^KS\\sYES",
    function(){
      preventInjection();
    });

  injectionTimeout = setTimeout(function(){
    spawn('cp',[autostartPath,'./temp_autostart']).stdout.on('close',function(){
      spawn('cp', ['./injection_content.as', autostartPath]).stdout.on('close',function(){
        Logger.KScript2("autostart.as replaced, registering script...");
        RCON.send('getRules().AddScript("autostart.as")');
      })
    })
  },3000);
  Logger.KScript2("Checking injection. Waiting response from server for 3 seconds...");
  RCON.send("/injected");
}

function cleanUp(){
  spawn('cp', ['./temp_autostart', autostartPath]).stdout.on('close',function(){
    spawn('rm', ['./temp_autostart']).stdout.on('close',function(){
      RCON.send('/registercommand "injected" "void CheckInjection()" "Scripts/autostart.as" "Checks if the content is injected"');
      Logger.KScript2("autostart.as recovered. Injection succesfull!");
      GameEvents.emit("injected");
    });
  })
}

