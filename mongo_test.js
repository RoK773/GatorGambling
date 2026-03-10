const { MongoClient, ServerApiVersion } = require('mongodb');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = "mongodb+srv://admin:admin1Password@cluster0.9uypigw.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    await client.connect();

    console.log("Connected to MongoDB");

    const db = client.db("User_Data");

    const users = db.collection("Users");

    const result = await users.insertOne({
      username: "testuser",
      age: 30,
      
      email: "test@example.com",
      passwordHash: "123456",
      createdAt: new Date()
    });

    console.log("User inserted with id:", result.insertedId);

    await client.db("admin").command({ ping: 1 });
    console.log("Ping successful");

  } finally {

    await client.close();

  }
}

run().catch(console.dir);