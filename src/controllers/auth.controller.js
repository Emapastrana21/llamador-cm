const login = (req, res) => {
    const { user, pass } = req.body;

    // --- CREDENCIALES MAESTRAS ---
    // Acá definís el usuario y contraseña para entrar
    const USUARIO_REAL = 'admin';
    const PASSWORD_REAL = '1234';

    if (user === USUARIO_REAL && pass === PASSWORD_REAL) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
};

module.exports = { login };