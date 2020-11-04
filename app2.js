const fs = require('fs');

const delay = require('delay');

const util = require('util');

const readFile = util.promisify(fs.readFile);

const writeFile = util.promisify(fs.writeFile);

const exists = util.promisify(fs.access);

const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

var res;

async function  getCredentials()
{
    let filename = "creds.txt";
    
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

setImmediate( async () =>
    {
       console.log(await getCredentials()); 
       console.log("oh shiet");
    }
)


/**
 * 
 * function (error, data)
    {
        if(error)
        {
            console.log(error);

            let data = {"USER":"APP","PASS":"0R81TT45"};

            fs.writeFile(filename,data, (error) =>
            {
                if(error)
                {
                    console.log(error);
                }
                else
                {
                    info = data;

                    console.log("created new file.");           

                }                  
            });
        }
        else
        {
            info = data;
            flag = true;
            //console.log(data);
        }

 */
