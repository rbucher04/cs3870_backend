import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

// Load environment variables FIRST
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // replaces body-parser

// Server configuration
const PORT = process.env.PORT ?? 8081;
const HOST = process.env.HOST ?? "0.0.0.0";
// MongoDB configuration
const MONGO_URI = process.env.MONGO_URI;
const DBNAME = process.env.DBNAME;
const collection = process.env.COLLECTION;


// MongoDB
// const url = "mongodb+srv://rbucher_db_user:DSQZS8XnmWDfbb3V@cluster0.korfgoo.mongodb.net/?appName=Cluster0";
// const dbName = "cs3870db";
// const collection = "contacts";
const client = new MongoClient(MONGO_URI);
const db = client.db(DBNAME);

app.get("/name", (req, res) => {
res.send("My name is Abraham");
} );

app.get("/contacts", async(req, res) => { 
    await client.connect();
    console.log("Node connected successfully to GET MongoDB");

    const query = {};
    const results = await db
      .collection(collection)
      .find(query)
      .limit(100)
      .toArray();
    console.log(results);

    res.status(200);
    // res.send(results);
    res.json(results);
} );

app.get("/contacts/:name", async (req, res) => { 
  const contactName = req.params.name;
  console.log("Contact to find :", contactName);
  await client.connect();
  console.log("Node connected successfully to GET-id MongoDB");
  const query = { contact_name: contactName };
  const results = await db.collection(collection).findOne(query);
  console.log("Results :", results);
  if (!results) {
    res.status(404);
    res.send("Not Found");
  } else {
    res.status(200);
    res.json(results);
  }
});

app.post("/contacts", async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .send({ message: "Bad request: No data provided." });
    }

    const { contact_name, phone_number, message, image_url } = req.body;

    // Connect to MongoDB
    await client.connect();
    console.log("Node connected successfully to POST MongoDB");

    const contactsCollection = db.collection(collection);

    // Check if contact already exists
    const existingContact = await contactsCollection.findOne({
      contact_name: contact_name,
    });
    if (existingContact) {
      return res.status(409).json({
        message: `Contact with name '${contact_name}' already exists.`,
      });
    }

    // Create new Document to POST
    const newDocument = {
      contact_name,
      phone_number,
      message,
      image_url,
    };
    console.log(newDocument);

    const result = await contactsCollection.insertOne(newDocument);
    console.log("Document inserted:", result);

    res.status(201);
    res.json({ message: "New contact added successfully" });
  } catch (error) {
    console.error("Error in POST /contacts:", error);
    res.status(500);
    res.json({ message: "Failed to add contact: " + error.message });
  } finally {
    await client.close();
  }
});

app.delete("/contacts/:name", async (req, res) => {
  try {
    // Read parameter id
    const name = req.params.name;
    console.log("Contact to delete :", name);
    // Connect to MongoDB
    await client.connect();
    console.log("Node connected successfully to POST MongoDB");
    // Reference collection
    const contactsCollection = db.collection(collection);
    // Check if contact already exists
    const existingContact = await contactsCollection.findOne({
      contact_name: name,
    });
    if (!existingContact) {
      return res.status(404).json({
        message: `Contact with name ${name} does NOT exist.`,
      });
    }
    // Define query
    const query = { contact_name: name };
    // Delete one contact
    const results = await db.collection("contacts").deleteOne(query);
    // Response to Client
    res.status(200);
    // res.send(results);
    res.send({ message: `Contact ${name} was DELETED successfully.` });
  } catch (error) {
    console.error("Error deleting robot:", error);
    res.status(500).send({ message: "Internal Server Error" + error });
  }
});

app.put("/contacts/:name", async (req, res) => {
  try {
    const oldName = req.params.name;
    const { contact_name, phone_number, message, image_url } = req.body;

    await client.connect();
    console.log("Connected to MongoDB for PUT");

    const contactsCollection = db.collection(collection);

    // Check if contact exists
    const existing = await contactsCollection.findOne({
      contact_name: oldName,
    });

    if (!existing) {
      return res.status(404).json({
        message: `Contact '${oldName}' not found.`,
      });
    }

    // Update document
    const updateDoc = {
      $set: {
        contact_name,
        phone_number,
        message,
        image_url,
      },
    };

    await contactsCollection.updateOne(
      { contact_name: oldName },
      updateDoc
    );

    res.status(200).json({
      message: `Contact '${oldName}' updated successfully.`,
    });

  } catch (error) {
    console.error("Error in PUT:", error);
    res.status(500).json({ message: "Failed to update contact." });
  } finally {
    await client.close();
  }
});



// Start server
app.listen(PORT, HOST, () => {
console.log(`Server running at http://${HOST}:${PORT}`);
});