USE STREAMING_SERVER;

DELIMITER $$

--DELETE

-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_ROOMS_DEL(IN ID INT)

BEGIN

    SET @PORT = NULL;
    
    SELECT PORT_ID INTO @PORT FROM ROOMS WHERE ID = ID;

    IF(@PORT IS NOT NULL) THEN

        DELETE FROM ROOMS WHERE ID = ID;

        UPDATE TCP_PORTS SET PORT_STATUS = 'UNASSIGNED' WHERE ID = @PORT;

        SELECT 1 CH;
    
    ELSE

        SELECT 0 CH;
    
    END IF;

END $$
-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_MUSIC_DEL(IN ID INT)

BEGIN

    SET @SONG = (SELECT FL_NAME FROM MUSIC WHERE ID = ID);

    IF (@SONG IS NOT NULL) THEN

        DELETE FROM MUSIC WHERE ID = ID;

        SELECT @SONG FL_NAME;

    ELSE

        SELECT NULL FL_NAME;
    
    END IF;

END $$
-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_PLAYLISTS_DEL(IN ID INT)

BEGIN

    DELETE FROM PLAYLISTS WHERE ID = ID;

END $$
-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_TAGS_DEL(IN ID INT)

BEGIN

    DELETE FROM TAGS WHERE ID = ID;

END $$

DELIMITER ;