const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors')
const app = express();
const port = process.env.PORT || 5000;
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
require('dotenv').config();

// const corsOption = {
//   origin: ['http://localhost:5173'],
//   credentials: true,
//   optionSuccessStatus: 200
// }
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token
  console.log(token)
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err)
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.user = decoded
    next()
  })
}




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kg7cyoc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const usersCollection = client.db("stayvista").collection("users");
    const roomsCollection = client.db("stayvista").collection("rooms");

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
      })
        .send({ success: true });
    })

    // save or modify user email, status in DB....
    app.put('/users/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const option = { upsert: true };
      const isExist = await usersCollection.findOne(query);
      if (isExist) return res.send(isExist);
      const result = await usersCollection.updateOne(query,
        // we can add the Date.naw() function for record the users signUp time.
        {
          $set: { ...user, timestamp: Date.now() }
        },
        option
      )
      res.send(result);
    })
    // get user role....
    app.get('/user/:email', async (req, res) =>{
      const email = req.params.email;
      // const query = {email:email}
      const result = await usersCollection.findOne({email})
      res.send(result);
    })
    // LogOut......
    app.get('/logout', async (req, res) => {
      try {
        res.clearCookie('token', {
          maxAge: 0,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        }).send({ success: true })
      } catch (error) {
        res.status(500).send(error)
      }
    })
    // get all rooms....
    app.get('/rooms', async (req, res) => {
      const result = await roomsCollection.find().toArray();
      res.send(result);
    })
    // get rooms data for host...
    app.get('/rooms/:email', async (req, res) => {
      const email = req.params.email;
      const result = await roomsCollection.find({'host.email': email}).toArray();
      res.send(result);
    })
    // get single room data....
    app.get('/room/:id', async (req, res) => {
      const id = req.params.id;
      const result = await roomsCollection.findOne({ _id: new ObjectId(id) })
      res.send(result);
    })
    // post a room data....
    app.post('/rooms', verifyToken, async (req, res) => {
      const room = req.body;
      const result = await roomsCollection.insertOne(room);
      res.send(result);
    })


    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('server is running')
})
app.listen(port, () => {
  console.log(`server is running on port ${port}`)
})










// const express = require('express')
// const app = express()
// require('dotenv').config()
// const cors = require('cors')
// const cookieParser = require('cookie-parser')
// const { MongoClient, ServerApiVersion } = require('mongodb')
// const jwt = require('jsonwebtoken')
// // const morgan = require('morgan')
// const port = process.env.PORT || 5000

// // middleware
// const corsOptions = {
//   origin: ['http://localhost:5173', 'http://localhost:5174'],
//   credentials: true,
//   optionSuccessStatus: 200,
// }
// app.use(cors(corsOptions))
// app.use(express.json())
// app.use(cookieParser())
// // app.use(morgan('dev'))
// const verifyToken = async (req, res, next) => {
//   const token = req.cookies?.token
//   console.log(token)
//   if (!token) {
//     return res.status(401).send({ message: 'unauthorized access' })
//   }
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//     if (err) {
//       console.log(err)
//       return res.status(401).send({ message: 'unauthorized access' })
//     }
//     req.user = decoded
//     next()
//   })
// }
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kg7cyoc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// console.log(uri)

// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// })
// async function run() {
//   try {

//     const usersCollection = client.db("stayvista").collection("users");

//     // auth related api
//     app.post('/jwt', async (req, res) => {
//       const user = req.body
//       console.log('I need a new jwt', user)
//       const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
//         expiresIn: '365d',
//       })
//       res
//         .cookie('token', token, {
//           httpOnly: true,
//           secure: process.env.NODE_ENV === 'production',
//           sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
//         })
//         .send({ success: true })
//     })

//     // Logout
//     app.get('/logout', async (req, res) => {
//       try {
//         res
//           .clearCookie('token', {
//             maxAge: 0,
//             secure: process.env.NODE_ENV === 'production',
//             sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
//           })
//           .send({ success: true })
//         console.log('Logout successful')
//       } catch (err) {
//         res.status(500).send(err)
//       }
//     })

//     // Save or modify user email, status in DB
//     app.put('/users/:email', async (req, res) => {
//       const email = req.params.email
//       const user = req.body
//       const query = { email: email }
//       const options = { upsert: true }
//       const isExist = await usersCollection.findOne(query)
//       console.log('User found?----->', isExist)
//       if (isExist) return res.send(isExist)
//       const result = await usersCollection.updateOne(
//         query,
//         {
//           $set: { ...user, timestamp: Date.now() },
//         },
//         options
//       )
//       res.send(result)
//     })

//     // Send a ping to confirm a successful connection
//     await client.db('admin').command({ ping: 1 })
//     console.log(
//       'Pinged your deployment. You successfully connected to MongoDB!'
//     )
//   } finally {
//     // Ensures that the client will close when you finish/error
//     // await client.close();
//   }
// }
// run().catch(console.dir)

// app.get('/', (req, res) => {
//   res.send('Hello from StayVista Server..')
// })

// app.listen(port, () => {
//   console.log(`StayVista is running on port ${port}`)
// })
