/*FIRST TIME USE SQL SCRIPT*/

CREATE DATABASE STREAMING_SERVER;

USE STREAMING_SERVER;

#------------------------------------------------TABLES----------------------------------------------------------
CREATE TABLE TCP_PORTS
(
	ID INTEGER  NOT NULL PRIMARY KEY,
    PORT INTEGER NOT NULL,
    PORT_STATUS TEXT NOT NULL
);

CREATE TABLE ROOMS 
(
	ID INTEGER NOT NULL AUTO_INCREMENT,
    ROOM_NAME TEXT,
    READER_ID TEXT NOT NULL,
    SPEAKER_ID TEXT NOT NULL,
    READER_NAME TEXT,
    SPEAKER_NAME TEXT,
    PORT_ID INTEGER NOT NULL,

    PRIMARY KEY (ID),

    CONSTRAINT FK_PORT
        FOREIGN KEY (PORT_ID)
        REFERENCES TCP_PORTS (ID)
);

CREATE TABLE MUSIC 
(
	ID INTEGER NOT NULL AUTO_INCREMENT,
    SONG_NAME TEXT,
    ARTIST TEXT,
    GNRE TEXT,
    FL_NAME TEXT NOT NULL UNIQUE,

	PRIMARY KEY (ID)
);

CREATE TABLE PLAYLISTS
(
    ID INTEGER NOT NULL AUTO_INCREMENT,
    LIST_NAME TEXT NOT NULL,
    SONG_IDS TEXT NOT NULL,
    AD_IDS TEXT,
    AD_RATES TEXT,

    PRIMARY KEY (ID)
);

CREATE TABLE TAGS --add playlist
(
	ID INTEGER NOT NULL AUTO_INCREMENT,
    TAG VARCHAR(64) NOT NULL UNIQUE,
    LIST_ID INTEGER NOT NULL,
    DATE_REG DATE,

	PRIMARY KEY (ID),

    CONSTRAINT FK_PLAYLIST
        FOREIGN KEY (LIST_ID)
        REFERENCES PLAYLISTS (ID)
        ON DELETE CASCADE
);

#----------------------------------------TABLE INITIALIZATION----------------------------------------------------------

INSERT INTO TCP_PORTS (ID,PORT,PORT_STATUS)
    VALUES (0,3400,'UNASSIGNED');

INSERT INTO TCP_PORTS (ID,PORT,PORT_STATUS)
    VALUES (1,3401,'UNASSIGNED');

INSERT INTO TCP_PORTS (ID,PORT,PORT_STATUS)
    VALUES (2,3402,'UNASSIGNED');

INSERT INTO TCP_PORTS (ID,PORT,PORT_STATUS)
    VALUES (3,3403,'UNASSIGNED');

INSERT INTO TCP_PORTS (ID,PORT,PORT_STATUS)
    VALUES (4,3404,'UNASSIGNED');  

INSERT INTO TCP_PORTS (ID,PORT,PORT_STATUS)
    VALUES (5,3405,'UNASSIGNED');

INSERT INTO TCP_PORTS (ID,PORT,PORT_STATUS)
    VALUES (6,3406,'UNASSIGNED');

INSERT INTO TCP_PORTS (ID,PORT,PORT_STATUS)
    VALUES (7,3407,'UNASSIGNED');

INSERT INTO TCP_PORTS (ID,PORT,PORT_STATUS)
    VALUES (8,3408,'UNASSIGNED');

INSERT INTO TCP_PORTS (ID,PORT,PORT_STATUS)
    VALUES (9,3409,'UNASSIGNED'); 

INSERT INTO TCP_PORTS (ID,PORT,PORT_STATUS)
    VALUES (10,3410,'UNASSIGNED');  

INSERT INTO MUSIC (SONG_NAME,ARTIST,FL_NAME)
    VALUES ('default','GOOGLE TRANSLATE','default.mp3');

INSERT INTO MUSIC (SONG_NAME,ARTIST,FL_NAME)
    VALUES ('Never Gonna Give You Up','Rick Astley','Rick Rolling.m4a');

#------------------------------------------------PROCEDURES----------------------------------------------------------

DELIMITER $$

-- INSERT

#-----------------------------------------------------------------------------------------------------------------
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
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_MUSIC_INS(IN SONG_NAME TEXT,IN ARTIST TEXT, IN GNRE TEXT,IN FL_NAME TEXT)

BEGIN

    INSERT INTO MUSIC (SONG_NAME,ARTIST,GNRE,FL_NAME) VALUES (SONG_NAME,ARTIST,GNRE,FL_NAME);

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_PLAYLISTS_INS(IN LIST_NAME TEXT,IN SONG_IDS TEXT,IN AD_IDS TEXT,IN AD_RATES TEXT)

BEGIN

    INSERT INTO PLAYLISTS (LIST_NAME,SONG_IDS,AD_IDS,AD_RATES) VALUES (LIST_NAME,SONG_IDS,AD_IDS,AD_RATES);

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_TAGS_INS(IN TAG VARCHAR(64),IN LIST_ID INTEGER)

BEGIN

    SET @DATE = CURDATE();

    INSERT INTO TAGS (TAG,LIST_ID,DATE_REG) VALUES (TAG,LIST_ID,@DATE);

END $$

-- UPDATE

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

-- DELETE

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

#-------------------------------------------------CREDENTIALS-------------------------------------------------------------

CREATE USER 'orbittas'@'localhost' IDENTIFIED WITH mysql_native_password BY 'P4s5w0rd++';

GRANT ALL PRIVILEGES ON STREAMING_SERVER.* TO 'orbittas'@'localhost';

FLUSH PRIVILEGES;

SHOW VARIABLES LIKE 'validate_password%';
