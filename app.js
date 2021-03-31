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

const fs = require('fs');

const util = require('util');

const throttle = require('express-throttle-bandwidth');

const { createHttpTerminator } = require('http-terminator')

const core = require('./Modules/media-core.js');

/*************************VARIABLES AND INSTANCES*****************************/

var port = [3400,3401,3402,3403,3404,3405,3406,3407,3408,3409,3410];

var apport = 8080;

var app  = [];

var listener;

var server = [];

var serv;

var  httpTerminator = [];

var termination = [];

var play = [];

var timer = [];

var subtimer = [];

var readiness = 0;

/*********************************FUNCTIONS***********************************/

async function errorLog(prefix,error,num)
{
    let exists = util.promisify(fs.access);
    
    let writeFile = util.promisify(fs.writeFile);
    
    let timeStamp = Date().toString();

    let folder = "./logs/"

    let file = "error";

    let sufix = ".txt";

    let n = 0;

    let f;

    let x = true;

    console.log("An error has ocurred. \n\r");
    console.log("logging...\n\r");

    if(prefix)
      f = folder + prefix + "-" + file + num.toString() + sufix;
    else 
      f = folder + file + num.toString() + sufix;

    while(x)
    {
        try
        {
            if(n > 0)
            {
              if(prefix)
                f = folder + prefix + "-" + file + num.toString() + "(" + n.toString() + ")" + sufix;
              else 
                f = folder + file + num.toString() + "(" + n.toString() + ")" + sufix;
            }

            await exists(f,fs.constants.F_OK);

            n++;

            console.log(n.toString() + ") " + f + " exists.");
        }
        catch
        {
            try
            {
                let info = "Date: " + timeStamp + "\n\r\n\r";

                info += error.toString(); 

                console.log(info);

                console.log("");

                await writeFile(f,info);

                console.log(n.toString() + ") " + f + " saved.");
            }
            catch(e)
            {
                console.log(e);
            }
            finally
            {
                x = false;
            }            
        }
    }
}


function rainCheck(i)
{
    readiness+=i;

    process.stdout.write("Readinesms Check: ");
    console.log(readiness);

    if(readiness >= 7)
    {
        console.log("Server is up!"); //set off alarm
    }
}

function hash(print,symbol)
{
    console.log("\x1b[35m\x1b[1m");

    for(let k = 0; k < 99; k++)
    {
        process.stdout.write(symbol);
    }
    console.log(symbol);
    
    console.log();

    console.log(print);

    console.log();

    for(let k = 0; k < 99; k++)
    {
        process.stdout.write(symbol);
    }
   
    console.log(symbol);

    console.log("\x1b[0m");
}

async function createServer(i)
{
    app[i] = express();

    app[i].use(throttle(262144)); //256 kbps?

    server[i] = app[i].listen(port[i], (error) => 
    {
        
        if(error)
            errorLog("",error,0); //error0

        console.log("Creating Socket: Listening on port " + port[i] + ".");
    });
    
    httpTerminator[i] = createHttpTerminator({ server: server[i] });

    termination[i] = false;

    app[i].get('/audio/:reg/:file/',core.audioMedia);

    app[i].get('/audio/:reg/:file/0/',core.audioMedia);

    app[i].get('/playlist/:id/:audio/:track/',core.playlist);
    
    app[i].get('*',core.routeError); 
}

async function createServers(n)
{
    listener = express();

    serv = listener.listen(apport, (error) => 
    { 
        hash("STREAMING: HTTP SOCKTES","*");
    
        console.log("HTTP Socket Creation...");
        
        if(error)
            errorLog("",error,0); //error0

        console.log("Creating Socket: Listening on port " + apport + ".");
    });

    listener.get('/audio/:reg/:file/',(req,res) => 
    {
        //let T = JSON.parse(JSON.stringify(req.body));
        
        if (true)//(TOKEN && T == TOKEN)
            core.audioMedia(req,res);
        else if (!TOKEN)
        {
            res.status(500).send({STATUS:"LOGIN"});
        }
        else
        {
            res.status(500).send({STATUS:"INVALID"});
        }
    });

    listener.get('*',core.routeError); 

    for(let k = 0; k <= n; k++)
    {
        createServer(k);
    }       
}
/*******************************INITIALIZATION********************************/

try
{
    setImmediate(async () =>
    {
        await  createServers(10);

        rainCheck(1);

        console.log("All sockets created succesfully.");
    });

}
catch(error) //1
{
   errorLog("",error,1);
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
    hash("MQTT BROKER (AEDES)","*");

    console.log('Aedes (MQTT netSocket) listening on port ', nsport);
    
    rainCheck(1);
});


/*WEBSOCKET SERVER*/

ws.createServer({ server: httpServer }, aedes.handle);

httpServer.listen(wsPort,  () =>
{
    console.log('Aedes (MQTT Web-socket) listening on port: ' + wsPort);
    aedes.publish({ topic: 'aedes/hello', payload: "I'm da broker " + aedes.id });

    rainCheck(1);
});


/***********************************EVENTS*************************************/

aedes.on("clientError", (client,error) =>
{   
    let errorHeader = "An error has occurred with client " +  client.id + ".";
    
    let errorMessage = errorHeader + "\n\r" + error.toString();
    
    console.log(errorMessage);

    errorLog("broker",errorMessage,1); //broker-error1
});

aedes.on("clientDisconnect", (client) =>
{   
    let errorHeader = "Client " +  client.id + " has disconnected.";
    
    let errorMessage = errorHeader;
    
    console.log(errorMessage);

    errorLog("broker",errorMessage,2); //broker-error2
});

aedes.on("connectionError", (client,error) =>
{   
    let errorHeader = "Client " +  client.id + " failed to connect.";
    
    let errorMessage = errorHeader + "\n\r" + error.toString();
    
    console.log(errorMessage);

    errorLog("broker",errorMessage,3); //broker-error3
});

aedes.on("keepaliveTimeout", (client) =>
{   
    let errorHeader = "Client " +  client.id + " unable to stay alive.";
    
    let errorMessage = errorHeader;
    
    console.log(errorMessage);

    errorLog("broker",errorMessage,4); //broker-error4
});

/*******************************************************************************
                             MQTT SERVER CLIENT
*******************************************************************************/
/**********************************MODULES*************************************/

const mqtt = require("mqtt");

const randomToken = require('random-token').create('abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');

const disk = require('./Modules/disk.js');

const SQL = require('./Modules/SQL.js');

const { createInterface } = require('readline');
const { setgroups } = require('process');


/*************************VARIABLES AND INSTANCES*****************************/

const client = mqtt.connect("mqtt://localhost:3000");

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
                    "APP/DEFAULT",
                    "READER/",
                    "SPEAKER/",
                    "TEST/INIT",
                    "APP/STORAGE_INFO"
                  ];

const outgoing = [
                    "SERVER/POLL",
                    "SERVER/INFO",
                    "SERVER/",
                    "SERVER/AUTHORIZE",
                    "SERVER/RESPONSE",
                    "TEST/RESPONSE"
                 ];

var info = false, block = false;

var dataStream_R = [];
var dataStream_S = [];

var def = -1;

var loaded = false;

var TOKEN = "";

/*********************************FUNCTIONS***********************************/

async function  loadFile(filename)
{
    let readFile = util.promisify(fs.readFile);

    let writeFile = util.promisify(fs.writeFile);

    let exists = util.promisify(fs.access);
    
    let info = null;

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

        process.stdout.write("Attempting to create " + filename); 
        
        let data;

        if(filename == "credentials.txt")
        {
            console.log(" with default credentials.");

            data = {"USER":"APP","PASS":"0R81TT45"};
        }    
        else if(filename == "default.txt")
        {
            console.log(" with default song id.");

            data = {"ID":-1};
        }        

        data = JSON.stringify(data);

        try
        {
            await writeFile(filename,data);

            console.log(filename + " succesfully created.");

            info = data;

        }
        catch(error) //2
        {
           errorLog("",error,2);
        }
    }
    
    let output = null;

    if(info)
    {
        output = JSON.parse(info.toString());
        
        if(filename == "credentials.txt")
            process.stdout.write("Stored Credentials: ");
        else if(filename == "default.txt")
            process.stdout.write("Stored Default: ");

        console.log(output);
    }
   
    return output;   
}

async function setDefaultList(ID)
{
    let writeFile = util.promisify(fs.writeFile);
    
    let filename = "default.txt";

    let output;

    let data = {ID};

    console.log(data);

    try
    {
        let info = JSON.stringify(data);

        await writeFile(filename,info);

        process.stdout.write("Default Song ID set: ");
        
        def = data.ID; 

        console.log(data);

        output = {"STATUS":"SUCCESS"};
    }
    catch(error) //error31
    {
        errorLog("",error,31);

        console.log('Unable to set new song ID.')
        
        output = {"STATUS":"FAILURE"};
    }
   
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
    catch(error) //error3
    {
        errorLog("",error,3);

        console.log('Unable to set new credentials.')
        
        output = {"STATUS":"FAILURE"};
    }
   
    return output;
}

function newSubscription(device,id)
{
    
    if(device == "READER")
        device = incoming[10] + id;
    else if(device == "SPEAKER")
        device = incoming[11] + id;

    client.subscribe(device, (error,granted) => 
    {
        if(error) //error4
            errorLog("",error,4);
        else if(granted)
            console.log(granted);
    });

}

async function initSubs()
{
    let tab = await SQL.SEL("*","ROOMS","","",false);

    let len = Object.keys(tab).length;

    if(!len)
    {
        console.log("No Rooms Registered");

        rainCheck(2);
    }
       

    console.log("Connected to broker on port " + nsport + ".");

    console.log("Subscribing to topics...");

    for(let k = 0; k < incoming.length; k++)
    {
        client.subscribe(incoming[k], (error,granted) => 
        {
            if(error) //error5
                errorLog("",error,5)
            else if(granted)
            {
                console.log(granted);

                if(k >= (incoming.length - 1))
                    rainCheck(1);
            }
                
        });
    }

    let SPEAKER_ID;

    let READER_ID;

    for(let l = 0; l < len; l++)
    {
        SPEAKER_ID = tab[l].SPEAKER_ID;
            
        READER_ID = tab[l].READER_ID;

        client.subscribe("SPEAKER/" + SPEAKER_ID, (error,granted) => 
        {
            if(error) //error6
                errorLog("",error,6);
            else if(granted) 
            {
                console.log(granted);
                
                if(l >= (len - 1))
                    rainCheck(1);
            }
          
        });

        client.subscribe("READER/" + READER_ID, (error,granted) => 
        {
            if(error) //error7
                errorLog("",error,7);
            else if(granted)
            {
                console.log(granted);
                
                if(l >= (len - 1))
                    rainCheck(1);
            }
        });

    }

}
/******************************EVENT HANDLING********************************/

/*ON CONNECTION*/

client.on("connect", (ack) => 
{
    setImmediate(async () =>
    {
        hash("MQTT CLIENT","*");

        await initSubs();
    });    

});
  

/*MESSAGE HANDLING*/

client.on("message", (topic, message) => 
{
    console.log(topic.toString() + ": " + message.toString());

    let ID = topic.split('/');

    let log;

    let data;
    
    try
    {
        data = JSON.parse(message);
    }
    catch(error) //error8
    {
        errorLog("",error,8);
    }
    
    
    if(ID[1] == "INFO")
    {
        switch(ID[0])
        {
            case "READER":
            {
                if(info)
                {
                    data.TYPE = "READER";

                    dataStream_R.push(data);
            
                }

                break;
            }

            case "SPEAKER":
            {
                if(info)
                {
                    data.TYPE = "SPEAKER";

                    dataStream_S.push(data);
                }
              
                break;
            }

            case "REGISTER":
            {
                client.publish(outgoing[1],message);

                break;
            }

            case "APP":
            {
                if(!block)
                {
                    block = true;

                    setImmediate( async () => 
                    {
                        log = await SQL.SEL("*","ROOMS","","",false);
                        
                        info = true;

                        dataStream_R = [];
                        dataStream_S = [];
    
                        /*
                        dataStream_R = [
                                            {"NAME":"RD1","CHIP_ID":"B33P","TYPE":"READER"},
                                            {"NAME":"RD2","CHIP_ID":"M33P","TYPE":"READER"},
                                            {"NAME":"RD3","CHIP_ID":"BL33P","TYPE":"READER"}
                                       ];
    
                        dataStream_S = [
                                            {"NAME":"SP1","CHIP_ID":"B00P","TYPE":"SPEAKER"},
                                            {"NAME":"SP2","CHIP_ID":"M00P","TYPE":"SPEAKER"},
                                            {"NAME":"SP3","CHIP_ID":"BL00P","TYPE":"SPEAKER"}
                                       ];
                        */

                        client.publish(outgoing[0],JSON.stringify({"REQUEST":"INFO"}));
    
                        setTimeout(() =>
                        {
                            info = false;

                            if(!log.STATUS)
                            {
                                let len = Object.keys(log).length;
                                
                                let responsiveness = [];

                                console.log("Checking...");
                                process.stdout.write("Number of rooms: ");
                                console.log(len);
                                
                                let rlen = Object.keys(dataStream_R).length;

                                let reg = false;          

                                for(let j = 0; j < rlen; j++)
                                {   
                                    let done = false;
                                    
                                    for(let i = 0; i < len; i++)
                                    {
                                        if(!reg)
                                        {
                                            let reader = {};
                                            reader.NAME = log[i].READER_NAME;
                                            reader.ID = log[i].READER_ID;
                                            reader.RE = false;

                                            responsiveness.push(reader);

                                            let speaker = {};
                                            speaker.NAME = log[i].SPEAKER_NAME;
                                            speaker.ID = log[i].SPEAKER_ID;
                                            speaker.RE = false;

                                            responsiveness.push(speaker);

                                            if(i == (len -1))
                                                reg = true;
                                        }
                                        
                                        if(!done && dataStream_R[j].CHIP_ID == log[i].READER_ID) 
                                        {
                                            dataStream_R[j].STATUS = "ASSIGNED";
                                            dataStream_R[j].ROOM = log[i].ROOM_NAME;

                                            responsiveness[i*2].RE = true;

                                            done = true;
                                        }                   
                                    }

                                    if(!done)
                                        dataStream_R[j].STATUS = "UNASSIGNED"; 
                                }

                                if(rlen == 0)
                                {
                                    for(let i = 0; i< len; i++)
                                    {
                                        let reader = {};
                                        reader.NAME = log[i].READER_NAME;
                                        reader.ID = log[i].READER_ID;
                                        reader.RE = false;

                                        responsiveness.push(reader);

                                        let speaker = {};
                                        speaker.NAME = log[i].SPEAKER_NAME;
                                        speaker.ID = log[i].SPEAKER_ID;
                                        speaker.RE = false;

                                        responsiveness.push(speaker);
                                    }
                                }
    
                                for(let j = 0; j < Object.keys(dataStream_S).length;j++)
                                {
                                    let done = false;

                                    for(let i = 0; i < len; i++)
                                    {
                                        if(dataStream_S[j].CHIP_ID == log[i].SPEAKER_ID)
                                        {
                                            dataStream_S[j].STATUS = "ASSIGNED";
                                            
                                            dataStream_S[j].ROOM = log[i].ROOM_NAME;

                                            responsiveness[i*2 + 1].RE = true;
                                            
                                            done = true;
                                            
                                            break;
                                        }           
                                    }

                                    if(!done)
                                        dataStream_S[j].STATUS = "UNASSIGNED"; 
                                }

                                for(let k = 0; k < Object.keys(responsiveness).length; k++)
                                {
                                    if(responsiveness[k].RE == false)
                                    {
                                        let NAME = responsiveness[k].NAME;
                                        let CHIP_ID = responsiveness[k].ID;
                                
                                        if(k%2 == 0)
                                        {                                        
                                            let reader = {NAME,CHIP_ID,TYPE:"READER",STATUS:"UNRESPONSIVE"};

                                            dataStream_R.push(reader);
                                        }
                                        else
                                        {                                        
                                            let speaker = {CHIP_ID,NAME,TYPE:"SPEAKER",STATUS:"UNRESPONSIVE"};

                                            dataStream_S.push(speaker);
                                        }
                                    }
                                }                    
                            }

                            let conc = dataStream_R.concat(dataStream_S);
                            
                            let ST;
                            
                            if(log.STATUS)
                                ST = "\"STATUS\":\"DATABASE ERROR\",\"MESSAGE\":" + JSON.stringify(log);
                            else if(conc[0])
                                ST = "\"STATUS\":\"SUCCESS\"";
                            else
                                ST = "\"STATUS\":\"EMPTY\"";
                                
                            let response = "{\"DEVICES\":" + JSON.stringify(conc) + "," + ST + "}";
                   
                            client.publish(outgoing[1],response);
                        
                            block = false;

                        },5000);
                
                    });  
                    
                }
                /*else
                    client.publish(outgoing[1],"{\"STATUS\":\"WAIT\"}");*/
               

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
                setImmediate( async () =>
                {
                    console.log(TOKEN);
                    console.log(data.TOKEN);

                    if(TOKEN && data.TOKEN == TOKEN)
                    {
                        let aux = data.FIELD1,param = "ID",str = false;

                        if(data.TARGET == "TAGS")
                        {
                            if(data.FIELD2)
                            {
                                aux = data.FIELD2;

                                param = "SONG_ID";
                            }
                            else if (data.FIELD1)
                            {
                                param = "TAG";
                                str = true;
                            }  
                    
                        }

                        let Q = await SQL.SEL("*", data.TARGET,param,aux,str);
                        
                        let ST = "";

                        if(!Q.STATUS)
                        {  
                            if(Q[0])
                            {
                                ST = "\"STATUS\":\"SUCCESS\"";

                                console.log("\n\rList was successfully retrived.\n\r");

                                if(data.TARGET == "PLAYLISTS")
                                {
                                    if(!loaded)
                                    {
                                        def = await loadFile("default.txt");

                                        def = def.ID;

                                        loaded = true;
                                    }
                                    
                                    ST +=",\"DEFAULT\":" + def;
                                }
                            }
                            else
                            {
                                ST = "\"STATUS\":\"EMPTY\"";
                                console.log("\n\rList is empty.\n\r");
                            }
                                
                            process.stdout.write("Object lenght: ");

                            console.log(Object.keys(Q).length);

                            console.log("");
                            
                            let prefix = data.TARGET.slice(0,2);
                            let sufix = data.TARGET.slice(2);

                            if(prefix == "PT" || prefix == "AT")
                                Q = "{\"" + prefix + "X\":" +  JSON.stringify(Q) + ",\"X\":" + sufix +"," + ST + "}";
                            else
                                Q = "{\"" + data.TARGET + "\":" +  JSON.stringify(Q) + "," + ST + "}";
                        }  
                        else
                        {
                            ST = "\"STATUS\":\"FAILURE\",\"MESSAGE\":" + JSON.stringify(Q);

                            let prefix = data.TARGET.slice(0,2);
                            let sufix = data.TARGET.slice(2);

                            if(prefix == "PT" || prefix == "AT")
                                Q = "{\"" + prefix + "X\":[],\"X\":" + sufix + "," + ST + "}";
                            else
                                Q = "{\"" + data.TARGET + "\":[]," +  ST + "}";
                        }

                        client.publish(outgoing[4],Q);
                    }
                    else if(!TOKEN)
                        client.publish(outgoing[4],JSON.stringify({"STATUS":"LOGIN"}));
                    else
                        client.publish(outgoing[4],JSON.stringify({"STATUS":"INVALID"}));
                });
                
                break;
            }

            case "POST":
            {
                setImmediate( async ()=>
                {
                    if(TOKEN && data.TOKEN == TOKEN)
                    {
                        let Q = await SQL.INS(data.TARGET, data);
                  
                        if(!Q.STATUS)
                        {
                            
                            let CHANGES = null;
                            
                            if(Q[0])
                            {
                                CHANGES = Q[0].affectedRows;
                            }
                            else
                            {
                                CHANGES = Q.affectedRows;
                            }

                            Q = {"STATUS":"SUCCESS","MESSAGE":Q, CHANGES};
                            
                            if(data.TARGET == "ROOMS")
                            {
                                newSubscription("READER",data.FIELD2);
        
                                newSubscription("SPEAKER",data.FIELD3);
                            }     
                        }
                        else
                            Q = {"STATUS":"FAILURE","MESSAGE":Q.STATUS};
                        
                        console.log("RESPONSE TOPIC: " + outgoing[4]);

                        process.stdout.write("MESSAGE: ");

                        console.log(Q);
                        
                        Q = JSON.stringify(Q);
    
                        client.publish(outgoing[4],Q);
                    }
                    else if(!TOKEN)
                        client.publish(outgoing[4],JSON.stringify({"STATUS":"LOGIN"}));
                    else
                        client.publish(outgoing[4],JSON.stringify({"STATUS":"INVALID"}));

                });
                
                break;
            }

            case "UPDATE":
            {
                setImmediate( async () =>
                {
                    if(TOKEN && data.TOKEN == TOKEN)
                    {
                        let Q = await SQL.UPDT(data.TARGET, data);

                        if(!Q.STATUS)
                        {
                            let CHANGES = null;

                            if(Q[0])
                            {
                                CHANGES = Q[0].affectedRows;
                            }
                            else
                            {
                                CHANGES = Q.affectedRows;
                            }


                            Q = {"STATUS":"SUCCESS","MESSAGE":Q, CHANGES};
                                
                        }   
                        else
                            Q = {"STATUS":"FAILURE","MESSAGE":Q.STATUS};
                        
                        console.log("RESPONSE TOPIC: " + outgoing[4]);

                        process.stdout.write("MESSAGE: ");

                        console.log(Q);
                        
                        Q = JSON.stringify(Q);
                        
                        client.publish(outgoing[4],Q);
                    }
                    else if(!TOKEN)
                        client.publish(outgoing[4],JSON.stringify({"STATUS":"LOGIN"}));
                    else
                        client.publish(outgoing[4],JSON.stringify({"STATUS":"INVALID"}));
                });
                
                break;
            }

            case "DELETE":
            {
                setImmediate( async () =>
                {
                    if(TOKEN && data.TOKEN == TOKEN)
                    {  
                        
                        let id = data.FIELD1;

                        let Q;

                        if( !(data.TARGET == "MUSIC" && (id == "1") ) )
                        {
                            Q = await SQL.DEL(data.TARGET, id);

                            if(!Q.STATUS)
                            {
                                let CHANGES = null;
                            
                                if(Q[0])
                                {
                                    CHANGES = Q[0].affectedRows;
                                }
                                else
                                {
                                    CHANGES = Q.affectedRows;
                                }
    
                                Q = {"STATUS":"SUCCESS","MESSAGE":Q, CHANGES};
                            }
                            else
                                Q = {"STATUS":"FAILURE","MESSAGE":Q.STATUS};
                        
                            if(data.TARGET == "MUSIC" && def == data.FIELD1)
                            {
                                await setDefaultList(-1);

                                def =  -1;
                            }
                            
                            console.log("RESPONSE TOPIC: " + outgoing[4]);

                            process.stdout.write("MESSAGE: ");

                            console.log(Q);

                            Q = JSON.stringify(Q);

                            client.publish(outgoing[4],Q);    
                        }
                        else
                        {
                            Q = {"STATUS":"UNDELETABLE","MESSAGE":"Attempted to delete " + data.TARGET + "of id " + id};

                            console.log("RESPONSE TOPIC: " + outgoing[4]);

                            process.stdout.write("MESSAGE: ");

                            console.log(Q);

                            Q = JSON.stringify(Q);

                            client.publish(outgoing[4],Q);  
                        }
                        
                    }
                    else if(!TOKEN)
                        client.publish(outgoing[4],JSON.stringify({"STATUS":"LOGIN"}));
                    else
                        client.publish(outgoing[4],JSON.stringify({"STATUS":"INVALID"}));
                });
                
                break;
            }

            case "DEFAULT":
            {
                let output;

                setImmediate( async () =>
                {
                    if(TOKEN && data.TOKEN == TOKEN)
                    {                            
                        output = await setDefaultList(data.ID);

                        client.publish(outgoing[4],JSON.stringify(output));
                    }
                    else if(!TOKEN)
                        client.publish(outgoing[4],JSON.stringify({"STATUS":"LOGIN"}));
                    else
                        client.publish(outgoing[4],JSON.stringify({"STATUS":"INVALID"}));
                    
                });

                break;
            }

            case "STORAGE_INFO":
            {
                setImmediate( async () =>
                {
                    if(TOKEN && data.TOKEN == TOKEN)
                    {
                        disk.checkStorage('./files/music/','/',outgoing[1],client);
                    }
                    else if(!TOKEN)
                        client.publish(outgoing[4],JSON.stringify({"STATUS":"LOGIN"}));
                    else
                        client.publish(outgoing[4],JSON.stringify({"STATUS":"INVALID"}));
                });

                break;
            }

            case "CREDENTIALS":
            {
                setImmediate( async () =>
                {
                    let credentials = await loadFile("credentials.txt");

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
                    else if(data.NEW == "YES")
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

                break;
            }
        }

    }
    else if(ID[0] == "READER")
    {
        setImmediate( async () => 
        {
            let HOST = "192.168.0.103";

            let PORT, PATH = [], TRACKS = 1, AD_TRACKS = 0, LIST_ID = null, RANDOM = false;

            let READER_ID =  ID[1];
            
            let Q = await SQL.SEL("*","ROOMS WHERE READER_ID = '" + READER_ID + "'","","",false);
            
            console.log(Q);

            let SPEAKER_ID = Q[0].SPEAKER_ID;
    
            let index = Q[0].PORT_ID;
    
            let ACTION = data.ACTION;
    
            if(ACTION ==  "START")
            {
                let TAG = data.TAG;
    
                let Q1 = await SQL.SEL("*","TAGS","TAG",TAG,true);
    
                let Q2;
        
                let file = "";
       
                PORT = port[index];
                
                if(Q1[0] && !Q1.STATUS)
                {
                    LIST_ID = Q1[0].LIST_ID;
        
                    Q2 = await SQL.SEL("TRACKS,AD_TRACKS","PLAYLISTS","ID",LIST_ID,false);

                    if(Q2[0] && !Q2.STATUS)
                    {
                        TRACKS = Q2[0].TRACKS;

                        AD_TRACKS = Q2[0].TRACKS;
                    }
                }
                
                console.log("LIST_ID:" + LIST_ID);

                if(LIST_ID)
                {

                    if(TRACKS && TRACKS > 0)
                        PATH.push("/playlist/" + LIST_ID.toString() + "/music");
                    else
                    {
                        TRACKS = 1;

                        PATH.push("/audio/0/No_Song_In_Playlist.mp3");
                    }
                        
                    console.log("NUMBER OF TRACKS:" + TRACKS);

                    if(AD_TRACKS > 0)
                        PATH.push("/playlist/" + LIST_ID.toString() + "/ads");

                    process.stdout.write("PATH:");

                    console.log(PATH);

                }         
                else
                {
                    let OP;

                    if(!loaded)
                    {
                        def = await loadFile("default.txt");

                        def = def.ID;

                        loaded = true;
                    }

                    OP = def;

                    console.log("default:" + OP);
                    
                    if(OP > 0)
                    {
                        Q2 = await SQL.SEL("*","PLAYLISTS","ID",OP.toString(),false);

                        if(Q2[0] && !Q2.STATUS)
                        {
                            TRACKS = Q2[0].TRACKS;

                            AD_TRACKS = Q2[0].TRACKS;

                            if(isNaN(TRACKS))
                                TRACKS = parseInt(TRACKS.toString());
                        
                            if(TRACKS > 0)
                            {
                                PATH.push("/playlist/" + LIST_ID.toString() + "/music");
                            }
                            else
                            {
                                TRACKS = 1;

                                PATH.push("/audio/0/No_Song_In_Playlist.mp3");
                            }
                               
                            console.log("NUMBER OF TRACKS:" + TRACKS);
                            
                            if(AD_TRACKS > 0)
                                PATH.push("/playlist/" + LIST_ID.toString() + "/ads");

                            process.stdout.write("PATH:");

                            console.log(PATH);    
                        }
                        else
                            PATH.push = "/audio/0/No_Playlist.mp3"; //No_Playlist.mp3 Playlist not Found.                 
                    }
                    else
                    {
                        if(OP < 0)
                        {                         
                            Q2 = await SQL.SEL("ID","MUSIC WHERE ID > 1","","",false);

                            if(Q2[0] && !Q2.STATUS)
                            {
                                TRACKS = Q2.length;

                                RANDOM = true;

                                PATH.push("/playlist/random/music");
                            }
                            else
                                PATH.push("/audio/0/No_Songs.mp3"); //No songs have been added.     
                        }
                        else
                            PATH.push("/audio/0/default.mp3");
                    }
                  
                }
                  
                for(let i = 0; i < PATH.length; i++)
                    PATH[i] = encodeURI(PATH[i]);
    
                PATH = PATH[0];
                /*
                {
                    "ACTION":"START",
                    "HOST":"192.168.0.103",
                    "PORT":3400,
                    "PATH":"/audio/0/default.mp3" OR "/audio/1/song.mp3" OR "/audio/2/ad.mp3" 
                    OR playlist/id/music/track" OR "playlist/id/ads/track" OR playlist/random/music/track,
                    "TRACKS":NUM,
                    "RANDOM":TRUE OR FALSE
                    
                } need to change how default id works: RANDOM or UNReGISTERED for non database tags
                */
                client.publish(outgoing[2] + SPEAKER_ID,JSON.stringify({ACTION,HOST,PORT,PATH,TRACKS,RANDOM}));
                
                console.log("[" + outgoing[2]  + SPEAKER_ID + "]: " + JSON.stringify({ACTION,HOST,PORT,PATH,TRACKS,RANDOM}));
                
                console.log("Trying again in 5 seconds...");
                
                play[index] = setTimeout(() =>
                {
                    client.publish(outgoing[2] + SPEAKER_ID,JSON.stringify({ACTION,HOST,PORT,PATH,TRACKS,RANDOM}))
                    
                    console.log("Last try...");
                    
                    console.log("[" + outgoing[2] + SPEAKER_ID + "]: " + JSON.stringify({ACTION,HOST,PORT,PATH,TRACKS,AD_TRACKS,RANDOM}));
                },5000);
            
            }
            else if(ACTION == "STOP" && !termination[index])
            {
                termination[index] = true;

                client.publish(outgoing[2] + SPEAKER_ID, JSON.stringify(data));
    
                timer[index] = setTimeout( async () =>
                {
                    try
                    {
                        await httpTerminator[index].terminate();

                        console.log("connection %u terminated.",index);
                    
                        subtimer[index] = setTimeout( async () =>
                        { 
                            console.log("Attempting to re-open socket.");
                            
                            await createServer(index);

                            termination[index] = false;
                            
                        }, 5000);

                        console.log("Socket will be re-opened in 5 seconds");
                    }
                    catch(error)
                    {
                        errorLog("termination",error,1);

                        termination[index] = false;
                    }
                    
                }, 5000);
            }

        });
    }
    else if(ID[0] ==  "SPEAKER")
    {
        
        setImmediate( async () => 
        {
            let SPEAKER_ID =  ID[1];

            let Q = await SQL.SEL("*","ROOMS WHERE SPEAKER_ID = '" + SPEAKER_ID + "'","","",false);
    
            let index = Q[0].PORT_ID;
    
            switch(data.STATUS)
            {
                case "PLAYING":
                {
                    clearTimeout(play[index]);
    
                    console.log("Received streaming confirmation.");

                    break;
                }
    
                case "OK":
                {
                    clearTimeout(timer[index]); 

                    termination[index] = false;
    
                    console.log("Received connection end confirmation.");

                    break;
                }
    
                case "DC":
                {
                    clearTimeout(subtimer[index]);
                    
                    setImmediate(async () =>
                    {
                        try
                        {
                            await createServer(index);
    
                            console.log("Received reconnection ready confirmation.");     
                        }
                        catch(error)
                        {
                            errorLog("termination",error,2);
                        }
                        finally
                        {
                            termination[index] = false;
                        }
                    });
                    
                    break;
                    //REGISTER STUFF in error logs with time stamps
                }
            }

        });
        
    }
    else if(ID[0] == "TEST")
    {
        
        console.log(message);

        client.publish("TEST/RESPONSE","PONG");

    }
    else
    {
        console.log("Wait wa");
    }

});

/*ERROR DISPLAY*/

client.on("error", (err) => 
{
    errorLog("",err,9); //error9
});

/*******************************************************************************
                              UPLOAD HTTP SOCKET
*******************************************************************************/

/**********************************MODULES*************************************/

const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
const { random, intersection, forIn } = require('lodash');
const { Console } = require('console');
const e = require('express');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');

/*************************VARIABLES AND INSTANCES*****************************/

const up = express();

const uport = 8081;

/*********************************FUNCTIONS***********************************/

function charRemove(str,symbol,n)
{
    let k = 0;

    for(let i = 0; i<str.length; i++)
    {
        if(str[i] == symbol)
        {
            k++;

            if(k == (n -1))
            {
                str = str.slice(0,i) + str.slice(i+1);

                break;
            }
        }
    } 

    return str;
}

/*******************************INITIALIZATION********************************/

// enable files upload
up.use(fileUpload(
{
    createParentPath: true
}));

//add other middleware
up.use(cors());
up.use(bodyParser.json());
up.use(bodyParser.urlencoded({extended: true}));
up.use(morgan('dev'));


up.listen(uport, (error) => 
{
    hash("UPLOAD HTTP PORT","*");

    if(error)
    {
        errorLog("",error,10); //error10
    }
    else
    {
        console.log(`App is listening on port ${uport}.`)

        rainCheck(1);
    }
    
});

/******************************EVENT HANDLING********************************/

up.post('/upload-audio', async (req, res) => 
{
    let JSONEX = false;
    
    try 
    {
        if(!req.files) 
        {
            res.status(400).send(
            {
                STATUS: "BAD REQUEST",
                REQUEST: "NO FILE UPLOADED"
            });
        } 
        else 
        {
            let details = {};

            let regEX = /\\u0000|[\u0000]/g;
            
            console.log(req);

            try
            {
                details = JSON.parse(req.body.details.toString().replace(regEX,''));

                process.stdout.write("Parsed JSON: ");

                console.log(details);
            }
            catch(error)
            {
                console.log("Bad JSON.");

                console.log(error);

                JSONEX = true;
            }
            
            
            if(details.key && details.key == "hazard")
            {
                console.log("TOKEN GENERATION.")

                if(!TOKEN)
                    TOKEN = randomToken(16);

                process.stdout.write("New Token: ");

                console.log(TOKEN);

                details.TOKEN = TOKEN;
            }

            if(TOKEN && details.TOKEN == TOKEN)
            {
                //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
                let audio = req.files.audio;
                
                let Q;
                
                let flag = true;

                let n = 0;
                
                let path;
                
                if(details.audio && details.audio == "ad")
                    path = "./files/ads/";
                else
                    path = "./files/music/";
            
                let filename = details.filename;
                
                console.log(filename);

                filename = filename.replace(/ /g,'_');

                console.log(filename);
                
                let file;
                
                let f = filename.split('.');

                if(filename.length > 26)
                {
                    let l = f.length;

                    if(f[l-1].length >= 25)
                        file = filename.slice(0,22) + ".weird";
                    else
                        file = filename.slice(0,25 - f[l-1].length) + "." + f[l-1];

                    console.log(file);

                    f = file.split('.');
                }
                else
                    file = filename;
                
                let dots = f.length;

                f[dots] = f[dots - 1];
                
                f[dots - 1] = "";
        
                let extension = "";
                
                extension = f[dots];       
                
                if(extension == "mp3")
                {
                    let exists = util.promisify(fs.access);

                    let save = util.promisify(audio.mv);

                    while(flag)
                    {
                        file = f.join('.');

                        file = charRemove(file,'.',dots);

                        try
                        {
                            await exists(path + file, fs.F_OK); 

                            console.log(n.toString() + ". File exists. ");

                            n++;

                            f[dots - 1] = "("+n.toString()+")";
                        }
                        catch(error)
                        {
                            console.log("Saving " + file);

                            await save(path + file);

                            console.log(file + " saved.");

                            let dt = {};

                            if(details.audio && details.audio == "ad")
                            {
                                dt.FIELD1 = details.topic;

                                dt.FIELD2 = file;

                                Q = await SQL.INS("ADS", dt);
                            }
                            else
                            {
                                dt.FIELD1 = details.song;

                                dt.FIELD2 = details.artist;

                                dt.FIELD3 = details.genre;

                                dt.FIELD4 = file;

                                Q = await SQL.INS("MUSIC", dt);
                            }
    
                            if(!Q.STATUS)
                                Q = "SUCCEEDED ON MODIFYING DATABASE.";
                            else
                                Q = "FAILED TO MODIFY DATABASE.";

                            flag = false;
                        }
                    }
                    
                    //send response
                    res.status(200).send(
                    {
                        STATUS: Q,

                        MESSAGE: 'File was successfully uploaded',
                        
                        DATA: 
                        {
                            NAME: file,
                            MIMETYPE: audio.mimetype,
                            SIZE: audio.size
                        }
                    });
                }
                else
                {
                    console.log("Bad request; please upload .mp3 files only.");

                    res.status(400).send(
                    {
                        STATUS:"BAD REQUEST", 
                        
                        MESSAGE: "PLEASE UPLOAD .mp3 FILES ONLY."
                    });
                }
            }
            else if (!TOKEN)
            {
                if(!JSONEX)
                {
                    console.log("No Token has been generated; please log in.");

                    res.status(401).send({STATUS:"LOGIN"});
                }
                else
                {
                    res.status(400).send(
                    {
                        STATUS: "BAD REQUEST",
                        REQUEST: "BAD JSON"
                    });
                    
                    console.log("Bad Request: Bad JSON:");
                    console.log(req.body.details);
                }
                
            }
            else
            {
                console.log("Invalid Token.");

                process.stdout.write("Expected: ");
                console.log(TOKEN);

                process.stdout.write("Reveiced: ");
                console.log(details.TOKEN);

                res.status(401).send({STATUS:"INVALID"});
            }
        }
    } 
    catch(error) //error11
    {
        errorLog("",error,11);

        res.status(500).send({STATUS:"ERROR"});
    }
});


process.on('uncaughtException',  async (error) =>
{
    console.log("Uncaught Exception");

    if(typeof error == 'object')
    {
        let e;

        if(error.message)
        {
            e = error.message.toString();

            if(error.stack)
            {
                e += " @"  + error.stack.toString();
            }
        }
        else
            e = error;

        await errorLog("Uncaught-Exception",e,0);
    }
    else
        await errorLog("Uncaught-Exception",error,0); 

    process.exit();
});
  
