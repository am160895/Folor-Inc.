const express = require('express');
const multer = require('multer');
const fs = require('fs-extra'); // Import fs-extra for file system operations
const path = require('path');
const router = express.Router();

// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const { bidNumber, projectName, address } = req.body;

        // Create folder structure: BidNumber ProjectName - Address
        const jobFolder = `${bidNumber} ${projectName} - ${address}`;
        const uploadPath = path.join(__dirname, '../uploads', jobFolder);

        // Ensure the directory exists
        await fs.ensureDir(uploadPath);

        cb(null, uploadPath); // Specify the upload path for the file
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Keep the original file name with a timestamp
    }
});

const upload = multer({ storage: storage });

router.post('/add-job', upload.single('file'), async (req, res) => {
    try {
        const { bidNumber, projectName, address, trade } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Create subfolder for trade inside the job folder
        const jobFolder = `${bidNumber} ${projectName} - ${address}`;
        const tradeFolder = path.join(__dirname, '../uploads', jobFolder, trade);

        await fs.ensureDir(tradeFolder); // Ensure trade folder exists

        // Move uploaded file to the trade folder
        const oldPath = req.file.path;
        const newPath = path.join(tradeFolder, req.file.filename);
        await fs.move(oldPath, newPath);

        res.status(200).json({
            message: 'Job successfully added',
            filePath: newPath
        });
    } catch (error) {
        console.error('Error adding job:', error);
        res.status(500).json({ message: 'Error adding job', error });
    }
});

module.exports = router;
