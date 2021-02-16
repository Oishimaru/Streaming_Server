USE STREAMING_SERVER;

DELIMITER $$

--INSERT

-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_ROOMS_INS(IN ROOM_NAME TEXT,IN READER_ID TEXT,IN SPEAKER_ID TEXT,IN READER_NAME TEXT,IN SPEAKER_NAME TEXT)

BEGIN

    SET @PORT = NULL;
    
    SELECT ID INTO @PORT FROM TCP_PORTS WHERE PORT_STATUS = 'UNASSIGNED' LIMIT 1;

    IF(@PORT IS NOT NULL) THEN

        INSERT INTO ROOMS (ROOM_NAME,READER_ID,SPEAKER_ID,READER_NAME,SPEAKER_NAME,PORT_ID) 
            VALUES (ROOM_NAME,READER_ID,SPEAKER_ID,READER_NAME,SPEAKER_NAME,@PORT);

        UPDATE TCP_PORTS SET PORT_STATUS = 'ASSIGNED' WHERE ID = @PORT;

        SELECT 1;
    
    ELSE

        SELECT 0;
    
    END IF;

END $$
-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_MUSIC_INS(IN SONG_NAME TEXT,IN ARTIST TEXT, IN GNRE TEXT,IN FL_NAME TEXT)

BEGIN

    INSERT INTO MUSIC (SONG_NAME,ARTIST,GNRE,FL_NAME) VALUES (SONG_NAME,ARTIST,GNRE,FL_NAME);

END $$
-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_PLAYLISTS_INS(IN LIST_NAME TEXT,IN SONG_IDS TEXT,IN AD_IDS TEXT,IN AD_RATES TEXT)

BEGIN

    INSERT INTO PLAYLISTS (LIST_NAME,SONG_IDS,AD_IDS,AD_RATES) VALUES (LIST_NAME,SONG_IDS,AD_IDS,AD_RATES);

END $$
-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_TAGS_INS(IN TAG VARCHAR(64),IN LIST_ID INTEGER)

BEGIN

    SET @DATE = CURDATE();

    INSERT INTO TAGS (TAG,LIST_ID,DATE_REG) VALUES (TAG,LIST_ID,@DATE);

END $$

DELIMITER ;
