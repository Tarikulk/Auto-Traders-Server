const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();



app.get("/", async(req, res) =>{
    res.send("Resale Web Server is running")
});



app.listen(port, () =>{
    console.log(`The server is running on port ${port}`)
});