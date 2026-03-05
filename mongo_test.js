const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://admin:admin1Password@cluster0.9uypigw.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);

async function run() {
  await client.connect();
  console.log("Connected successfully!");
  await client.close();
}

run().catch(console.error);