var mongoose = require('mongoose');
var playerSchema = mongoose.Schema({
  login : { type : String, index: true},
  kills : { type : Number, default: 0},
  deaths : { type : Number, default: 0},
  caps : { type : Number, default: 0},
  points : { type : Number, default: 0},
  lastRankReset : {type: Date, default : 0},
  pointsRecord : {type:Number, default: 0}
});

playerSchema.methods.updatePoints = function () {
  this.points = parseInt((this.kills - this.deaths) * (this.kills / (this.deaths + 1))+this.caps*3);

}
playerSchema.path('points').set(function(value) {
  if(!this.pointsRecord ||  value > this.pointsRecord){
    this.pointsRecord = value;
  }
  return value;
});


playerSchema.path('kills').set(function(value) {
  this.points = points(value,this.deaths,this.caps);
  return value;
});


playerSchema.path('deaths').set(function(value) {
  this.points = points(this.kills,value,this.caps);
  return value;
});


playerSchema.path('caps').set(function(value) {
  this.points = points(this.kills,this.deaths,value);
  return value;
});


function points(kills, deaths, caps){
  return parseInt((kills - deaths) * (kills / (deaths + 1))+caps*3);
}
module.exports = mongoose.model('Player', playerSchema);