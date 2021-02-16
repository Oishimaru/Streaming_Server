USE STREAMING_SERVER;

DELIMITER $$

--UPDATE

-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_ROOMS_UPD(IN ROOM_NAME TEXT,IN READER_ID TEXT,IN SPEAKER_ID TEXT,IN READER_NAME TEXT,IN SPEAKER_NAME TEXT,IN ID INT)

BEGIN

    UPDATE ROOMS SET ROOM_NAME = ROOM_NAME,READER_ID = READER_ID,SPEAKER_ID = SPEAKER_ID,READER_NAME = READER_NAME,SPEAKER_NAME = SPEAKER_NAME
        WHERE ID = ID;

END $$
-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_MUSIC_UPD(IN SONG_NAME TEXT,IN ARTIST TEXT, IN GNRE TEXT,IN FL_NAME TEXT,IN ID INT)

BEGIN

    SET @SONG = (SELECT FL_NAME FROM MUSIC WHERE ID = ID);

    IF (@SONG IS NOT NULL) THEN

        UPDATE MUSIC SET SONG_NAME = SONG_NAME,ARTIST = ARTIST,GNRE = GNRE,FL_NAME = FL_NAME
            WHERE ID = ID;

        SELECT @SONG FL_NAME;

    ELSE

        SELECT NULL FL_NAME;
    
    END IF;

END $$
-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_PLAYLISTS_UPD(IN LIST_NAME TEXT,IN SONG_IDS TEXT,IN AD_IDS TEXT,IN AD_RATES TEXT,IN ID INT)

BEGIN

    UPDATE PLAYLISTS SET LIST_NAME = LIST_NAME,SONG_IDS = SONG_IDS,AD_IDS = AD_IDS,AD_RATES = AD_RATES 
        WHERE ID = ID;

END $$
-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_TAGS_UPD(IN LIST_ID INTEGER,IN ID INT)

BEGIN

    UPDATE TAGS SET LIST_ID = LIST_ID 
        WHERE ID = ID;

END $$

DELIMITER ;
