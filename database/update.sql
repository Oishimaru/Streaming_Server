USE STREAMING_SERVER;

DROP PROCEDURE ss_TAGS_UPD;
DROP PROCEDURE ss_ROOMS_UPD;
DROP PROCEDURE ss_MUSIC_UPD;
DROP PROCEDURE ss_PLAYLISTS_UPD;

DROP PROCEDURE ss_TAGS_DEL;
DROP PROCEDURE ss_ROOMS_DEL;
DROP PROCEDURE ss_MUSIC_DEL;
DROP PROCEDURE ss_PLAYLISTS_DEL;

DELIMITER $$

#--UPDATE

#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_ROOMS_UPD(IN ROOM_NAME TEXT,IN READER_ID TEXT,IN SPEAKER_ID TEXT,IN READER_NAME TEXT,IN SPEAKER_NAME TEXT,IN INID INT)

BEGIN

    UPDATE ROOMS SET ROOM_NAME = ROOM_NAME,READER_ID = READER_ID,SPEAKER_ID = SPEAKER_ID,READER_NAME = READER_NAME,SPEAKER_NAME = SPEAKER_NAME
        WHERE ID = INID;

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_MUSIC_UPD(IN SONG_NAME TEXT,IN ARTIST TEXT, IN GNRE TEXT,IN FL_NAME TEXT,IN INID INT)

BEGIN

    SET @SONG = (SELECT FL_NAME FROM MUSIC WHERE ID = INID);

    IF (@SONG IS NOT NULL) THEN

        UPDATE MUSIC SET SONG_NAME = SONG_NAME,ARTIST = ARTIST,GNRE = GNRE,FL_NAME = FL_NAME
            WHERE ID = INID;

        SELECT @SONG FL_NAME;

    ELSE

        SELECT NULL FL_NAME;
    
    END IF;

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_PLAYLISTS_UPD(IN LIST_NAME TEXT,IN SONG_IDS TEXT,IN AD_IDS TEXT,IN AD_RATES TEXT,IN INID INT)

BEGIN

    UPDATE PLAYLISTS SET LIST_NAME = LIST_NAME,SONG_IDS = SONG_IDS,AD_IDS = AD_IDS,AD_RATES = AD_RATES 
        WHERE ID = INID;

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_TAGS_UPD(IN LIST_ID INTEGER,IN INID INT)

BEGIN

    UPDATE TAGS SET LIST_ID = LIST_ID 
        WHERE ID = INID;

END $$

#--DELETE

#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_ROOMS_DEL(IN INID INT)

BEGIN

    SET @PORT = NULL;
    
    SELECT PORT_ID INTO @PORT FROM ROOMS WHERE ID = INID;
    

    IF(@PORT IS NOT NULL) THEN

        DELETE FROM ROOMS WHERE ID = INID;

        UPDATE TCP_PORTS SET PORT_STATUS = 'UNASSIGNED' WHERE ID = @PORT;

        SELECT 1 CH;
    
    ELSE

        SELECT 0 CH;
    
    END IF;

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_MUSIC_DEL(IN INID INT)

BEGIN

    SET @SONG = (SELECT FL_NAME FROM MUSIC WHERE ID = INID);

    IF (@SONG IS NOT NULL) THEN 

        DELETE FROM MUSIC WHERE ID = INID;

        SELECT @SONG FL_NAME;

    ELSE

        SELECT NULL FL_NAME;
    
    END IF;

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_PLAYLISTS_DEL(IN INID INT)

BEGIN

    DELETE FROM PLAYLISTS WHERE ID = INID;

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_TAGS_DEL(IN INID INT)

BEGIN

    DELETE FROM TAGS WHERE ID = INID;

END $$

DELIMITER ;