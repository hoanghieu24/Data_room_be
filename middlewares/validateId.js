module.exports = (req, res, next) => {
    const { id } = req.params;

    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }

    req.params.id = parsed; // ép luôn về number
    next();
};
