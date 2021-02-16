/*******************************************************************************
********************************************************************************
*                                 SQL QUERIES                                  *
********************************************************************************
*******************************************************************************/

/**********************************MODULES*************************************/

const mysql = require('mysql2');

const fs = require('fs');

const util = require('util');

const { intersection } = require('lodash');

/*********************************FUNCTIONS***********************************/

function DBconnection()
{
  var con = mysql.createConnection({
  host: "localhost",
  user: "orbittas",
  password: "P4s5w0rd++",
  database: "STREAMING_SERVER"
  });

  return con;
}

function purify(str)
{
  let aux = "";

  for(let i = 0; i < str.length; i++)
  {
    if(aux)
    {
      if(str[i] != "'")
        aux += str[i];
      else
        aux += "''";
    }  
    else
    {
      if(str[i] != "'")
        aux = str[i];
      else
        aux = "''";
    }
  }

  return aux;
}

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

/**********************************EXPORTS************************************/

/*SELECT QUERY*/

module.exports.SEL = async function SEL(S,TAB,PARAM,WHERE,STR)
{  
  let DB = DBconnection();
  
  let r = "";

  DB.connect( (error) =>
  {
    if(error) //sql-error3
    {
      try
      {
        DB.end();
      }
      catch
      {

      }
      
      errorLog("sql",error,3);

      r = {};

      r.STATUS = error;
    }  
  });

  if(r.STATUS)
    return r;
  
  console.log("SELECT");

  let Q = TAB;

  if(PARAM && WHERE)
  {
    if(STR)
      Q += " WHERE " + PARAM + " = '" + WHERE + "'";
    else
      Q += " WHERE " + PARAM + " = " + WHERE.toString();
  }
   
  console.log("SELECT " + S + " FROM " + Q + ";");

  try
  {
    let [result,fields] = await DB.promise().query("SELECT " + S +  " FROM " + Q + ";");

    r = JSON.parse(JSON.stringify(result));   
  }
  catch(error) //sql-error4
  {
    errorLog("sql",error,4);
    
    r = {}; r.STATUS = error;
  }

  DB.end();

  console.log(r);

  return r;
}

/*INSERT QUERY*/

module.exports.INS = async function INS(TAB,COL)
{
  let Q = "CALL ss_" + TAB + "_INS(";

  let keys = Object.keys(COL);
  
  let params = [], mark = false;

  for(let i = 0; i < keys.length; i++)
  {
    if(keys[i] != "TARGET" && keys[i] != "TOKEN")
    { 
      if(isNaN(COL[keys[i]]))
        COL[keys[i]] = purify(COL[keys[i]]);
      
      if(mark)
        Q += ',';
      else
        mark = true;
      
      Q += '?';

      params.push(COL[keys[i]]);
    }     
  }

  Q += ')';

  let DB = DBconnection();

  let r = "";
    
  DB.connect( (error) =>
  {
    if(error)
    {
      try
      {
        DB.end();
      }
      catch
      {}
      
      errorLog("sql",error,5); //sql-error5
      
      r = {}; r.STATUS = error;
    }  
  });

  if(r.STATUS)
    return r;

  console.log("INSERT");

  console.log(Q);
  process.stdout.write("Parameters: "); console.log(params);

  try
  {
    let [result,fields] = await DB.promise().query(Q,params);

    r = JSON.parse(JSON.stringify(result));

    if(TAB == "ROOMS")
    {   
      if(r["1"] == 1)
        r.affectedRows = 1;
      else
      {
        r.affectedRows = 0;
        r.message = "All ports might assigned.";
      }
    }
     
  }
  catch(error) //sql-error6
  {
      errorLog("sql",error,6);

      r = {}; r.STATUS = error;
  }

  console.log(r);

  DB.end();

  return r;
}

/*UPDATE QUERY*/

module.exports.UPDT = async function UPDT(TAB,COL)
{
  let Q = "CALL ss_" + TAB + "_UPD(";

  let keys = Object.keys(COL);
  
  let params = [], mark = false;

  for(let i = 0; i < keys.length; i++)
  {
    if(keys[i] != "TARGET" && keys[i] != "TOKEN")
    { 
      if(isNaN(COL[keys[i]]))
      {
        if(i == (keys.length - 1))
          COL[keys[i]] = parseInt(COL[keys[i]]); 
        else
          COL[keys[i]] = purify(COL[keys[i]]);     
      }
      
      if(mark)
        Q += ',';
      else
        mark = true;
      
      Q += '?';

      params.push(COL[keys[i]]);
    }     
  }

  let DB = DBconnection();

  let r = "";
    
  DB.connect( (error) =>
  {
    if(error)
    {
      try
      {
        DB.end();
      }
      catch
      {}
      
      errorLog("sql",error,7); //sql-error7

      r = {}; r.STATUS = error;
    }  
  });

  if(r.STATUS)
    return r;

  console.log("UPDATE");
  
  console.log(Q);
  process.stdout.write("Parameters: "); console.log(params);
  
  try
  {
      let [result,fields] = await DB.promise().query(Q,params);
    
      r = JSON.parse(JSON.stringify(result));

      let oldfile = Object.keys(r)[0];

      if(TAB == "MUSIC" && oldfile)
      {
        let prev = oldfile;

        let nw  = COL.FIELD3;

        r.affectedRows = 1;

        if(prev != nw)
        {
          let rename = util.promisify(fs.rename);

          let path = "./files/music/";
        
          await rename(path + prev, path + nw);
  
          console.log("File " + prev +" changed to " + nw + ".");
        }
        else
        {
          console.log("FIle name unchanged.");
        }
        
      }
  }
  catch(error) //sql-error8
  {
      errorLog("sql",error,8);

      r = {}; r.STATUS = error;
  }

  DB.end();

  console.log(r);

  return r;
}

/*DELETE QUERY*/

module.exports.DEL = async function DEL(TAB,WHERE)
{ 
  let Q = "CALL ss_" + TAB + "_DEL(?)";

  var DB = DBconnection();
  
  var r = "";

  DB.connect( (error) =>
  {
    if(error)
    {
      try
      {
        DB.end();
      }
      catch
      {}
      
      errorLog("sql",error,9); //sql-error9

      r = {"STATUS":error};
    }  
  });

  if(r.STATUS)
    return r;
  
  console.log("DELETE");

  console.log(Q);

  process.stdout.write("ID: "); console.log(WHERE);
  
  try
  {
    let [result,fields] = await DB.promise().query(Q,parseInt(WHERE));

    r = JSON.parse(JSON.stringify(result));

    let file = Object.keys(r)[0];
    
    if(TAB == "MUSIC")
    {
       let del = util.promisify(fs.unlink);

       let exists = util.promisify(fs.access);

       if(file)
       {
          r.affectedRows = 1;

          console.log("Attempting to delete file " + file)

          try
          {
            await exists("./files/music/" + file);

            await del("./files/music/" + file);

            console.log(file + " successfully deleted.")

          }
          catch(error)
          {
            console.log(error);

            r.message = "SUCCEEDED IN DELETING DATABASE ENTRY BUT NOT FILE";

          } 
       }
       else 
        r.affectedRows = 0;     
    }
    else if(TAB == "ROOMS")
    {
      r.affectedRows = r["1"];
    } 
  }
  catch(error) //sql-error10
  { 
    errorLog("sql",error,10);

    r = {}; r.STATUS = error;
  }

  DB.end();

  console.log(r);

  return r;
}