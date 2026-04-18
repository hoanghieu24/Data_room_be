const jwt = require("jsonwebtoken");

/**
 * =========================
 * AUTHENTICATE
 * =========================
 */
const authenticate = (req, res, next) => {
    console.log("🔐 AUTHENTICATE MIDDLEWARE HIT");

    try {
        const authHeader = req.headers.authorization;
        const queryToken = req.query?.token;
        const token = queryToken
            ? queryToken
            : authHeader && authHeader.startsWith("Bearer ")
                ? authHeader.split(" ")[1]
                : null;

        console.log("👉 Authorization header:", authHeader);
        if (queryToken) console.log("👉 Query token present");

        if (!token) {
            console.log("❌ No Bearer token");
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        console.log("🎫 Token:", token.slice(0, 30) + "...");

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ DECODED TOKEN:", decoded);

        req.user = decoded;

        next();
    } catch (error) {
        console.error("❌ AUTH ERROR:", error.message);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

/**
 * =========================
 * AUTHORIZE
 * =========================
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        console.log("🛂 AUTHORIZE MIDDLEWARE HIT");
        console.log("👉 Allowed roles:", roles);
        console.log("👉 req.user:", req.user);

        if (!req.user) {
            console.log("❌ req.user missing");
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (!req.user.role_code) {
            console.log("❌ role_code missing in token");
            return res.status(403).json({
                success: false,
                message: "Role not found in token"
            });
        }

        if (!roles.includes(req.user.role_code)) {
            console.log(
                `❌ Role denied: ${req.user.role_code} not in [${roles.join(", ")}]`
            );
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions"
            });
        }

        console.log("✅ AUTHORIZE PASSED");
        next();
    };
};

module.exports = {
    authenticate,
    authorize
};
