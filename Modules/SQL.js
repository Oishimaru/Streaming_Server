/*******************************************************************************
********************************************************************************
*                                 SQL QUERIES                                  *
********************************************************************************
*******************************************************************************/

/**********************************MODULES*************************************/

const mysql = require('mysql2');

/*********************************FUNCTIONS***********************************/

function DBconnection()
{
  var con = mysql.createConnection({
  host: "localhost",
  user: "adonis",
  password: "password",
  database: "STREAMING_SERVER"
  });

  return con;
}

async function portAvailable(DB,s)
{
  let r = s;

  if(r.STATUS)
    return r;

  r = null;

  console.log("SELECT");

  let Q = "SELECT * FROM TCP_PORTS WHERE PORT_STATUS = 'UNASSIGNED' TOP 1;"

  try
  {
    let result = await DB.promise().query(Q);
    
    r = JSON.parse(JSON.stringify(result));
      
    console.log(r);

    r = r.ID;
  }
  catch(error)
  {
      console.log(error);

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
  catch(error)
  {
      console.log(error);

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
  catch(error)
  {
      console.log(error);

      r.STATUS = error.toString();
  }

  return r;
}

/**********************************EXPORTS************************************/

/*SELECT QUERY*/

module.exports.SEL = async function SEL(S,TAB,WHERE)
{  
  let DB = DBconnection();
  
  let r = null;

  DB.connect( (error) =>
  {
    if(error)
    {
      DB.end();
      
      console.log(error);

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
  catch(error)
  {
    console.log(error);  
    
    r = null;

    r.STATUS = error;
  }

  DB.end();

  return r;
}

/*INSERT QUERY*/

module.exports.INS = async function INS(TAB,COL)
{
  let DB = DBconnection();

  let r = null;
    
  DB.connect( (error) =>
  {
    if(error)
    {
      DB.end();
      
      console.log(error);

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

      port = portAvailable(DB,r);   
      
      if(port.STATUS)
      {
        DB.end();

        return port;
      }
        
      q3 =  "VALUES ('" + COL.FIELD1, + "','" + COL.FIELD2 + "','" + COL.FIELD3 + "'," + port.toString() + ");";
      
      break;
    }

    case "TAGS":
    {
      q2 = " (TAG,SONG_ID,DATE_REG) ";

      q3 =  "VALUES ('" + COL.FIELD1, + "'," + COL.FIELD2 + ",'" + Date.now().toString() + "';";

      break;
    }

    case "MUSIC":
    {
      q2 = " (SONG_NAME,ARTIST,FL_NAME) ";

      q3 =  "VALUES ('" + COL.FIELD1, + "','" + COL.FIELD2 + "','" + COL.FIELD3 + "';";

      break;
    }
  }

  let Q =  q1 + q2 + q3;
  
  try
  {
    let result = await DB.promise().query(Q);

    if(TAB == "ROOMS")
    {
      r = portAssign(port,DB,r);

      if(r.STATUS)
      {
        DB.end();

        return r;
      }
    }

    r = JSON.parse(JSON.stringify(result));
      
    console.log(r);
  }
  catch(error)
  {
      console.log(error);

      r.STATUS = error;
  }

  DB.end();

  return r;
}

/*UPDATE QUERY*/

module.exports.UPDT = async function UPDT(TAB,COL)
{
  let DB = DBconnection();

  let r = null;
    
  DB.connect( (error) =>
  {
    if(error)
    {
      DB.end();
      
      console.log(error);

      r.STATUS = error;
    }  
  });

  if(r.STATUS)
    return r;

  console.log("UPDATE");

  let q1 = "UPDATE " + TAB + "SET";

  let q2;

  switch(TAB)
  {
    case "ROOMS":
    {
      q2  = " ROOM_NAME = '"+ COL.FIELD2 +"', READER_ID = '"+ COL.FIELD3 +"', SPEAKER_ID = '" + COL.FIELD4 + "' ";
      
      break;
    }

    case "TAGS":
    {
      q2 = " TAG = '" + COL.FIELD2 + "', SONG_ID = " + COL.FIELD3 + " ";

      break;
    }

    case "MUSIC":
    {
      q2 = " SONG_NAME = '" + COL.FIELD2 + "', ARTIST = '" + COL.FIELD3 + "', FL_NAME = '" + COL.FIELD4 + "' ";

      break;
    }
  }

  let q3 = "WHERE ID = " + COL.FIELD1 + ";";

  let Q =  q1 + q2 + q3;
  
  try
  {
    let result = await DB.promise().query(Q);

    r = JSON.parse(JSON.stringify(result));
    
    console.log(r);
  }
  catch(error)
  {
      console.log(error);

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
      DB.end();
      
      console.log(error);

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
  catch(error)
  { 
    console.log(error);

    r = {"STATUS":error};
  }

  DB.end();

  return r;
}