/*******************************************************************************
********************************************************************************
*                                 SQL QUERIES                                  *
********************************************************************************
*******************************************************************************/

/**********************************MODULES*************************************/

const mysql = require('mysql2');

const fs = require('fs');

const util = require('util');

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

async function portAvailable(DB,s)
{
  let r = s;

  if(r.STATUS)
    return r;

  r = null;

  console.log("SELECT");

  let Q = "SELECT * FROM TCP_PORTS WHERE PORT_STATUS = 'UNASSIGNED' LIMIT 1;"

  try
  {
    let result = await DB.promise().query(Q);
    
    console.log("TROUBLEMAKER?")

    r = JSON.parse(JSON.stringify(result[0][0]));
      
    console.log(r);

    r = r.ID;

    console.log("TROUBLEMAKER?")
    console.log(r);
  }
  catch(error) //sql-error0
  {
      errorLog("sql",error,0);

      r = {};

      r.STATUS = error.toString();
  }
  
  return r;
}

async function portAssign(port,DB,s)
{
  let r = s;
  
  if (port.STATUS)
    return port;

  if(r.STATUS)
    return r;
  
  r = null;

  console.log("UPDATE");

  let q1 = "UPDATE TCP_PORTS "
  let q2 = "SET PORT_STATUS = 'ASSIGNED' "
  let q3 = "WHERE ID = " + port.toString() + ";";

  let Q = q1 + q2 + q3;

  try
  {
    let result = await DB.promise().query(Q);

    r = JSON.parse(JSON.stringify(result))
    
    console.log(r);
  }
  catch(error) //sql-error1
  {
      errorLog("sql",error,1);

      r.STATUS = error.toString();
  }

  return r;
}

async function portUnassign(port,DB,s)
{
  let r = s;
  
  if (port.STATUS)
    return port;

  if(r.STATUS)
    return r;

  r = null;

  console.log("UPDATE");

  let q1 = "UPDATE TCP_PORTS "
  let q2 = "SET PORT_STATUS = 'UNASSIGNED' "
  let q3 = "WHERE ID = " + port.toString() + ";";

  let Q = q1 + q2 + q3;

  try
  {
    let result = await DB.promise().query(Q);

    r = JSON.parse(JSON.stringify(result));
      
    console.log(r);
  }
  catch(error) //sql-errror2
  {
      errorLog("sql",error,2);

      r = {};

      r.STATUS = error.toString();
  }

  return r;
}

/**********************************EXPORTS************************************/

/*SELECT QUERY*/

module.exports.SEL = async function SEL(S,TAB,WHERE)
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

  if(WHERE)
  {
    if(TAB == "TAGS")
      Q += "WHERE TAG = '" + WHERE + "'";
    else
      Q += "WHERE ID = " + WHERE.toString();
  }
  
  try
  {
    let [result,fields] = await DB.promise().query("SELECT " + S +  " FROM " + Q + ";");

    r = JSON.parse(JSON.stringify(result));

    console.log(r);
  }
  catch(error) //sql-error4
  {
    errorLog("sql",error,4);
    
    r = {};

    r.STATUS = error;
  }

  DB.end();

  return r;
}

/*INSERT QUERY*/

module.exports.INS = async function INS(TAB,COL)
{
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
      {

      }
      
      errorLog("sql",error,5); //sql-error5
      
      r = {};

      r.STATUS = error;
    }  
  });

  if(r.STATUS)
    return r;

  console.log("INSERT");

  let q1 = "INSERT INTO " + TAB;

  let q2;

  let q3;

  let port;


  switch(TAB)
  {
    case "ROOMS":
    {
      q2  = " (ROOM_NAME,READER_ID,SPEAKER_ID,PORT_ID) ";

      port = await portAvailable(DB,r);   
      
      if(port.STATUS)
      {
        DB.end();

        return port;
      }
        
      q3 =  "VALUES ('" + COL.FIELD1 + "','" + COL.FIELD2 + "','" + COL.FIELD3 + "'," + port.toString() + ");";
      
      break;
    }

    case "TAGS":
    {
      q2 = " (TAG,SONG_ID,DATE_REG) ";

      q3 =  "VALUES ('" + COL.FIELD1 + "'," + COL.FIELD2 + ",'" + Date.now().toString() + "';";

      break;
    }

    case "MUSIC":
    {
      q2 = " (SONG_NAME,ARTIST,FL_NAME) ";

      q3 =  "VALUES ('" + COL.FIELD1 + "','" + COL.FIELD2 + "','" + COL.FIELD3 + "');";

      break;
    }

    default:
    {
      q1 = "INSERT INTO TEST";

      q2 = " (ID,ANIMAL,COLOR) ";

      let F2 = "'" + COL.FIELD2;
      F2 += "'";

      let F3 = "'" + COL.FIELD3;
      F3 += "'";

      q3 = "VALUES (" + COL.FIELD1 + "," + F2 + "," + F3 + ";";

      break;
    }
  }

  let Q =  q1 + q2 + q3;
  
  console.log(Q);

  console.log("wa");

  try
  {
    let result = await DB.promise().query(Q);

    if(TAB == "ROOMS")
    {
      r = await portAssign(port,DB,r);

      if(r.STATUS)
      {
        DB.end();

        return r;
      }
    }

    r = JSON.parse(JSON.stringify(result));
      
    console.log(r);
  }
  catch(error) //sql-error6
  {
      errorLog("sql",error,6);

      r = {};

      r.STATUS = error;

      console.log(r);
  }

  DB.end();

  return r;
}

/*UPDATE QUERY*/

module.exports.UPDT = async function UPDT(TAB,COL)
{
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
      {

      }
      
      errorLog("sql",error,7); //sql-error7

      r = {};

      r.STATUS = error;
    }  
  });

  if(r.STATUS)
    return r;

  console.log("UPDATE");

  let q1 = "UPDATE " + TAB + "SET";

  let q2;

  let q3;
  
  switch(TAB)
  {
    case "ROOMS":
    {
      q2  = " ROOM_NAME = '"+ COL.FIELD1 +"', READER_ID = '"+ COL.FIELD2 +"', SPEAKER_ID = '" + COL.FIELD3 + "' ";
      
      q3 = "WHERE ID = " + COL.FIELD4 + ";";

      break;
    }

    case "TAGS":
    {
      q2 = " TAG = '" + COL.FIELD1 + "', SONG_ID = " + COL.FIELD2 + " ";

      q3 = "WHERE ID = " + COL.FIELD3 + ";";

      break;
    }

    case "MUSIC":
    {
      q2 = " SONG_NAME = '" + COL.FIELD1 + "', ARTIST = '" + COL.FIELD2 + "', FL_NAME = '" + COL.FIELD3 + "' ";

      q3 = "WHERE ID = " + COL.FIELD4 + ";";

      break;
    }
  }



  let Q =  q1 + q2 + q3;
  
  try
  {
    let result = await DB.promise().query(Q);

    r = JSON.parse(JSON.stringify(result));
    
    console.log(r);
  }
  catch(error) //sql-error8
  {
      errorLog("sql",error,8);

      r = {};

      r.STATUS = error;
  }

  DB.end();

  return r;
}

/*DELETE QUERY*/

module.exports.DEL = async function DEL(TAB,WHERE)
{ 
  var query;

  if(TAB = "ROOMS")
    query = SQL.SEL("*",TAB,WHERE);

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
      {

      }
      
      errorLog("sql",error,9); //sql-error9

      r = {"STATUS":error};
    }  
  });

  if(r.STATUS)
    return r;
  
  console.log("DELETE");

  let Q = TAB + " WHERE ID = " + WHERE.toString();
  
  try
  {
    let result = DB.query("DELETE FROM " + Q + ";");

    if(TAB == "ROOMS")
    {
      if(query[0] && !query.STATUS)
        portUnassign(query[0].PORT_ID,DB,r);
    }

    r = JSON.parse(JSON.stringify(result));
      
    console.log(r);
  }
  catch(error) //sql-error10
  { 
    errorLog("sql",error,10);

    r = {};

    r.STATUS = error;
  }

  DB.end();

  return r;
}