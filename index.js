const express = require('express');
const app = express();
const fileUpload = require('express-fileupload');
const fs = require('fs');
const cfg = require('./config');

let listener = app.listen(cfg.port, () => {
    console.log(`Server listening on port ${listener.address().port}!`);
    if(!fs.existsSync(__dirname + '/files/')) fs.mkdirSync(__dirname + '/files');
})

app.use(fileUpload());
app.use(express.static(__dirname + '/files/'));

app.post('/upload', (req, res) => {
    if(authorize(req, res)) return;

    let file;

    if(!req.files || Object.keys(req.files).length === 0)
    {
        res.status(400).send("Please provide the file!");
        return;
    } else {
        file = req.files[Object.keys(req.files)[0]];

        file.name = req.query.filename || file.name;
        let finalName = file.name.split(" ").join("_");

        if(fs.existsSync(__dirname + '/files/' + file.name) && req.query.overwrite !== 'true') {
            return res.status(503).send("The file you are trying to upload already exists in the CDN. Please add a paramater to the request query string `overwrite` and set it to true if you want to overwrite the file.")
        }
        
        file.mv(__dirname + '/files/' + finalName, err => {
            if(err) {
                console.error(err);
                return res.sendStatus(500);
            } else {
                res.send({
                  file_url: req.protocol + "://" + req.hostname + '/' + finalName
                });
            }
        })
        
    }
})

app.delete('/delete/:file', (req, res) => {
    if(authorize(req, res)) return;
    
    let file = req.params.file;

    file = file.split(" ").join("_");

    if(fs.existsSync(__dirname + '/files/' + file)) {
        fs.unlinkSync(__dirname + '/files/' + file);
    } else {
        return res.status(404).send("The file you are trying to delete is not already in the CDN!");
    }

    res.sendStatus(200);
})

app.get('/file_list', (req, res) => {
    if(authorize(req, res)) return;
    
    let files = fs.readdirSync(__dirname + '/files/', {});

    res.send(files);
})

function authorize(req, res) {
    if(!req.headers.authorization) {res.status(401).send("No authorization key was provided!");} else
    if(req.headers.authorization !== cfg.password) {res.status(401).send("Invalid authorization key! Please provide the valid authorization key!");}
    
    else { return false; }
}
