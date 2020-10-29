const express = require('express');
const app = express();
const fileUpload = require('express-fileupload');
const fs = require('fs');
const cfg = require('./config');

let listener = app.listen(80, () => {
    console.log(`Server listening on port ${listener.address().port}!`);
    if(!fs.existsSync(__dirname + '/files/')) fs.mkdirSync(__dirname + '/files');
})

app.use(fileUpload());
app.use(express.static(__dirname + '/files/'));

app.post('/upload', (req, res) => {    
    if(!req.headers.authorization) return res.status(401).send("No authorization key was provided!");
    if(req.headers.authorization !== cfg.password) return res.status(401).send("Invalid authorization key! Please provide the valid authorization key!");

    let file;

    if(!req.files || Object.keys(req.files).length === 0)
    {
        res.status(400).send("Please provide the file!");
        return;
    } else {
        file = req.files[Object.keys(req.files)[0]];

        if(fs.existsSync(__dirname + '/files/' + file.name) && req.query.overwrite !== 'true') {
            return res.status(503).send("The file you are trying to upload already exists in the CDN. Please add a paramater to the request query string `overwrite` and set it to true if you want to overwrite the file.")
        }


        file.mv(__dirname + '/files/' + file.name, err => {
            if(err) {
                console.error(err);
                return res.sendStatus(500);
            } else {
                res.sendStatus(200);
            }
        })
    }
})
