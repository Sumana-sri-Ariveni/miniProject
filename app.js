const dotenv = require('dotenv').config();   // environmental variables

const express = require('express');    //using express

const app = express();

const request = require("request");   //using request module for api's

const bodyParser = require("body-parser");   //using body parser for to handle json files

// middlewares
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended : false}));
app.use(express.static("public"));
app.use(express.static("scripts"));
app.set("view engine","ejs");
app.use("",require('./routes/routs'));
app.use(express.static("images"));
app.use(express.static("images/sahithi"));
app.use(express.static("images/sumedha"));
app.use(express.static("images/triveni"));
app.use(express.static("images/ASR"));
app.use(express.static("images/VSR"));
app.use(express.static("images/VVK"));
app.use(express.static("components"));

const port = dotenv.PORT||1001;
app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`);
});