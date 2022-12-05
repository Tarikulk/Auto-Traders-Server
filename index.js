const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET);

const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())

 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mtnim2c.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 }); 


function verifyJWT(req, res, next){
      const authHeader = req.headers.authorization;
      if(!authHeader){
        return res.status(401).send({message : "unauthorized access"})
      }

      const token = authHeader.split(" ")[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(403).send({message: "forbidden access"})
        }
        req.decoded =  decoded;
        next()
      })
}


async function run(){
    try{
        const userCollection = client.db("resaleWebServer").collection("users");
        const carCategoryCollection = client.db("resaleWebServer").collection("categories")
        const categoriesCarCollection = client.db("resaleWebServer").collection("categoriesCar")
        const bookingsCarCollection = client.db("resaleWebServer").collection("bookings")
        const paymentsCollection = client.db("resaleWebServer").collection("payments")
        const advertiseCollection = client.db("resaleWebServer").collection("advertise")

  
        app.put("/user", async(req, res) =>{
            const email = req.query.email;
            const user = req.body;
            const filter = {email: email}
            const options = {upsert: true}
            const updatedDoc = {
                $set: user,
            } 
            const result = await userCollection.updateOne(filter, updatedDoc, options); 

            if(user){
                const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                    expiresIn:"1d",
                })
                return res.send({result, token})
            }
             res.status(403).send({message: "unauthorized access"})

        })


        app.put("/user/verify/:id", verifyJWT, async(req, res) =>{
             const decodedEmail = req.decoded.email;
             const query = {email: decodedEmail};
             const user = await userCollection.findOne(query);
             if(user.role !== "admin"){
                res.status(403).send({message: "forbidden access"})
             }
             const id = req.params.id;
             const filter = {_id : ObjectId(id)};
             const options = {upsert : true};
             const updatedDoc = {
                $set:{
                    status: "verify"
                }
             }
             const result = await userCollection.updateOne(filter, updatedDoc, options);
             res.send(result);
        })


        app.get("/user/:email", verifyJWT, async(req, res) =>{
            const email = req.params.email;
            const query = {email:email};
            const user = await userCollection.findOne(query);
            res.send(user)
        })

        
        app.get("/categories", async(req, res) =>{
            const query = {}
            const category = await carCategoryCollection.find(query).toArray();
            res.send(category);
        }) 
        
        app.get("/categoriesCar/:id", async(req, res) =>{
            const id = req.params.id
            const query = {}
            const categoriesCar = await categoriesCarCollection.find(query).toArray();
            const singleCategory = categoriesCar.filter(category => category.category_id === id)
            res.send(singleCategory);
        })
 
        app.get("/categoriesCar", async(req, res) =>{
            const email = req.query.email
            const query = {email:  email}
            const categories = await categoriesCarCollection.find(query).toArray();
            res.send(categories)
        })

        app.post("/categoriesCar", verifyJWT, async(req, res) =>{
            const categoriesCar = req.body;
            const result = await categoriesCarCollection.insertOne(categoriesCar);
            res.send(result);
        })

        app.delete("/categoriesCar/:id", async(req, res) =>{
            const id = req.params.id;
            const filter = {_id : ObjectId(id)}
            const result = await categoriesCarCollection.deleteOne(filter);
            res.send(result);
        })
        
        
        app.post("/bookings", verifyJWT, async(req, res) =>{
            const booking = req.body;
            const result = await bookingsCarCollection.insertOne(booking);
            res.send(result);
        }) 
        
        app.get("/bookings", verifyJWT, async(req, res) =>{
            const email = req.query.email; 
            const query = {email:  email}
            const bookings = await bookingsCarCollection.find(query).toArray();
            res.send(bookings)
        })
        
        app.get("/bookings/:id", async(req, res) =>{
            const id = req.params.id;
            const query = {_id : ObjectId(id)}
            const booking = await bookingsCarCollection.findOne(query);
            res.send(booking);
        })

        app.get("/allSellers", verifyJWT, async(req, res) =>{
            const query = {}
            const allSellers = await userCollection.find(query).toArray();
            const sellers = allSellers.filter(seller => seller.role === "seller");
            res.send(sellers);
        })

        app.delete("/allSellers/:id", verifyJWT, async(req, res) =>{
            const id = req.params.id;
            const filter = {_id : ObjectId(id)}
            const result = await userCollection.deleteOne(filter);
            res.send(result); 
        })

        app.get("/allBuyers", verifyJWT, async(req, res) =>{
            const query = {}
            const allBuyers = await userCollection.find(query).toArray();
            const buyers = allBuyers.filter(seller => seller.role === "buyer");
            res.send(buyers);
        })

        app.delete("/allBuyers/:id", verifyJWT, async(req, res) =>{
            const id = req.params.id;
            const filter = {_id : ObjectId(id)}
            const result = await userCollection.deleteOne(filter);
            res.send(result); 
        })

        app.post("/advertise", verifyJWT, async(req, res) =>{
            const advertise = req.body;
            const result = await advertiseCollection.insertOne(advertise);
            res.send(result);
        })

        app.get("/advertise", async(req, res) =>{
            const query = {}
            const advertise = await advertiseCollection.find(query).toArray();
            res.send(advertise);
        })
        
        app.post("/create-payment-intent", async(req, res) =>{
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;
    
            const paymentIntent = await stripe.paymentIntents.create({
                currency: "usd",
                amount : amount,
                "payment_method_types": [
                    "card"
                ]
            })
            res.send({
                clientSecret: paymentIntent.client_secret, 
            })
        })

        app.post("/payments", async(req, res) =>{
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId;
            const filter = {_id : ObjectId(id)}
            const updatedDoc = {
                $set:{
                   paid: true,
                   transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingsCarCollection.updateOne(filter, updatedDoc)
            res.send(result);
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