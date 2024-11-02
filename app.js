const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware to handle form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Adjust this path to your desired folder
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// POST endpoint to handle form submissions
app.post('/api/jobs/add-job', upload.single('fileUpload'), (req, res) => {
    try {
        const subcontractorName = req.body.subcontractorName;
        const subcontractorEmail = req.body.subcontractorEmail;
        const bidNumber = req.body.bidNumber;
        const jobName = req.body.jobName;
        const address = req.body.address;
        const trade = req.body.trade;
        const lineItems = [];

        // Collect dynamic line items from form
        Object.keys(req.body).forEach(key => {
            if (key.startsWith('custom-cost') || key.startsWith('cost-')) {
                const cost = req.body[key];
                const descriptionKey = key.replace('cost', 'description'); // Find the description field associated with the cost
                const costCodeKey = key.replace('cost', 'cost-code'); // Find the cost code field

                lineItems.push({
                    costCode: req.body[costCodeKey] || 'N/A', // Default to 'N/A' if not provided
                    description: req.body[descriptionKey] || 'No Description',
                    cost: cost || 0
                });
            }
        });

        // If the file was uploaded, save its path
        const filePath = req.file ? req.file.path : null;

        // Example: Save data to a file/database (dummy example here)
        const jobData = {
            subcontractorName,
            subcontractorEmail,
            bidNumber,
            jobName,
            address,
            trade,
            lineItems,
            filePath
        };

        // You could save this to a database or file. For now, just return it.
        console.log(jobData);

        res.json({ message: 'Job successfully added', job: jobData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add job' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
