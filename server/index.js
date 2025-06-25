// Required modules
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const { ObjectId } = require("mongodb");

// Basic config
const app = express();
const port = 3001;
const url = "mongodb://localhost:27017";
const dbName = "notesdb";

// Middleware setup
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(express.json());

let db;

// Connect to MongoDB
MongoClient.connect(url, { useUnifiedTopology: true })
  .then((client) => {
    console.log("✅ Connected to MongoDB");
    db = client.db(dbName);

    // ✅ All routes inside here
    app.get("/", (req, res) => {
      res.send("Backend is working!");
    });

    app.post("/add-note", async (req, res) => {
      const { title, content } = req.body;
      if (!title || !content) {
        return res
          .status(400)
          .json({ error: "Title and content are required" });
      }

      try {
        const notesCollection = db.collection("notes");
        const result = await notesCollection.insertOne({ title, content });
        res.status(201).json({ message: "Note saved", id: result.insertedId });
      } catch (err) {
        console.error("❌ Failed to save note:", err);
        res.status(500).json({ error: "Failed to save note" });
      }
    });

    app.get("/notes", async (req, res) => {
      try {
        const notesCollection = db.collection("notes");
        const notes = await notesCollection.find({}).toArray();
        res.status(200).json(notes);
      } catch (err) {
        console.error("❌ Failed to fetch notes:", err);
        res.status(500).json({ error: "Failed to fetch notes" });
      }
    });

    app.delete("/delete-note/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const result = await db
          .collection("notes")
          .deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
          res.status(200).json({ message: "Note deleted" });
        } else {
          res.status(404).json({ error: "Note not found" });
        }
      } catch (err) {
        console.error("❌ Failed to delete note:", err);
        res.status(500).json({ error: "Failed to delete note" });
      }
    });

    app.put("/edit-note/:id", async (req, res) => {
      const { id } = req.params;
      const { title, content } = req.body;

      try {
        const result = await db
          .collection("notes")
          .updateOne({ _id: new ObjectId(id) }, { $set: { title, content } });

        if (result.modifiedCount === 1) {
          res.status(200).json({ message: "Note updated" });
        } else {
          res.status(404).json({ error: "Note not found or not updated" });
        }
      } catch (err) {
        console.error("❌ Failed to update note:", err);
        res.status(500).json({ error: "Failed to update note" });
      }
    });

    // ✅ Start server
    app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
    });
  })
  .catch((error) => console.error("❌ MongoDB connection failed:", error));
