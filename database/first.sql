/*FIRST TIME USE SQL SCRIPT*/

DROP DATABASE IF EXISTS STREAMING_SERVER;

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
    FL_NAME  VARCHAR(40) NOT NULL UNIQUE,

	PRIMARY KEY (ID)
);

CREATE TABLE ADS 
(
	ID INTEGER NOT NULL AUTO_INCREMENT,
    TOPIC TEXT,
    FL_NAME VARCHAR(40) NOT NULL UNIQUE,

	PRIMARY KEY (ID)
);

CREATE TABLE PLAYLISTS
(
    ID INTEGER NOT NULL AUTO_INCREMENT,
    LIST_NAME TEXT NOT NULL,
    PL_TABLE_NAME TEXT,
    AD_TABLE_NAME TEXT,
    ADS BOOLEAN NOT NULL,
    MIN_AD_RATE INTEGER NOT NULL,
    TRACKS INTEGER NOT NULL,
    GNRES TEXT,
    AD_TRACKS INTEGER NOT NULL,

    PRIMARY KEY (ID)
);

/*
    SAMPLES

    CREATE TABLE PTX
    (
        ID INTEGER NOT NULL AUTO_INCREMENT,
        SONG_ID INTENGER NOT NULL,

        PRIMARY KEY(ID),

        CONSTRAINT FK_SONG
            FOREIGN KEY (SONG_ID)
            REFERENCES MUSIC (ID)
            ON DELETE CASCADE
    )

    CREATE TABLE ATX
    (
        ID INTEGER NOT NULL AUTO_INCREMENT,
        AD_ID INTENGER NOT NULL,
        RATE INTEGER NOT NULL,

        PRIMARY KEY(ID),

        CONSTRAINT FK_SONG
            FOREIGN KEY (AD_ID)
            REFERENCES ADS (ID)
            ON DELETE CASCADE
    )
*/

CREATE TABLE TAGS
(
	ID INTEGER NOT NULL AUTO_INCREMENT,
    TAG VARCHAR(64) NOT NULL UNIQUE,
    LIST_ID INTEGER NOT NULL,
    RANDOM BOOLEAN NOT NULL,
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
CREATE PROCEDURE ss_MUSIC_INS(IN SONG_NAME TEXT,IN ARTIST TEXT, IN GNRE TEXT,IN FL_NAME VARCHAR(40))

BEGIN

    INSERT INTO MUSIC (SONG_NAME,ARTIST,GNRE,FL_NAME) VALUES (SONG_NAME,ARTIST,GNRE,FL_NAME);

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_ADS_INS(IN TOPIC TEXT,IN FL_NAME VARCHAR(40))

BEGIN

    INSERT INTO ADS (TOPIC,FL_NAME) VALUES (TOPIC,FL_NAME);

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_PLAYLISTS_INS(IN LIST_NAME TEXT,IN ADS BOOLEAN,IN TRACKS INT,IN MIN_AD_RATE INT,IN AD_TRACKS INT)

BEGIN

    INSERT INTO PLAYLISTS (LIST_NAME,ADS,MIN_AD_RATE,TRACKS,AD_TRACKS) VALUES (LIST_NAME,ADS,MIN_AD_RATE,TRACKS,AD_TRACKS);

    SET @ID = LAST_INSERT_ID();

    SET @PL_TAB = CONCAT("PT",@ID);

    SET @AD_TAB = CONCAT("AT",@ID);

    UPDATE PLAYLISTS SET PL_TABLE_NAME = @PL_TAB, AD_TABLE_NAME = @AD_TAB WHERE ID = @ID;

    SET @FIELDS =' (ID INTEGER NOT NULL AUTO_INCREMENT,SONG_ID INTEGER NOT NULL, ';
    
    SET @CONSTRAINTS1 = 'PRIMARY KEY (ID))';

    SET @STM = CONCAT('CREATE TABLE ',@PL_TAB,@FIELDS,@CONSTRAINTS1);
    
    PREPARE STM FROM @STM;

    EXECUTE STM;

    DEALLOCATE PREPARE STM;

    SET @FIELDS2 =' (ID INTEGER NOT NULL AUTO_INCREMENT,AD_ID INTEGER NOT NULL,RATE INTEGER NOT NULL,PLAYBACK TEXT NOT NULL, ';

    SET @CONSTRAINTS2 = 'PRIMARY KEY(ID))';

    SET @STM2 = CONCAT("CREATE TABLE ",@AD_TAB,@FIELDS2,@CONSTRAINTS2);

    PREPARE STM FROM @STM2;

    EXECUTE STM;

    DEALLOCATE PREPARE STM;

    -- PLAYBACK: START, DELAYED, ONCE_S, ONCE_D, NEVER

    SELECT @ID ID;

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_PTX_INS(IN TAB VARCHAR(6),IN SONG_ID INT, IN UPDT BOOLEAN)

BEGIN

    SET @Q = CONCAT('INSERT INTO ',TAB,' (SONG_ID) VALUES (?)'); 

    PREPARE STM FROM @Q;

    SET @S = SONG_ID;

    EXECUTE STM USING @S;

    DEALLOCATE PREPARE STM;   

    SET @GNRES = NULL;

    SET @GROUP = 'SELECT GROUP_CONCAT(DISTINCT GNRE ORDER BY GNRE ASC)';
    
    SET @INTO = ' INTO @GNRES FROM MUSIC ';
    
    SET @IN = CONCAT('WHERE ID IN (SELECT SONG_ID FROM ',TAB,')');

    SET @Q2 = CONCAT(@GROUP,@INTO,@IN);

    PREPARE STM FROM @Q2;

    EXECUTE STM;

    DEALLOCATE PREPARE STM;
    
    
    IF (UPDT = TRUE) THEN

        UPDATE PLAYLISTS SET TRACKS = TRACKS + 1, GNRES = @GNRES  WHERE PL_TABLE_NAME = TAB;
    
    ELSE

        UPDATE PLAYLISTS SET GNRES = @GNRES  WHERE PL_TABLE_NAME = TAB;

    END IF;


END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_ATX_INS(IN TAB VARCHAR(6),IN AD_ID INT,IN RATE INT,IN PLAYBACK TEXT,IN UPDT BOOLEAN)

BEGIN

    SET @Q = CONCAT('INSERT INTO ',TAB,' (AD_ID,RATE,PLAYBACK) VALUES (?,?,?)');

    PREPARE STM FROM @Q;

    SET @AD_ID = AD_ID, @RATE = RATE, @PLAYBACK = PLAYBACK;

    EXECUTE STM USING @AD_ID,@RATE,@PLAYBACK;

    DEALLOCATE PREPARE STM;

     IF (UPDT = TRUE) THEN

        SET @MIN = (SELECT MIN_AD_RATE FROM PLAYLISTS WHERE AD_TABLE_NAME = TAB);

        IF((@RATE < @MIN OR @MIN = 0) AND @RATE > 0) THEN

            UPDATE PLAYLISTS SET MIN_AD_RATE = @RATE,AD_TRACKS = AD_TRACKS + 1 WHERE AD_TABLE_NAME = TAB;
        ELSE
            UPDATE PLAYLISTS SET AD_TRACKS = AD_TRACKS + 1 WHERE AD_TABLE_NAME = TAB;

        END IF;
        
    END IF;

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_TAGS_INS(IN TAG VARCHAR(64),IN LIST_ID INTEGER, IN RANDOM BOOLEAN)

BEGIN

    SET @DATE = CURDATE();

    INSERT INTO TAGS (TAG,LIST_ID,RANDOM,DATE_REG) VALUES (TAG,LIST_ID,RANDOM,@DATE);

END $$

-- UPDATE

#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_ROOMS_UPD(IN IROOM_NAME TEXT,IN IREADER_ID TEXT,IN ISPEAKER_ID TEXT,IN IREADER_NAME TEXT,IN ISPEAKER_NAME TEXT,IN INID INT)

BEGIN

    UPDATE ROOMS SET ROOM_NAME = IROOM_NAME,READER_ID = IREADER_ID,SPEAKER_ID = ISPEAKER_ID,READER_NAME = IREADER_NAME,SPEAKER_NAME = ISPEAKER_NAME
        WHERE ID = INID;

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_MUSIC_UPD(IN ISONG_NAME TEXT,IN IARTIST TEXT, IN IGNRE TEXT,IN IFL_NAME VARCHAR(40),IN INID INT)

BEGIN

    SET @SONG = (SELECT FL_NAME FROM MUSIC WHERE ID = INID);

    IF (@SONG IS NOT NULL) THEN

        UPDATE MUSIC SET SONG_NAME = ISONG_NAME,ARTIST = IARTIST,GNRE = IGNRE,FL_NAME = IFL_NAME
            WHERE ID = INID;

        SELECT @SONG FL_NAME;

    ELSE

        SELECT NULL FL_NAME;
    
    END IF;

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_ADS_UPD(IN ITOPIC TEXT,IN IFL_NAME VARCHAR(40),IN INID INT)

BEGIN

    SET @AD = (SELECT FL_NAME FROM ADS WHERE ID = INID);

    IF (@AD IS NOT NULL) THEN

        UPDATE ADS SET TOPIC = ITOPIC,FL_NAME = IFL_NAME
            WHERE ID = INID;

        SELECT @AD FL_NAME;

    ELSE

        SELECT NULL FL_NAME;
    
    END IF;

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_PLAYLISTS_UPD(IN ILIST_NAME TEXT, IN IADS BOOLEAN,IN INID INT)

BEGIN

    UPDATE PLAYLISTS SET LIST_NAME = ILIST_NAME, ADS = IADS
        WHERE ID = INID;

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_PTX_UPD(IN TAB VARCHAR(6),IN ISONG_ID INT)

BEGIN

    SET @Q = CONCAT('UPDATE ',TAB,' SET SONG_ID = ?'); 

    PREPARE STM FROM @Q;

    SET @ISONG_ID = ISONG_ID;

    EXECUTE STM USING @ISONG_ID;

    DEALLOCATE PREPARE STM;

    SET @GNRES = NULL;

    SET @GROUP = 'SELECT GROUP_CONCAT(DISTINCT GNRE ORDER BY GNRE ASC)';
    
    SET @INTO = ' INTO @GNRES FROM MUSIC ';
    
    SET @IN = CONCAT('WHERE ID IN (SELECT SONG_ID FROM ',TAB,')');

    SET @Q2 = CONCAT(@GROUP,@INTO,@IN);

    PREPARE STM FROM @Q2;

    EXECUTE STM;

    DEALLOCATE PREPARE STM;

    UPDATE PLAYLISTS SET GNRES = @GNRES WHERE PL_TABLE_NAME = TAB;

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_ATX_UPD(IN TAB VARCHAR(6),IN IAD_ID INT,IN IRATE INT,IN IPLAYBACK TEXT)

BEGIN

    SET @Q = CONCAT('UPDATE ',TAB,' SET AD_ID = ?, RATE = ?, PLAYBACK = ?');

    PREPARE STM FROM @Q;

    SET @IAD_ID = IAD_ID, @IRATE = IRATE, @IPLAYBACK = IPLAYBACK;

    EXECUTE STM USING @IAD_ID,@IRATE,@IPLAYBACK;

    DEALLOCATE PREPARE STM;

    SET @MIN = (SELECT MIN_AD_RATE FROM PLAYLISTS WHERE AD_TABLE_NAME = TAB);

    IF((@IRATE < @MIN OR  @MIN = 0) AND @IRATE > 0) THEN

        UPDATE PLAYLISTS SET MIN_AD_RATE = @IRATE WHERE AD_TABLE_NAME = TAB;

    END IF;

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_TAGS_UPD(IN ILIST_ID INTEGER,IN IRANDOM BOOLEAN,IN INID INT)

BEGIN

    UPDATE TAGS SET LIST_ID = ILIST_ID,RANDOM = IRANDOM
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

        SET @ID = INID;

        CREATE TEMPORARY TABLE PTX
        (
            ID INTEGER AUTO_INCREMENT,
            PL_TABLE_NAME TEXT,

            PRIMARY KEY (ID)
        );

        INSERT INTO PTX (PL_TABLE_NAME)
            SELECT PL_TABLE_NAME FROM PLAYLISTS;

        SET @n = (SELECT COUNT(*) FROM PTX);

        SET @i = 1;

        WHILE (@i <= @n) DO

            SET @TAB = (SELECT PL_TABLE_NAME FROM PTX WHERE ID = @i);

            SET @i = @i + 1;

            CALL ss_PTX_DEL_BY_SONG(@TAB,@ID);

        END WHILE;

        DROP TABLE PTX;

        SELECT @SONG FL_NAME;

    ELSE

        SELECT NULL FL_NAME;
    
    END IF;

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_ADS_DEL(IN INID INT)

BEGIN

    SET @AD = (SELECT FL_NAME FROM ADS WHERE ID = INID);

    IF (@AD IS NOT NULL) THEN 

        DELETE FROM ADS WHERE ID = INID;

        SELECT @AD FL_NAME;

    ELSE

        SELECT NULL FL_NAME;
    
    END IF;

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_PLAYLISTS_DEL(IN INID INT)

BEGIN

    DELETE FROM PLAYLISTS WHERE ID = INID;

    SET @PL_TABLE = CONCAT("PT",INID);

    SET @AD_TABLE = CONCAT("AT",INID);

    SET @STM = CONCAT("DROP TABLE ",@PL_TABLE);
    SET @STM2 = CONCAT("DROP TABLE ",@AD_TABLE);

    PREPARE STM FROM @STM;

    EXECUTE STM;

    DEALLOCATE PREPARE STM;

    PREPARE STM FROM @STM2;

    EXECUTE STM;

    DEALLOCATE PREPARE STM;

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_PTX_DEL(IN TAB VARCHAR(6),IN INID INT)

BEGIN

    SET @ID = INID;
    
    SET @C1 = 0;

    SET @Q1 = CONCAT('SELECT COUNT(*) INTO @C1 FROM ',TAB);

    PREPARE STM FROM @Q1;

    EXECUTE STM;

    DEALLOCATE PREPARE STM;

    SET @DEL = CONCAT('DELETE FROM ',TAB);

    SET @Q2 = @DEL;

    IF (@ID <> 0) THEN
    
        SET @Q2 = CONCAT(@DEL, ' WHERE ID = ?'); 

    END IF;

    PREPARE STM FROM @Q2;

    IF (@ID <> 0) THEN
    
        EXECUTE STM USING @ID;
    
    ELSE

        EXECUTE STM;
    
    END IF;

    DEALLOCATE PREPARE STM; 

    SET @C2 = @C1;

    SET @Q3 = CONCAT('SELECT COUNT(*) INTO @C2 FROM ',TAB);

    PREPARE STM FROM @Q3;

    EXECUTE STM;

    DEALLOCATE PREPARE STM;

    SET @CHANGES = @C1 - @C2;
    
    IF(@CHANGES > 0) THEN

        SET @GNRES = NULL;

        SET @GROUP = 'SELECT GROUP_CONCAT(DISTINCT GNRE ORDER BY GNRE ASC)';
        
        SET @INTO = ' INTO @GNRES FROM MUSIC ';
        
        SET @IN = CONCAT('WHERE ID IN (SELECT SONG_ID FROM ',TAB,')');

        SET @Q4 = CONCAT(@GROUP,@INTO,@IN);

        PREPARE STM FROM @Q4;

        EXECUTE STM;

        DEALLOCATE PREPARE STM;

        SET @TRACKS = @C1 - @CHANGES;

        UPDATE PLAYLISTS SET TRACKS = @TRACKS, GNRES = @GNRES WHERE PL_TABLE_NAME = TAB;
    
    END IF;

    SELECT @CHANGES affectedRows;

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_PTX_DEL_BY_SONG(IN TAB TEXT, IN INID INTEGER)

BEGIN

        SET @X = 0;

        SET @ID = INID;

        SET @Q1 = CONCAT('SELECT COUNT(*) INTO @X FROM ',TAB,' WHERE SONG_ID = ?');

        PREPARE STM FROM @Q1;

        EXECUTE STM USING @ID;

        DEALLOCATE PREPARE STM;

        IF (@X > 0) THEN

            SET @Q2 = CONCAT('DELETE FROM ',TAB,' WHERE SONG_ID = ?');

            PREPARE STM FROM @Q2;         
            
            EXECUTE STM USING @ID;

            DEALLOCATE PREPARE STM;
            
            SET @GNRES = NULL;

            SET @GROUP = 'SELECT GROUP_CONCAT(DISTINCT GNRE ORDER BY GNRE ASC)';
            
            SET @INTO = ' INTO @GNRES FROM MUSIC ';
            
            SET @IN = CONCAT('WHERE ID IN (SELECT SONG_ID FROM ',TAB,')');

            SET @Q3 = CONCAT(@GROUP,@INTO,@IN);

            PREPARE STM FROM @Q3;

            EXECUTE STM;

            DEALLOCATE PREPARE STM;

            UPDATE PLAYLISTS SET TRACKS = TRACKS - 1, GNRES = @GNRES WHERE PL_TABLE_NAME = TAB;
        
        END IF;

END $$
#-----------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ss_ATX_DEL(IN TAB VARCHAR(6),IN INID INT)

BEGIN

    SET @R1 = NULL; 
    
    SET @ID = INID;

    SET @Q1 = CONCAT('SELECT RATE INTO @R1 FROM ',TAB,' WHERE ID = ?');

    PREPARE STM FROM @Q1; EXECUTE STM USING @ID; DEALLOCATE PREPARE STM;

    SET @Q2 = CONCAT('DELETE FROM ',TAB,' WHERE ID = ?');

    PREPARE STM FROM @Q2; EXECUTE STM USING @ID; DEALLOCATE PREPARE STM;
    
    SET @MIN = NULL;

    SELECT MIN_AD_RATE INTO @MIN FROM PLAYLISTS WHERE AD_TABLE_NAME = TAB;
    
    IF (@R1 = @MIN) THEN

        SET @R2 = NULL;

        SET @Q3 = CONCAT('SELECT RATE INTO @R2 FROM ',TAB,' ORDER BY RATE ASC LIMIT 1');
        
        PREPARE STM FROM @Q3; EXECUTE STM USING @ID; DEALLOCATE PREPARE STM;

        IF((@R2 < @MIN OR @MIN = 0) AND @R2 > 0) THEN
            
            UPDATE PLAYLISTS SET MIN_AD_RATE = @R2,AD_TRACKS = AD_TRACKS - 1 WHERE AD_TABLE_NAME = TAB;
        
        ELSE

            UPDATE PLAYLISTS SET AD_TRACKS = AD_TRACKS - 1 WHERE AD_TABLE_NAME = TAB;
            
        END IF;

    ELSE

      UPDATE PLAYLISTS SET AD_TRACKS = AD_TRACKS - 1 WHERE AD_TABLE_NAME = TAB;
            
    END IF; 

END $$
#-----------------------------------------------------------------------------------------------------------------

CREATE PROCEDURE ss_TAGS_DEL(IN INID INT)

BEGIN

    DELETE FROM TAGS WHERE ID = INID;

END $$

DELIMITER ;

#-------------------------------------------------CREDENTIALS-------------------------------------------------------------

CREATE USER IF NOT EXISTS 'orbittas'@'localhost' IDENTIFIED WITH mysql_native_password BY 'P4s5w0rd++';

CREATE USER IF NOT EXISTS 'super_orbittas'@'localhost' IDENTIFIED WITH mysql_native_password BY 'P4s5w0rd2++';

GRANT ALL PRIVILEGES ON STREAMING_SERVER.* TO 'super_orbittas'@'localhost';

GRANT ALL PRIVILEGES ON STREAMING_SERVER.* TO 'orbittas'@'localhost';

FLUSH PRIVILEGES;

UPDATE mysql.user SET Super_Priv='Y' WHERE user='super_orbittas' AND host='localhost';

FLUSH PRIVILEGES;

SHOW VARIABLES LIKE 'validate_password%';