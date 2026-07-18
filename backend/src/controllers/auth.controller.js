const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

const login = asyncHandler(async (req, res) => {
    const { usuario, password } = req.body;
    const resultado = await authService.login(usuario, password);
    res.json({ success: true, ...resultado });
});

module.exports = { login };
