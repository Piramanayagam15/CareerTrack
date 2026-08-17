const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authenticateToken = require("./authMiddleware");

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || "CareerTrack_secure_secret_2026_new_8xP4mK7";

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

let applicationsCollection;
let usersCollection;

async function startServer() {
    try {
        await client.connect();

        const database = client.db("CareerTrack");
        applicationsCollection = database.collection("applications");
        usersCollection = database.collection("users");

        await database.command({ ping: 1 });
        console.log("MongoDB connected successfully!");

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
    }
}

// Health check routes
app.get("/", (req, res) => {
    res.json({
        message: "CareerTrack API is running successfully!",
        status: "online",
        timestamp: new Date()
    });
});

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "Backend connected successfully!"
    });
});

// User Signup
app.post("/api/auth/signup", async (req, res) => {
    try {
        if (!usersCollection) {
            return res.status(503).json({ message: "Database not connected yet" });
        }

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await usersCollection.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists with this email"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = {
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            createdAt: new Date()
        };

        const result = await usersCollection.insertOne(user);
        const userIdStr = result.insertedId.toString();

        const token = jwt.sign(
            { userId: userIdStr, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "Account created successfully",
            token,
            user: { id: userIdStr, name: user.name, email: user.email }
        });

    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({
            message: "Failed to create account"
        });
    }
});

// User Login
app.post("/api/auth/login", async (req, res) => {
    try {
        if (!usersCollection) {
            return res.status(503).json({ message: "Database not connected yet" });
        }

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await usersCollection.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const userIdStr = user._id.toString();
        const token = jwt.sign(
            {
                userId: userIdStr,
                email: user.email,
                name: user.name || "User"
            },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: userIdStr,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Login failed"
        });
    }
});

// Verify Current User Session
app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
        if (!usersCollection) {
            return res.status(503).json({ message: "Database not connected yet" });
        }

        const user = await usersCollection.findOne(
            { _id: new ObjectId(req.user.userId) },
            { projection: { password: 0 } }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Auth Me error:", error);
        res.status(500).json({ message: "Failed to verify session" });
    }
});

// Get Applications for Logged In User
app.get("/api/applications", authenticateToken, async (req, res) => {
    try {
        if (!applicationsCollection) {
            return res.status(503).json({ message: "Database not connected yet" });
        }

        const applications = await applicationsCollection
            .find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .toArray();

        res.json(applications);
    } catch (error) {
        console.error("Fetch applications error:", error);
        res.status(500).json({
            message: "Failed to fetch applications"
        });
    }
});

// Add New Application
app.post("/api/applications", authenticateToken, async (req, res) => {
    try {
        if (!applicationsCollection) {
            return res.status(503).json({ message: "Database not connected yet" });
        }

        const { company, role, status, appliedDate, jobUrl, notes } = req.body;

        if (!company || !company.trim() || !role || !role.trim()) {
            return res.status(400).json({
                message: "Company name and job role are required"
            });
        }

        const application = {
            userId: req.user.userId,
            company: company.trim(),
            role: role.trim(),
            status: status || "Applied",
            appliedDate: appliedDate || new Date().toISOString().split("T")[0],
            jobUrl: jobUrl ? jobUrl.trim() : "",
            notes: notes ? notes.trim() : "",
            createdAt: new Date(),
        };

        const result = await applicationsCollection.insertOne(application);

        res.status(201).json({
            message: "Application added successfully",
            id: result.insertedId,
            application: { ...application, _id: result.insertedId }
        });
    } catch (error) {
        console.error("Add application error:", error);
        res.status(500).json({
            message: "Failed to add application"
        });
    }
});

// Update Application
app.patch("/api/applications/:id", authenticateToken, async (req, res) => {
    try {
        if (!applicationsCollection) {
            return res.status(503).json({ message: "Database not connected yet" });
        }

        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid application ID format" });
        }

        const updateData = { ...req.body };
        delete updateData._id;
        delete updateData.userId;

        const result = await applicationsCollection.updateOne(
            {
                _id: new ObjectId(id),
                userId: req.user.userId
            },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Application not found or unauthorized" });
        }

        res.json({ message: "Application updated successfully" });
    } catch (error) {
        console.error("Update application error:", error);
        res.status(500).json({
            message: "Failed to update application"
        });
    }
});

// Delete Application
app.delete("/api/applications/:id", authenticateToken, async (req, res) => {
    try {
        if (!applicationsCollection) {
            return res.status(503).json({ message: "Database not connected yet" });
        }

        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid application ID format" });
        }

        const result = await applicationsCollection.deleteOne({
            _id: new ObjectId(id),
            userId: req.user.userId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Application not found or unauthorized" });
        }

        res.json({ message: "Application deleted successfully" });
    } catch (error) {
        console.error("Delete application error:", error);
        res.status(500).json({
            message: "Failed to delete application"
        });
    }
});

startServer();