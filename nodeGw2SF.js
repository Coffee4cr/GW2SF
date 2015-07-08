var http = require('https');
var mysql      = require('mysql');
var connection = mysql.createPool({
  connectionLimit : 60,
  host     : 'localhost',
  user     : 'guildwars2',
  password : 'tyria',
  database : 'GuildWars2'
});

var loopCount = 0;
function getMatchID() {
   var SFServerId = '1006'; 
   var blue  = 'Blue';
   var green = 'Green';
   var red   = 'Red';
   var match_id;
   var serverColor = 'Neutral'
   var matchesUrl = 'https://api.guildwars2.com/v1/wvw/matches.json';
   //get the information of the different matches
   http.get(matchesUrl, function(res) {
      var body = '';
   
      res.on('data', function(chunk) {
          body += chunk;
      });
      res.on('end', function() {
         var response = JSON.parse(body)
         //loop to find which color and in which match is our server playing in
         for (i = 0; i < response.wvw_matches.length; i++) {
            var matchup = response.wvw_matches[i];
            
            // Create the base table here
            if(matchup.red_world_id == SFServerId) {
               match_id = matchup.wvw_match_id;
               serverColor = red;
               break;
            }else if(matchup.green_world_id == SFServerId)
            {
               match_id = matchup.wvw_match_id;
               serverColor = green;
               break;
            }else if(matchup.blue_world_id == SFServerId)
            {
               match_id = matchup.wvw_match_id;
               serverColor = blue;
               break;
            }
         }
         if (match_id == matchup.wvw_match_id) {
            console.log('Match_id:'+match_id);
            //start scanning objectives for guilds
            scanForGuilds(match_id, serverColor)
         }
      });
   }).on('error', function(e) {
         console.log("Got error: ", e);
   });
}

function scanForGuilds(match_id, serverColor) {
   var matchDetailsUrl = 'https://api.guildwars2.com/v1/wvw/match_details.json?match_id=' + match_id;
   var body = '';
   loopCount +=1;
   console.log(loopCount);
   //get the details from each map in the current matchup. Every objective.
   http.get(matchDetailsUrl, function(res) {
      res.on('data', function(chunk) {
         body += chunk;
      });
      res.on('end', function() {
         var response = JSON.parse(body);
         //loop on each map
         for (i = 0; i < response.maps.length; i++) {
            var map = response.maps[i];
            //loop on every objective from that map
            for (j = 0; j < map.objectives.length; j++) {
               var objective = map.objectives[j];
               //if the objective is owned by our server, and has a guild that claimed it
               if (objective.owner == serverColor && objective.owner_guild) {
                  //Get the information of that guild.
                  getGuildInfo(objective.owner_guild);
               }
            }
         }
         wait60sec(match_id, serverColor);
      });
   }).on('error', function(e) {
         console.log("Got error: ", e);
   });
} 

function getGuildInfo(guild_id) {
   var guildDetailUrl = 'https://api.guildwars2.com/v1/guild_details.json?guild_id=' + guild_id;
   var body = '';
   //get the guild details
   http.get(guildDetailUrl, function(res) {
      res.on('data', function(chunk) {
         body += chunk;
      });
      res.on('end', function() {
         var response = JSON.parse(body);
         var lastIdInserted;
         ////////////////////
         //Database Queries//
         ////////////////////
         var guild  = {guild_id                        : response.guild_id, 
                       guild_name                      : response.guild_name,
                       tag                             : response.tag,
                       background_id                   : response.emblem.background_id,
                       foreground_id                   : response.emblem.foreground_id,
                       background_color_id             : response.emblem.background_color_id,
                       foreground_primary_color_id     : response.emblem.foreground_primary_color_id,
                       foreground_secondary_color_id   : response.emblem.foreground_secondary_color_id
                      };    
         var guildUpd  = {guild_name                   : response.guild_name,
                          tag                          : response.tag,
                          background_id                : response.emblem.background_id,
                          foreground_id                : response.emblem.foreground_id,
                          background_color_id          : response.emblem.background_color_id,
                          foreground_primary_color_id  : response.emblem.foreground_primary_color_id,
                          foreground_secondary_color_id: response.emblem.foreground_secondary_color_id
                         };    
         
         var queryGuild = connection.query('INSERT INTO guilds SET ? ON DUPLICATE KEY UPDATE ?', [guild,guildUpd], function(errGuild, resultGuild) {
            //error
            if (errGuild) {
               console.error('error connecting: ' + errGuild.stack);
               return;
            }
            //console.log(queryGuild.sql); 
            
            var queryGuild = connection.query('SELECT flag_id FROM guilds WHERE guild_id = ?', response.guild_id, function(errFlagId, resultFlagId) {
               //error
               if (errFlagId) {
                  console.error('error connecting: ' + errFlagId.stack);
                  return;
               }
               
            
               lastIdInserted = resultFlagId.flag_id
               console.log('resultFlagId: '+ resultFlagId[0]);
            });
            
            console.log('['+ response.tag + '] ' + response.guild_name);
            
            
            var emblem = {id                         : lastIdInserted, 
                          FlipBackgroundHorizontal   : 0,
                          FlipBackgroundVertical     : 0,
                          FlipForegroundHorizontal   : 0,
                          FlipForegroundVertical     : 0 
                         };
                          
            var emblemUpd = {FlipBackgroundHorizontal: 0,
                             FlipBackgroundVertical  : 0,
                             FlipForegroundHorizontal: 0,
                             FlipForegroundVertical  : 0 
                            };
            var queryEmblem = connection.query('INSERT INTO guild_emblem_flags SET ? ON DUPLICATE KEY UPDATE ?', [emblem,emblemUpd], function(errEmblem, resultEmblem) {
               //error
               if (errEmblem) {
                  console.error('error connecting: ' + errEmblem.stack);
                  return;
               }
               //console.log(queryEmblem.sql);
               
            });
         });
         
         
         //console.log(response.guild_name + ' ['+response.tag+']');
      });
   });
}

function wait60sec(match_id, serverColor) {
   setTimeout(function(){
      scanForGuilds(match_id, serverColor);
   }, 60000);
   console.log('');
}
////////////////////
//Connect Database//
////////////////////
/*connection.connect(function(err) {
   if (err) {
     console.error('error connecting: ' + err.stack);
     return;
   }
   console.log('connected as id ' + connection.threadId);
});*/
//Start Everything
getMatchID();

///////////////////
//End connection //
///////////////////
//connection.end();
