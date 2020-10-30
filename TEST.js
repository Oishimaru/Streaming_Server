const { notStrictEqual } = require('assert');
const mysql = require('mysql');


function DBconnection()
{
  var con = mysql.createConnection({
  host: "localhost",
  user: "adonis",
  password: "password",
  database: "streaming_server"
  });

  return con;
}


function query(DB)
{

    DB.query("SELECT * FROM ROOMS WHERE ID = 1", function (err, result, fields) {
        if (err) throw err;
        DB.end();
        var r = JSON.parse(JSON.stringify(result));
        console.log(r);
    
        console.log("ROOM ID: "  + r[0].ID + " R: " + r[0].READER_ID + " S: " + r[0].SPEAKER_ID);
    
        });
}

function SEL()
{
    var DB = DBconnection();

        
    DB.connect( (error) =>
    {
        if(error)
        {
         DB.end();
      
        console.log(error);

        r = {"STATUS":error};
        }  
    });

    query(DB);

    DB.end();
}
