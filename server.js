const express = require('express');
const path = require('path');
const multer = require('multer');
const { ComputerVisionClient } = require('@azure/cognitiveservices-computervision');
const { CognitiveServicesCredentials } = require('@azure/ms-rest-azure-js');

const app = express();
const port = process.env.PORT || 3000;

// Azure Computer Vision credentials
const computerVisionKey = 'Vision Key' ;
const computerVisionEndPoint = 'End Point Key' ;

const computerVisionClient = new ComputerVisionClient(
    new CognitiveServicesCredentials(computerVisionKey), computerVisionEndPoint);

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Image upload and analysis route
app.post('/analyze-image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No image file uploaded.');
    }

    try {
        const imagePath = req.file.path;
        const imageBuffer = require('fs').readFileSync(imagePath);

        // Analyze the image
        const analysis = await computerVisionClient.analyzeImageInStream(imageBuffer, {
            visualFeatures: ['Description', 'Tags']
        });

        // Clean up the uploaded file
        require('fs').unlinkSync(imagePath);

        res.json({
            description: analysis.description.captions[0] ? analysis.description.captions[0].text : 'No description found.',
            tags: analysis.tags.map(tag => tag.name)
        });

    } catch (error) {
        console.error('Error analyzing image:', error);
        res.status(500).send('Error analyzing image.');
    }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});