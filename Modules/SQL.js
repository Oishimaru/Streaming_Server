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
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG, SSL_OP_TLS_ROLLBACK_BUG } = require('constants');
const { playlist } = require('./media-core');

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

function DBsuper()
{
  var con = mysql.createConnection({
  host: "localhost",
  user: "super_orbittas",
  password: "P4s5w0rd2++",
  database: "STREAMING_SERVER"
  });

  return con;
}

async function createTrigger(id,DB)
{
  let T1 = "CREATE TRIGGER ON_PT" + id.toString() + "_DEL ";
  let T2 = "AFTER DELETE ON PT" + id.toString() +  " FOR EACH ROW ";
  let T3 = "UPDATE PLAYLISTS SET TRACKS = TRACKS - 1 WHERE PL_TABLE_NAME = 'PT" + id.toString() + "'; ";

  await DB.promise().query(T1 + T2 + "BEGIN " + T3 + "END");
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

async function* itr(n)
{
  let i = 0;

  while(i < n)
    yield i++;
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

  let prefix = TAB.slice(0,2);

  let songs = null, ads = null, rates = null;

  if(prefix != "AT" && prefix != "PT")
  {  
    if(TAB == "PLAYLISTS")
    {
      if(COL.FIELD3)
      {
        songs = COL.FIELD3.toString().split(',');

        let len = songs.length; 
        
        COL.FIELD3 = len;
      }
      else
        COL.FIELD3 = 0;

      if(COL.FIELD2 == "TRUE")
      {
        COL.FIELD2 = true;

        if(COL.FIELD4 && COL.FIELD5 && COL.FIELD6)
        {
          rates = COL.FIELD4.split(',');

          ads = COL.FIELD5.split(',');

          let len = ads.length; 
          
          let min = 0, r = 0;

          for(let i = 0; i < len; i++)
          {
            r = parseInte(rates[i]);

            if((r < min && r > 0) || min == 0)
              min = r;
          }

          COL.FIELD4 = min;

          COL.FIELD5 = len;
        }
        else
        { 
          COL.FIELD4 = 0;

          COL.FIELD5 = 0;
        }
      }
      else
      {
        COL.FIELD2 = false;

        COL.FIELD4 = 0;

        COL.FIELD5 = 0;
      }
    }
    
    let c;

    for(let i = 0; i < keys.length; i++)
    {
      c = (TAB == "PLAYLISTS" && keys[i] == "FIELD6");

      if(keys[i] != "TARGET" && keys[i] != "TOKEN" && !c)
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

  }
  else
  {
    if(prefix != "AT")
    {
      Q = Q.replace(TAB,"PTX") + "?,?,?";
    }
    else
    {
      Q = Q.replace(TAB,"ATX") + "?,?,?,?,?"; 

      params = [TAB,parseInt(COL.FIELD1),parseInt(COL.FIELD2),COL.FIELD3,true];
    }  
  }
  
  Q += ')';

  let DB = DBconnection();

  let DB2 = DBsuper();

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

  if(TAB == "PLAYLISTS")
  {
    DB2.connect( (error) =>
    {
      if(error)
      {
        try
        {
          DB.end();
          DB2.end();
        }
        catch
        {}
        
        errorLog("sql",error,5); //sql-error5
        
        r = {}; r.STATUS = error;
      }  
    });

    if(r.STATUS)
      return r;
  }

  console.log("INSERT");

  console.log(Q);
  process.stdout.write("Parameters: "); console.log(params);
  
  let ins = 0;

  try
  {
    let result, fields, affectedRows = 0;

    if(prefix != "AT" && prefix != "PT" )
      [result,fields] = await DB.promise().query(Q,params);
    else
    {
      let WHERE = COL.FIELD1;
      
      if(WHERE[0] && WHERE.length > 0)
      {
        let song_ids = WHERE;

        for await(let i of itr(WHERE.length))
        {
          [result,fields] = await DB.promise().query(Q,[TAB,song_ids[i],true]);

          affectedRows++;
        }
      }
    }
    
    r = JSON.parse(JSON.stringify(result));

    if(affectedRows > 0 && r[0])
      r[0].affectedRows = affectedRows;
    else if(affectedRows > 0)
      r.affectedRows = affectedRows;

    if(TAB == "ROOMS")
    {   
      if( Object.values(r[0][0])[0] == 1)
      {
        r = [r[1]];

        r[0].affectedRows = 1;
      }       
      else
      {
        r = [r[1]];

        r[0].affectedRows = 0;
        
        r[0].message = "All ports might assigned.";
      }
    }
    else if(TAB == "PLAYLISTS")
    {
      let X = Object.values(r[0][0])[0];
      
      r =[r[1]];

      if(X)
      {
        r[0].affectedRows = 1;
        
        //await createTrigger(X,DB2);
      }
       

      if(COL.FIELD3)
      { 
        let len = songs.length;
      
        Q = "CALL ss_PTX_INS(?,?,?)";

        if(X)
        {
          let table = "PT" + X.toString();

          console.log(songs);

          for await(let i of itr(len))
          {
            let song = parseInt(songs[i]);

            console.log([table,song,false]);

            [result,fields] = await DB.promise().query(Q,[table,song,false]);

            r = JSON.parse(JSON.stringify(result));

            if(r.affectedRows)
              ins++;
          }

          r.affectedRows = ins + 1;

        }
        
        
        if(COL.FIELD2 && COL.FIELD4  && COL.FIELD5 && COL.FIELD6)
        {
          let pb = COL.FIELD6.split(',');

          let len = ads.length;

          Q = "CALL ss_ATX_INS(?,?,?,?,?)";

          if(X)
          {
            let table = "AT" + X.toString();
     
            for await (let i of itr(len))
            {
              let a = parseInt(ads[i]), p = pb[i], rt =parseInt(rates[i]);

              [result,fields] = await DB.promise().query(Q,[table,a,rt,p,false]);

              r = JSON.parse(JSON.stringify(result));

              if(r.affectedRows)
                ins++;
            }
            
            r.affectedRows = ins + 1;

          }
        }

        r = [r];
        
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

  if(TAB == "PLAYLISTS")
    DB2.end();

  return r;
}

/*UPDATE QUERY*/

module.exports.UPDT = async function UPDT(TAB,COL)
{
  let Q = "CALL ss_" + TAB + "_UPD(";

  let keys = Object.keys(COL);
  
  let params = [], mark = false;

  let prefix = TAB.slice(0,2);

  if(prefix != "PT" && prefix != "AT")
  {
    if(TAB == "PLAYLISTS")
    {
      if(COL.FIELD2 == "TRUE")
        COL.FIELD2 = true;
      else if(COL.FIELD2 == "FALSE")
        COL.FIELD2 = false;
    }
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
  }
  else
  {
    if(prefix != "AT")
    {
      Q = Q.replace(TAB,"PTX") + "?,?,?";

      params = [TAB,parseInt(COL.FIELD1),parseInt(COL.FIELD2)];
    }
    else
    {
      Q = Q.replace(TAB,"ATX") + "?,?,?,?,?"; 

      params = [TAB,parseInt(COL.FIELD1),parseInt(COL.FIELD2),COL.FIELD3,parseInt(COL.FIELD4)];
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

      console.log(r);

      let oldfile = null;
      
      if(r[0])
      {
        oldfile = Object.values(r[0][0])[0];

        console.log(oldfile);
      }
        

      if((TAB == "MUSIC" || TAB == "ADS") && oldfile)
      {
        let prev = oldfile;

        let nw  = COL.FIELD3;

        r = [r[1]];

        r[0].affectedRows = 1;

        if(prev != nw)
        {
          let rename = util.promisify(fs.rename);

          let path = "./files/" + TAB.toLowerCase() + "/";
        
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
  let Q = "CALL ss_" + TAB + "_DEL(?";

  let params = [];

  let prefix = TAB.slice(0,2);

  if(prefix == "AT" || prefix == "PT" )
  {
    Q = Q.replace(TAB, prefix + 'X') + ",?";

    params.push(TAB);
  }
  
  if(WHERE && !WHERE[0])
    params.push(parseInt(WHERE));
  
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
      
      errorLog("sql",error,9); //sql-error9

      r = {"STATUS":error};
    }  
  });

  if(r.STATUS)
    return r;
  
  console.log("DELETE");

  console.log(Q);

  process.stdout.write("Parameters: "); console.log(params);
  
  try
  {
    let result, fields, affectedRows = 0;

    if(prefix != "AT" && prefix != "PT" )
    {
      console.log("NON PTX OR ATX TABLE MANIPULATION");

      [result,fields] = await DB.promise().query(Q,params);
    }
    else
    {
      if(WHERE[0] && WHERE.length > 0)
      {
        console.log("PTX OR ATX TABLE MANIPULATION");
        
        let ids = WHERE;

        console.log(ids);

        for await(let i of itr(WHERE.length))
        {
          [result,fields] = await DB.promise().query(Q,[TAB,ids[i]]);

          affectedRows++;
        }
          
      }
    }

    r = JSON.parse(JSON.stringify(result));

    if(affectedRows > 0 && r[0])
    {
      r[1].affectedRows = r[0][0].affectedRows;

      r = [r[1]];
    }
    
    if(TAB == "MUSIC" || TAB == "ADS")
    {
       let del = util.promisify(fs.unlink);

       let exists = util.promisify(fs.access);

       let file = Object.values(r[0][0])[0];
        
       r = [r[1]];

       if(file)
       {
          r[0].affectedRows = 1;

          console.log("Attempting to delete file " + file)

          try
          {
            let path = "./files/" + TAB.toLowerCase() + "/";

            await exists(path + file);

            await del(path + file);

            console.log(file + " successfully deleted.");

          }
          catch(error)
          {
            console.log(error);

            r[0].message = "SUCCEEDED IN DELETING DATABASE ENTRY BUT NOT FILE";
          } 
       }
       else 
        r[0].affectedRows = 0;     
    }
    else if(TAB == "ROOMS")
    {
      console.log("Attemting to get ROOM deletion operation result:");

      console.log(r);

      let ar = r[0][0].CH;

      r = [r[1]];

      r[0].affectedRows = ar;

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