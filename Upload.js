const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');

const app = express();

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

app.listen(port, () => 
  console.log(`App is listening on port ${port}.`)
);

app.post('/upload-audio', async (req, res) => {
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
            let audio = req.files.audio;
            
            //Use the mv() method to place the file in upload directory (i.e. "uploads")
            audio.mv('./music/' + audio.name);

            //send response
            res.send({
                status: true,
                message: 'File is uploaded',
                data: {
                    name: audio.name,
                    mimetype: audio.mimetype,
                    size: audio.size
                }
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }
});