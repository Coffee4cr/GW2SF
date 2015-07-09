CREATE TABLE `guilds` (
  `guild_id` varchar(255) NOT NULL,
  `guild_name` varchar(255) NOT NULL,
  `tag` varchar(10) NOT NULL,
  `flag_id` int(11) unsigned NOT NULL,
  `last_seen` datetime DEFAULT NULL,
  PRIMARY KEY (`guild_id`),
  UNIQUE KEY `flags_UNIQUE` (`flag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
--
CREATE TABLE `guild_emblem_flags` (
  `id` int(11) NOT NULL,
<<<<<<< HEAD
  `FlipBackgroundHorizontal` int(1),
  `FlipBackgroundVertical` int(1),
  `FlipForegroundHorizontal` int(1),
  `FlipForegroundVertical` int(1),
=======
  `FlipBackgroundHorizontal` int(1) DEFAULT NULL,
  `FlipBackgroundVertical` int(1) DEFAULT NULL,
  `FlipForegroundHorizontal` int(1) DEFAULT NULL,
  `FlipForegroundVertical` int(1) DEFAULT NULL,
  `background_id` int(11) DEFAULT NULL,
  `foreground_id` int(11) DEFAULT NULL,
  `background_color_id` int(11) DEFAULT NULL,
  `foreground_primary_color_id` int(11) DEFAULT NULL,
  `foreground_secondary_color_id` int(11) DEFAULT NULL,
>>>>>>> origin/master
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
--
CREATE TRIGGER GuildWars2.guilds_BRI 
BEFORE INSERT ON guilds FOR EACH ROW
BEGIN
   DECLARE temp_id integer;
   SELECT MAX(id)+1 INTO temp_id FROM guild_emblem_flags;
   SET NEW.last_seen = NOW();
   SET NEW.flag_id = temp_id;
END
--
CREATE TRIGGER GuildWars2.guilds_BRU 
BEFORE UPDATE ON guilds FOR EACH ROW
BEGIN
   SET NEW.last_seen = NOW();
END