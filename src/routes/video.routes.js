const { Router } = require('express');
const fs = require('fs');
const path = require('path');
const router = Router();

// Ruta GET /api/videos
router.get('/api/videos', (req, res) => {
    // Buscamos la ruta real de la carpeta 'public/media/videos'
    const videoDir = path.join(__dirname, '..', '..', 'public', 'media', 'videos');

    fs.readdir(videoDir, (err, files) => {
        if (err) {
            console.error('Error leyendo carpeta de videos:', err);
            return res.json([]);
        }

        // Filtramos para que solo devuelva archivos .mp4
        const videos = files.filter(file => file.endsWith('.mp4'));
        
        res.json(videos);
    });
});

module.exports = router;