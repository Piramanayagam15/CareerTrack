require("dotenv").config();
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "CareerTrack_secure_secret_2026_new_8xP4mK7";

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication required"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = decoded;

        console.log("AUTH OK:", req.method, req.originalUrl);

        next();
    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired token"
        });
    }
}

module.exports = authenticateToken;