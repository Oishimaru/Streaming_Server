/*******************************************************************************
********************************************************************************
*                             STREAMING SERVER                                 *
********************************************************************************
*******************************************************************************/

/*******************************************************************************
                           STREAMING: HTTP SOCKTES
*******************************************************************************/

/**********************************MODULES*************************************/
const http = require('http');

const express = require('express');

const throttle = require('express-throttle-bandwidth');

const { createHttpTerminator } = require('http-terminator')

const core = require('./Modules/media-core.js');

/*************************VARIABLES AND INSTANCES*****************************/

var port = [3400,3401,3402,3403,3404,3405,3406,3407,3408,3409,3410];

const uport = 8081;

var app  = [];

var server = [];

var  httpTerminator = [];

var play = [];

var timer = [];

var subtimer = [];

/*********************************FUNCTIONS***********************************/

function createServer(i)
{
    app[i] = express();

    app[i].use(throttle(262144)); //256 kbps?

    server[i] = app[i].listen(port[i], (err) =>
    {
        if(err)
            console.log(err);

        console.log("Creating Socket: Listening on port " + port[i] + ".");
    });
    
    httpTerminator[i] = createHttpTerminator({ server: server[i] });

    app[i].get('/audio/:reg/:file/',core.audioMedia);

    app[i].get('*',core.routeError); 
}

/*******************************INITIALIZATION********************************/

console.log("HTTP Socket Creation...");

try
{
    for(let k = 0; k <= 10; k++)
        createServer(k);

    console.log("All sockets created succesfully.");
}
catch(error)
{
    console.log("An error has ocurred: ");

    console.log(error);
}


/*******************************************************************************
                              MQTT BROKER (AEDES)
*******************************************************************************/

/**********************************MODULES*************************************/

const aedes = require('aedes')();

const broker = require('net').createServer(aedes.handle);

const ws = require('websocket-stream');

const httpServer = require('http').createServer();

/*************************VARIABLES AND INSTANCES*****************************/

var nsport = 3000;

var wsPort = 5000;

/*******************************INITIALIZATION********************************/

/*NET.SOCKET ENTRY*/

broker.listen(nsport, () =>
{
	console.log('server listening on port', port);
});

/*WEBSOCKET SERVER*/

ws.createServer({ server: httpServer }, aedes.handle);

httpServer.listen(wsPort,  () =>
{
    console.log('Aedes MQTT-WS listening on port: ' + wsPort);
    aedes.publish({ topic: 'aedes/hello', payload: "I'm broker " + aedes.id });
});

/*******************************************************************************
                             MQTT SERVER CLIENT
*******************************************************************************/
/**********************************MODULES*************************************/

const mqtt = require("mqtt");

const fs = require('fs');

const util = require('util');

const randomToken = require('random-token').create('abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');

const SQL = require('./Modules/SQL.js');

const { createInterface } = require('readline');
const { setgroups } = require('process');


/*************************VARIABLES AND INSTANCES*****************************/

const client = mqtt.connect("mqtt://localhost:3000");

/**********************************MODULES*************************************/

const incoming  = [
                    "READER/INFO",
                    "SPEAKER/INFO",
                    "APP/INFO",
                    "REGISTER/INFO",
                    "APP/CREDENTIALS",
                    "APP/GET",
                    "APP/POST",
                    "APP/UPDATE",
                    "APP/DELETE",
                    "READER/",
                    "SPEAKER/"
                  ];

const outgoing = [
                    "SERVER/POLL",
                    "SERVER/INFO",
                    "SERVER/",
                    "SERVER/AUTHORIZE",
                    "SERVER/RESPONSE"
                 ];

var dataStream_R = [];
var dataStream_S = [];

var TOKEN = "";

/*********************************FUNCTIONS***********************************/

async function  getCredentials()
{
    let readFile = util.promisify(fs.readFile);

    let writeFile = util.promisify(fs.writeFile);

    let exists = util.promisify(fs.access);
    
    let filename = "credentials.txt";
    
    let info;

    let e;

    try
    {
        await exists(filename, fs.constants.F_OK); 

        e = true;
        
    }
    catch(error)
    {
        console.log(error);

        e = false;
    }
    
    
    console.log("File Exists: " + e);

    if(e)
        info = (await readFile(filename)).toString();
    else
    {
        console.log("Attemting to create " + filename + " with default credentials.");

        
        let data = {"USER":"APP","PASS":"0R81TT45"};

        data = JSON.stringify(data);

        try
        {
            await writeFile(filename,data);

            console.log(filename + " succesfully created.")
        }
        catch(error)
        {
            console.log(error);
        }

        info = data;
    }
    
    let output = JSON.parse(info.toString());
    process.stdout.write("Stored Credentials: ");

    console.log(output);

    return output;   
}

async function setCredentials(USER,PASS)
{
    let writeFile = util.promisify(fs.writeFile);
    
    let filename = "credentials.txt";

    let output;

    let data = {USER,PASS};

    output = data;

    data = JSON.stringify(data);

    try
    {
        await writeFile(filename,data);

        process.stdout.write("New Credentials Set: ");
        
        console.log(output);

        output = {"STATUS":"SUCCESS"};
    }
    catch(error)
    {
        console.log(error);

        console.log('Unable to set new credentials.')
        
        output = {"STATUS":"FAILURE"};
    }
   
    return output;
}

function newSubscription(device,id)
{
    
    if(device == "READER")
        device = incoming[9] + id;
    else if(device == "SPEAKER")
        device = incoming[10] + id;

    client.subscribe(device, (error,granted) => 
    {
        if(error)
            console.log(error);
        else if(granted)
            console.log(granted);
    });

}

/******************************EVENT HANDLING********************************/

/*ON CONNECTION*/

client.on("connect", (ack) => 
{
    console.log(ack + ": Connected to broker on port " + nsport + ".");

    console.log("Subscribing to topics...");

    for(let k = 0; k <= 8; k++)
    {
        client.subscribe(incoming[k], (error,granted) => 
        {
            if(error)
                console.log(error);
            else if(granted)
                console.log(granted);
        });
    }

});
  

/*MESSAGE HANDLING*/

client.on("message", (topic, message) => 
{
    console.log(topic.toString() + ": " + message.toString());

    let ID = topic.split('/');

    let data = JSON.parse(message);
    
    if(ID[1] == "INFO")
    {
        switch(ID[0])
        {
            case "READER":
            {
                data.TYPE = "READER";

                dataStream_R.push(data);

                break;
            }

            case "SPEAKER":
            {
                data.TYPE = "SPEAKER";

                dataStream_S.push(data);

                break;
            }

            case "REGISTER":
            {
                client.publish(outgoing[1],data);

                break;
            }

            case "APP":
            {
                dataStream_R = [];
                dataStream_S = [];
                
                client.publish(outgoing[0],{"REQUEST":"INFO"});

                setTimeout(client.publish(outgoing[1], dataStream_R.concat(dataStream_S)),5000);
                
                break;
            }
        }
    }
    else if(ID[0] == "APP")
    {
        switch(ID[1])
        {
            case "GET":
            {
                if(TOKEN && data.TOKEN == TOKEN)
                {
                    let Q = SQL.SEL("*", data.TARGET, data.FIELD1);

                    if(Q[0] && !Q.STATUS)
                    {
                        for(let k = 0; k < Q.length(); k++)
                            Q[k] = {"STATUS":"SUCCESS"};
                    }

                    client.publish(outgoing[4],Q);
                }
                else
                    client.publish(outgoing[4],{"STATUS":"LOGIN"});

                break;
            }

            case "POST":
            {
                
                if(TOKEN && data.TOKEN == TOKEN)
                {
                    let Q = SQL.INS(data.TARGET, data);

                    if(!Q.STATUS)
                    {
                        Q = {"STATUS":"SUCCESS"};
    
                        newSubscription("READER",data.FIELD2);
    
                        newSubscription("SPEAKER",data.FIELD3);
                    }
    
                    client.publish(outgoing[4],Q);
                }
                else
                    client.publish(outgoing[4],{"STATUS":"LOGIN"});
                
                
                break;
            }

            case "UPDATE":
            {
                if(TOKEN && data.TOKEN == TOKEN)
                {
                    let Q = SQL.UPDT(data.TARGET, data);

                    if(!Q.STATUS)
                    {
                        Q = {"STATUS":"SUCCESS"};
                    }
    
                    client.publish(outgoing[4],Q);
                }
                else
                    client.publish(outgoing[4],{"STATUS":"LOGIN"});

               
                break;
            }

            case "DELETE":
            {
                if(TOKEN && data.TOKEN == TOKEN)
                {  
                    let Q = SQL.DEL(data.TARGET, data.FIELD1);

                    if(!Q.STATUS)
                    {
                        Q = {"STATUS":"SUCCESS"};
                    }

                    client.publish(outgoing[4],Q);
                }
                else
                    client.publish(outgoing[4],{"STATUS":"LOGIN"});


                break;
            }

            case "CREDENTIALS":
            {
                
                setImmediate( async () =>
                {
                    let credentials = await getCredentials();

                    console.log(credentials);
                
                    if(data.NEW == "NO")
                    {
                        if(credentials.USER == data.USER && credentials.PASS == data.PASS)
                        {
                            TOKEN = randomToken(16);

                            var response = {"STATUS":"SUCCESS",TOKEN};

                            response = JSON.stringify(response);

                            console.log(response);

                            client.publish(outgoing[3],response);
                        }
                        else
                        {
                            var response = {"STATUS":"INVALID"};

                            response = JSON.stringify(response);

                            console.log(response);

                            client.publish(outgoing[3],response);
                        }
                    }
                    else
                    {
                        if(TOKEN && data.TOKEN == TOKEN)
                        {
                            let response = await setCredentials(data.USER,data.PASS);                            
                            
                            if(response.STATUS == "SUCCESS")
                            {
                                TOKEN = randomToken(16);

                                response.TOKEN = TOKEN;
                            }

                            response = JSON.stringify(response);

                            console.log(response);

                            client.publish(outgoing[3],response);
                        }
                        else
                        {
                            var response = {"STATUS":"LOGIN"};

                            console.log(response);

                            response = JSON.stringify(response);

                            client.publish(outgoing[3],response);
                        }
                    }   
                });

            }
        }

    }
    else if(ID[0] == "READER")
    {
        let baseURL = "http://sdrorbittas.sytes.net:";

        let READER_ID =  ID[1];

        let Q = SQL.SEL("*","ROOMS WHERE READER_ID = '" + READER_ID + "'","");

        let SPEAKER_ID = Q[0].SPEAKER_ID;

        let index = Q[0].PORT_ID;

        let ACTION = data.ACTION;

        let URL;

        if(ACTION ==  "START")
        {
            let TAG = data.TAG;

            let Q1 = SQL.SEL("*","TAGS",TAG);

            let Q2;
    
            let file = "";
   
            baseURL += port[index].toString() + "/audio";
    
            if(Q1[0] && !Q1.STATUS)
            {
                let SONG_ID = Q1[0].SONG_ID;
    
                Q2 = SQL.SEL("*","MUSIC",SONG_ID);
            }
            
            if(Q2[0] && !Q2.STATUS)
                file = Q2[0].FL_NAME;

            if(file)
                URL = baseURL + "/1/" + file;
            else
                URL = baseURL + "/0/default.mp3";

            URL = encodeURI(URL);

            client.publish(outgoing[2] + SPEAKER_ID,{ACTION,URL});

            play[index] = setTimeout(client.publish(outgoing[2] + SPEAKER_ID,{ACTION,URL}),2000);
        }
        else if(ACTION == "STOP")
        {
            client.publish(outgoing[2] + SPEAKER_ID, data);

            timer[index] = setTimeout( () =>
            {
                httpTerminator[index].terminate();

                subtimer[index] = setTimeout(createServer(index),5000);
            
            },2000);
        }

    }
    else if(ID[0] ==  "SPEAKER")
    {
        let SPEAKER_ID =  ID[1];

        let Q = SQL.SEL("*","ROOMS WHERE SPEAKER_ID = '" + SPEAKER_ID + "'","");

        let index = Q[0].PORT_ID;

        switch(data.STATUS)
        {
            case "PLAYING":
            {
                clearTimeout(play[index]);
            }

            case "OK":
            {
                clearTimeout(timer[index]); 
            }

            case "DC":
            {
                clearTimeout(subtimer[index]);

                createServer(index);
            }
        }
    }
    else
    {
        console.log("Wait wa");
    }

});

/*ERROR DISPLAY*/

client.on("error", (err) => 
{
    console.log(err);
});