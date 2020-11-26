/*FIRST TIME USE SQL SCRIPT*/

CREATE DATABASE STREAMING_SERVER;

USE STREAMING_SERVER;

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
    FL_NAME TEXT NOT NULL,

	PRIMARY KEY (ID)
);

CREATE TABLE TAGS 
(
	ID INTEGER NOT NULL AUTO_INCREMENT,
    TAG TEXT NOT NULL,
    SONG_ID INTEGER NOT NULL,

	PRIMARY KEY (ID),

    CONSTRAINT FK_SONG
        FOREIGN KEY (SONG_ID)
        REFERENCES MUSIC (ID)
        ON DELETE CASCADE
);

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

CREATE USER 'orbittas'@'localhost' IDENTIFIED WITH mysql_native_password BY 'P4s5w0rd++';

GRANT ALL PRIVILEGES ON STREAMING_SERVER.* TO 'orbittas'@'localhost';

FLUSH PRIVILEGES;

SHOW VARIABLES LIKE 'validate_password%';
