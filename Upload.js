const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
const fs = require('fs');
const util = require('util');
const { audioMedia } = require('./Modules/media-core');
const app = express();

//const SQL = require('./Modules/SQL.js');
const { defaultCoreCipherList } = require('constants');

// enable files upload
app.use(fileUpload({
    createParentPath: true
}));

//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

//start app 
const port = 8080;

const { networkInterfaces } = require('os');

const nets = networkInterfaces();
const results = Object.create(null); // or just '{}', an empty object

for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
            if (!results[name]) {
                results[name] = [];
            }

            results[name].push(net.address);
        }
    }
}

console.log(results.Wi-Fi[0]);
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
app.listen(port, () => 
  console.log(`App is listening on port ${port}.`)
);

app.post('/upload-audio', async (req, res) => 
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
            let details = req.files.details;

            if(true)//TOKEN && details.TOKEN == TOKEN)
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

                        //details.FIELD3 = file;

                        //Q = await SQL.INS(details.TARGET, details);
    /*
                        if(!Q.STATUS)
                            Q = "Success";
                        else
                            Q = "Failure";
*/
                        flag = false;
                    }
                
                }
            
            //send response
                res.send(
                {
                    MESSAGE: 'File was successfully uploaded',
                    
                    STATUS: true, //Q,

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
    catch (error) 
    {
        console.log(error.toString());

        res.status(500).send({STATUS:"ERROR"});
    }
});