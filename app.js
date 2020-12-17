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


function rainCheck()
{
    readiness++;

    if(readiness >= 6)
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

function createServer(i)
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

    app[i].get('/audio/:reg/:file/',core.audioMedia);

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

        rainCheck();

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
    
    rainCheck();
});

/*WEBSOCKET SERVER*/

ws.createServer({ server: httpServer }, aedes.handle);

httpServer.listen(wsPort,  () =>
{
    console.log('Aedes (MQTT Web-socket) listening on port: ' + wsPort);
    aedes.publish({ topic: 'aedes/hello', payload: "I'm broker " + aedes.id });

    rainCheck();
});

/*******************************************************************************
                             MQTT SERVER CLIENT
*******************************************************************************/
/**********************************MODULES*************************************/

const mqtt = require("mqtt");

const randomToken = require('random-token').create('abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');

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
                    "TEST/INIT"
                  ];

const outgoing = [
                    "SERVER/POLL",
                    "SERVER/INFO",
                    "SERVER/",
                    "SERVER/AUTHORIZE",
                    "SERVER/RESPONSE",
                    "TEST/RESPONSE"
                 ];

var info = false;

var dataStream_R = [];
var dataStream_S = [];

var def = "1";

var loaded = false;

var TOKEN = "";

/*********************************FUNCTIONS***********************************/

async function  loadFile(filename)
{
    let readFile = util.promisify(fs.readFile);

    let writeFile = util.promisify(fs.writeFile);

    let exists = util.promisify(fs.access);
    
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

        process.stdout.write("Attemting to create " + filename); 
        
        let data;

        if(filename == "credentials.txt")
        {
            console.log(" with default credentials.");

            data = {"USER":"APP","PASS":"0R81TT45"};
        }    
        else if("default.txt")
        {
            console.log(" with default song id.");

            data = {"ID":"1"};
        }        

        data = JSON.stringify(data);

        try
        {
            await writeFile(filename,data);

            console.log(filename + " succesfully created.")
        }
        catch(error) //2
        {
           errorLog("",error,2);
        }

        info = data;
    }
    
    let output = JSON.parse(info.toString());
    process.stdout.write("Stored Credentials: ");

    console.log(output);

    return output;   
}

async function setDefaultSong(ID)
{
    let writeFile = util.promisify(fs.writeFile);
    
    let filename = "default.txt";

    let output;

    let data = {ID};

    data = JSON.stringify(data);

    try
    {
        await writeFile(filename,data);

        process.stdout.write("Default Song ID set: ");
        
        def = data; 

        console.log(data);

        output = {"STATUS":"SUCCESS"};
    }
    catch(error) //error31
    {
        errorLoge("",error,31);

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
        errorLoge("",error,3);

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
        rainCheck();

    console.log("Connected to broker on port " + nsport + ".");

    console.log("Subscribing to topics...");

    for(let k = 0; k < incoming.length; k++)
    {
        client.subscribe(incoming[k], (error,granted) => 
        {
            if(error) //error5
                errorLog("",error,5)
            else if(granted)
                console.log(granted);
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
                    rainCheck();
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
                    rainCheck();
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
                setImmediate( async () => 
                {
                    log = await SQL.SEL("*","ROOMS","","",false);

                    info = true;

                    dataStream_R = [];
                    dataStream_S = [];
                
                    client.publish(outgoing[0],JSON.stringify({"REQUEST":"INFO"}));

                    setTimeout(() =>
                    {
                        info = false;

                        if(log[0] && !log.STATUS)
                        {
                            for(let j = 0; j < Object.keys(dataStream_R).length;j++)
                            {
                                for(let i = 0; i < Object.keys(log).length; i++)
                                {
                                    if(dataStream_R[j] == log[i].READER_ID)
                                    {
                                        dataStream_R[j].STATUS = "ASSIGNED";
                                        dataStream_R[j].ROOM = log[i].ROOM_NAME;
                                    }  
                                    else
                                        dataStream_R[j].STATUS = "UNASSIGNED"; 
                                }
                            }

                            for(let j = 0; j < Object.keys(dataStream_S).length;j++)
                            {
                                for(let i = 0; i < Object.keys(log).length; i++)
                                {
                                    if(dataStream_S[j] == log[i].SPEAKER_ID)
                                    {
                                        dataStream_S[j].STATUS = "ASSIGNED";
                                        dataStream_S[j].ROOM = log[i].ROOM_NAME;
                                    }  
                                    else
                                        dataStream_S[j].STATUS = "UNASSIGNED"; 
                                }
                            }

                        }
                    
                        client.publish(outgoing[1], JSON.stringify(dataStream_R.concat(dataStream_S)))
                    
                    },5000);
            
                });  

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
                        
                        if(!Q.STATUS)
                        {  

                            let ST = "";

                            if(Q[0])
                            {
                                ST = "\"STATUS\":\"SUCCESS\"";

                                console.log("\n\rList was successfully retrived.\n\r");

                                if(data.TARGET == "MUSIC")
                                {
                                    if(!loaded)
                                    {
                                        def = await loadFile("default.txt");

                                        def = def.ID;

                                        loaded = true;
                                    }

                                    ST +=",\"DEFAULT\":\"" + def + "\""
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
                            
                            Q = "{\"" + data.TARGET + "\":" +  JSON.stringify(Q) + "," + ST + "}";
                        }  
                        else
                            Q = "{\"" + data.TARGET + "\":" +  JSON.stringify(Q) + "}";

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
                            Q = {"STATUS":"SUCCESS","MESSAGE":JSON.stringify(Q)};
                            
                            if(data.TARGET == "ROOMS")
                            {
                                newSubscription("READER",data.FIELD2);
        
                                newSubscription("SPEAKER",data.FIELD3);
                            }     
                        }
                        else
                            Q = {"STATUS":"FAILURE","MESSAGE":Q.STATUS};
                        
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
                            Q = {"STATUS":"SUCCESS","MESSAGE":JSON.stringify(Q)};
                        else
                            Q = {"STATUS":"FAILURE","MESSAGE":Q.STATUS};
                        
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
                        let Q = await SQL.DEL(data.TARGET, data.FIELD1);

                        if(!Q.STATUS)
                            Q = {"STATUS":"SUCCESS","MESSAGE":JSON.stringify(Q)};
                        else
                            Q = {"STATUS":"FAILURE","MESSAGE":Q.STATUS};
                        
                        if(data.TARGET == "MUSIC" && def == data.FIELD1)
                        {
                            await setDefaultSong("1");

                            def = "1";
                        }
                        
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

            case "DEFAULT":
            {
                let output;

                setImmediate( async () =>
                {
                    if(TOKEN && data.TOKEN == TOKEN)
                    {
                        output = await setDefaultSong(data.ID);

                        client.publish(outgoing[4],JSON.stringify(output));
                    }
                    else if(!TOKEN)
                        client.publish(outgoing[4],JSON.stringify({"STATUS":"LOGIN"}));
                    else
                        client.publish(outgoing[4],JSON.stringify({"STATUS":"INVALID"}));
                    
                });
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

            }
        }

    }
    else if(ID[0] == "READER")
    {
        setImmediate( async () => 
        {
            let HOST = "sdrorbittas.sytes.net";

            let PORT;

            let PATH = "/audio";
    
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
                    let SONG_ID = Q1[0].SONG_ID;
        
                    Q2 = await SQL.SEL("*","MUSIC","ID",SONG_ID,false);

                    if(Q2[0] && !Q2.STATUS)
                        file = Q2[0].FL_NAME;
                }
    
                if(file)
                    PATH += "/1/" + file;
                else
                {
                    
                    let SONG_ID;

                    if(!loaded)
                    {
                        def = await loadFile("default.txt");

                        def = def.ID;

                        loaded = true;
                    }
                       
                    SONG_ID = def;

                    if(SONG_ID == "0")
                        PATH += "/0/default.mp3";
                    else if(SONG_ID == "1")
                        PATH += "/0/Rick Rolling.mp3";
                    else
                    {
                        Q2 = await SQL.SEL("*","MUSIC","ID",SONG_ID,false);

                        if(Q2[0] && !Q2.STATUS)
                        {
                            file = Q2[0].FL_NAME;

                            PATH += "/1/" + file;
                        }
                        else
                            PATH += "/0/default.mp3";
                            
                    }
                }
                    
    
                PATH = encodeURI(PATH);
    
                /*
                {
                    "ACTION":"START",
                    "HOST":"192.0.0.1",
                    "PORT":3400,
                    "PATH":"/audio/1/andrew_rayel_impulse.mp3"
                }
                */
                client.publish(outgoing[2] + SPEAKER_ID,JSON.stringify({ACTION,HOST,PORT,PATH}));
                
                console.log("[" + outgoing[2] + + SPEAKER_ID + "]: " + JSON.stringify({ACTION,HOST,PORT,PATH}));
                console.log("Trying again in 5 seconds...");
                play[index] = setTimeout(() =>
                {
                    client.publish(outgoing[2] + SPEAKER_ID,JSON.stringify({ACTION,HOST,PORT,PATH}))
                    console.log("Last try...");
                    console.log("[" + outgoing[2] + SPEAKER_ID + "]: " + JSON.stringify({ACTION,HOST,PORT,PATH}));
                },5000);
            
            }
            else if(ACTION == "STOP")
            {
                client.publish(outgoing[2] + SPEAKER_ID, JSON.stringify(data));
    
                timer[index] = setTimeout( () =>
                {
                    httpTerminator[index].terminate();

                    console.log("connection terminated.");
                    
                    subtimer[index] = setTimeout(createServer(index),5000);
                    
                    
                },5000);
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
    
                    console.log("Received connection end confirmation.");

                    break;
                }
    
                case "DC":
                {
                    clearTimeout(subtimer[index]);
    
                    createServer(index);
    
                    console.log("Received reconnection ready confirmation.");
                    
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

        rainCheck();
    }
    
});

/******************************EVENT HANDLING********************************/

up.post('/upload-audio', async (req, res) => 
{
    try 
    {
        if(!req.files) 
        {
            res.send(
            {
                status: false,
                message: 'No file uploaded'
            });
        } 
        else 
        {
            let details = JSON.parse(req.body.details);
            
    
            if(TOKEN && details.TOKEN == TOKEN)
            {
                //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
                let audio = req.files.audio;
                
                let Q;
                
                let flag = true;

                let n = 0;
                
                let path = "./files/music/";
            
                let file = audio.name;
                
                let f = file.split('.');
            
                let dots = f.length;

                f[dots] = f[dots - 1];
                f[dots - 1] = "";
        
                let exists = util.promisify(fs.access);

                let save = util.promisify(audio.mv);
                
                console.log(req);
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

                        dt.FIELD1 = details.song;

                        dt.FIELD2 = details.artist;

                        dt.FIELD3 = file;

                        Q = await SQL.INS("MUSIC", dt);
    
                        if(!Q.STATUS)
                            Q = "Succeeded on modifying database.";
                        else
                            Q = "Failed to modify database";

                        flag = false;
                    }
                
                }
            
            //send response
                res.send(
                {
                    MESSAGE: 'File was successfully uploaded',
                    
                    STATUS: Q,

                    DATA: 
                    {
                        NAME: file,
                        MIMETYPE: audio.mimetype,
                        SIZE: audio.size
                    }

                });
            }
            else if (!TOKEN)
            {
                res.status(500).send({STATUS:"LOGIN"});
            }
            else
            {
                res.status(500).send({STATUS:"INVALID"});
            }
        }
    } 
    catch(error) //error11
    {
        errorLog("",error,11);

        res.status(500).send({STATUS:"ERROR"});
    }
});

