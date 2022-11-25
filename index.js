const express = require("express");
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())

 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mtnim2c.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 }); 


async function run(){
    try{
        const userCollection = client.db("resaleWebServer").collection("users");
        const carCategoryCollection = client.db("resaleWebServer").collection("categories")
        const categoriesCarCollection = client.db("resaleWebServer").collection("categoriesCar")


        app.put("/user/:email", async(req, res) =>{
            const email = req.params.email;
            const user = req.body;
            const filter = {email: email}
            const options = {upsert: true}
            const updatedDoc = {
                $set: user,
            } 
            const result = await userCollection.updateOne(filter, updatedDoc, options);

            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn:"1d",
            })
            console.log(token)

            res.send({result, token})
        })

        app.get("/categories", async(req, res) =>{
            const query = {}
            const category = await carCategoryCollection.find(query).toArray();
            res.send(category);
        }) 



        
         
    }
    finally{

    }
}

run().catch(error => console.error(error))


app.get("/", async(req, res) =>{
    res.send("Resale Web Server is running")
});


app.listen(port, () =>{
    console.log(`The server is running on port ${port}`)
});