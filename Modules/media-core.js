const fs   = require('fs');
const { parse } = require('path');

const util = require('util');

const SQL = require('./SQL.js');

//Ruta para los archivos.
const dir  = ["./files/default/","./files/music/","./files/ads/"];

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
                let info = "Date: " +  timeStamp +  "\n\r\n\r";

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

//Función para listar los archivos del directorio audio.
module.exports.listFiles = (req,res) =>
{
	let files = [];

	//Cargo en el array la lista de archivos.
	for(let k = 0; k <= 1; k++)
	{
		fs.readdirSync(dir[k]).forEach(file => files.push(file));
	}

	res.status(200).json(files);
};

//Traigo el contenido del archivo.
module.exports.audioMedia = (req,res) => 
{	
	//Obtengo el nombre del archivo.
	let file = req.params.file;

	let reg = parseInt(req.params.reg);

	//Si el nombre no es nulo.
	if (file!='' && (reg == 0 || reg == 1))
	{
		//Agrego el path local al file.
		file = dir[reg]+file;

		//Variable para el filesize.
		let statFile;

		//Intengo obtener el archivo.
		try
		{
			//Traigo atributos del archivo.
			statFile = fs.statSync(file);

			//Armo headers.
			res.writeHead(200, {'Content-Type': 'audio/mpeg','Content-Length': statFile.size});

			console.log("Streaming " + file + ".");

			//Devuelvo streams del archivo atravez de un pipe.
      let stream = fs.createReadStream(file).pipe(res);
      
      let hrstart = process.hrtime();

      stream.on('finish', () =>
      {
        let hrend = process.hrtime(hrstart);

        console.log("Done Streaming " + req.params.file + " on host " + req.get('host'));
        console.log("%ds %dms",hrend[0],hrend[1]/1000000);

      });
      
		}
		catch(error)
		{
			console.log("File " + file + " can't be found.");

			errorLog("media","File " + file + " can't be found.\n\r\n\r" + error.toString(),1);

			res.status(404).send({STATUS:"NOT FOUND",MESSAGE:"FILE " + file + " CAN'T BE FOUND."});
		}
	}
	else
	{
		console.log("Bad request; file not specified.");

		errorLog("media","Bad request; file not specified.",2);

		res.status(400).send({STATUS:"BAD REQUEST", MESSAGE:"FILE NOT SPECIFIED."});
	}
		
};


module.exports.playlist = (req,res) => 
{	
	let playlist = req.params.id;

  let type = req.params.type;

	let track = req.params.track; 

	if (playlist && track && type)
	{
    let retrieved = false, file;

    if(type == "music" && playlist!= "random")
    {
  
      playlist = parseInt(playlist);
  
      let Q = SQL.SEL("PL_TABLE_NAME","PLAYLISTS","ID",playlist,false);
  
      if(!Q.STATUS && Q[0] && Q[0].PL_TABLE_NAME)
      {
        let pl_tab = Q[0].PL_TABLE_NAME;
  
        Q = SQL.SEL("SONG_ID",pl_tab + " LIMIT 1," + track, "","",false);
  
        if(!Q.STATUS && Q[0] && Q[0].SONG_ID)
        {
          let song_id = Q[0].SONG_ID;

          Q = SQL.SEL("FL_NAME","MUSIC","ID",song_id,false);

          if(!Q.STATUS && Q[0] && Q[0].FL_NAME)
          {
            file = dir[1] + Q[0].FL_NAME;
    
            retrieved = true;
          }
        } 
      } 
    }
    else if(type == "music")
    {
      playlist = parseInt(playlist);
      
      if(track == '0')
        track == '1';
      
      let Q = SQL.SEL("FL_NAME","MUSIC LIMIT 1," + track,"","",false);

      if(!Q.STATUS && Q[0] && Q[0].FL_NAME)
      {
        file = dir[1] + Q[0].FL_NAME;

        retrieved = true;
      }  
    }
    else if(type == "ads")
    {
      playlist = parseInt(playlist);
  
      let Q = SQL.SEL("AD_TABLE_NAME","PLAYLISTS","ID",playlist,false);
  
      if(!Q.STATUS && Q[0] && Q[0].AD_TABLE_NAME)
      {
        let ad_tab = Q[0].AD_TABLE_NAME;
  
        Q = SQL.SEL("AD_ID",ad_tab + " LIMIT 1," + track, "","",false);
  
        if(!Q.STATUS && Q[0] && Q[0].SONG_ID)
        {
          let ad_id = Q[0].AD_ID;

          Q = SQL.SEL("FL_NAME","ADS","ID",ad_id,false);

          if(!Q.STATUS && Q[0] && Q[0].FL_NAME)
          {
            file = dir[2] + Q[0].FL_NAME;
    
            retrieved = true;
          }
        } 
      } 
    }
    
    if(retrieved)
    {
      let statFile;

      try
      {
        statFile = fs.statSync(file);

        //Armo headers.
        res.writeHead(200, {'Content-Type': 'audio/mpeg','Content-Length': statFile.size});

        console.log("Streaming " + file + ".");

        //Devuelvo streams del archivo atravez de un pipe.
        let stream = fs.createReadStream(file).pipe(res);
        
        let hrstart = process.hrtime();

        stream.on('finish', () =>
        {
          let hrend = process.hrtime(hrstart);

          console.log("Done Streaming " + req.params.file + " on host " + req.get('host'));
          console.log("%ds %dms",hrend[0],hrend[1]/1000000);

        });
        
      }
      catch(error)
      {
        console.log("File " + file + " can't be found.");

        errorLog("media","File " + file + " can't be found.\n\r\n\r" + error.toString(),3);

        res.status(404).send({STATUS:"NOT FOUND",MESSAGE:"FILE " + file + " CAN'T BE FOUND."});
      }
    }
    else
    {
      let message = "Playlist " + id.toString() + " retrieval error @ track " +  track.toString();
      
      process.stdout.write(message);
      
      errorLog("media",message,4);

      res.status(500).send({STATUS:"FAILURE",MESSAGE:message});
    }
	}
  else if(playlist == "random" && track)
  {
    
  }
	else
	{
		console.log("Bad request; file not specified.");

		errorLog("media","Bad request; file not specified.",5);

		res.status(400).send({STATUS:"BAD REQUEST", MESSAGE:"FILE NOT SPECIFIED."});
	}
		
};

//Ruta incorrecta.
module.exports.routeError = (req,res) =>
{
	console.log(req.url + " is not an existing service.");

	errorLog("media",req.url.toString() + " is not an existing service.",3);

	res.status(501).send({STATUS: "SERVICE DOES NOT EXIST."});
};