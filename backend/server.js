const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

let applicationsCollection;

async function startServer() {
    try {
        await client.connect();

        const database = client.db("CareerTrack");
        applicationsCollection = database.collection("applications");

        await database.command({ ping: 1 });

        console.log("MongoDB connected successfully!");

        app.get("/api/test", (req, res) => {
            res.json({
                success: true,
                message: "Backend connected successfully!"
            });
        });

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
    }
}

app.get("/", (req, res) => {
    res.json({
        message: "CareerTrack API is running successfully!"
    });
});

app.get("/api/applications", async (req, res) => {
    try {
        const applications = await applicationsCollection
            .find()
            .sort({ createdAt: -1 })
            .toArray();

        res.json(applications);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch applications"
        });
    }
});

app.post("/api/applications", async (req, res) => {
    try {
        const application = {
            company: req.body.company,
            role: req.body.role,
            status: req.body.status || "Applied",
            appliedDate: req.body.appliedDate || new Date().toISOString().split("T")[0],
            jobUrl: req.body.jobUrl || "",
            notes: req.body.notes || "",
            createdAt: new Date(),
        };

        const result = await applicationsCollection.insertOne(application);

        res.status(201).json({
            message: "Application added successfully",
            id: result.insertedId,
            application: { ...application, _id: result.insertedId }
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to add application"
        });
    }
});

app.patch("/api/applications/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        delete updateData._id;

        const result = await applicationsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Application not found" });
        }

        res.json({ message: "Application updated successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update application"
        });
    }
});

app.delete("/api/applications/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await applicationsCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Application not found" });
        }

        res.json({ message: "Application deleted successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete application"
        });
    }
});

startServer();