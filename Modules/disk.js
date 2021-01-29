const cp = require('child_process');

const { ceil } = require('lodash');

const mqtt = require("mqtt");

const util = require('util');

const fs = require('fs');

//var path = "./files/music/";

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

module.exports.checkStorage = async (path,mount,topic,client) =>
{
    let readdir = util.promisify(fs.readdir);

    let files;

    try
    {
        files = await readdir(path);    
    }
    catch(error)
    {
        error = {STATUS:"FAILURE",MESSAGE:error};
       
        errorLog("storageCheck",error,1);

        client.publish(topic,JSON.stringify(error));

    }

    let stat = util.promisify(fs.stat);;
        
    let aux, SoD, IOBlocks, tsize = 0, tSoD = 0;
    
    let l = 10;

    let a = ">>";

    for(let i = 0; i < files.length; i++)
    {
        console.log("");

        try
        {
            aux = await stat(path + files[i]);

            if(i + 1 >= l)
            {
                l*=10;
                a += ">"
            }
               
            process.stdout.write((i+1).toString())
        
            console.log(") File Name: " + files[i]);

            console.log(a + " Size:  " + aux.size + " Bytes");

            IOBlocks = ceil(aux.size/aux.blksize);

            tsize += aux.size;

            SoD = IOBlocks*aux.blksize;

            tSoD += SoD;

            console.log(a + " Size on Disk:  " + SoD + " Bytes");

            console.log(a + " IO Block Size: " + aux.blksize + " Bytes");

            console.log(a + " IO Blocks: " + IOBlocks);

            console.log(a + " Blocks: " +  aux.blocks + " x 512 Byte blocks");
        }
        catch(error)
        {
            error = {STATUS:"FAILURE",MESSAGE:error};
            
            errorLog("storageCheck",error,1);

            client.publish(topic,JSON.stringify(error));

        }
   
    }

    console.log("\n\rTotal Size: " + tsize + " Bytes Total Size on Disk: " + tSoD + " Bytes");

    try
    {
        let disk = await cp.spawn("df", ["-BK" , mount]);
        
        disk.stdout.on("data", (data) =>
        {
        
            console.log("");

            console.log(data.toString());

            console.log("");

            let info = data.toString().split("\n");
        
            let params;

            if(info[1])
            {
                params = info[1].split(/[\s,]+/);

                if(params.length > 3)
                {
                    let output = {STORAGE:{total:"",available:"",used:"",music:""}};

                    let used = parseFloat(params[2])/1048576.0, available  = parseFloat(params[3])/1048576.0;
                
                    let total = used + available;

                    output.STORAGE.total = (Math.round(total*10)/10).toFixed(1) + "GB";
                    output.STORAGE.available = (Math.round(available*10)/10).toFixed(1) + "GB";
                    output.STORAGE.used =  (Math.round(used*1000/total)/10).toFixed(1) + "%";
                    output.STORAGE.music = (Math.round(tSoD/102.4)/10).toFixed(1) + "MB";

                    output.STATUS = "SUCCESS";

                    output.MESSAGE = data.toString();

                    console.log(output);

                    client.publish(topic,JSON.stringify(output));
                }                   
            }
        });
    }
    catch(error)
    {
        error = {STATUS:"FAILURE",MESSAGE:error};

        errorLog("storageCheck",error,1);

        client.publish(topic,JSON.stringify(error));
    }
}

//checkStorage(path,"/");

