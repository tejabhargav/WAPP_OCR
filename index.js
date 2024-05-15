// index.js
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/whatsapp-bot')

// Define schemas and models
const DocumentSchema = new mongoose.Schema({
  userId: String,
  documents: Array,
  ocrData: Object,
  confirmed: Boolean,
});

const Document = mongoose.model('Document', DocumentSchema);

// Fetch environment variables
const cloudApiAccessToken = process.env.CLOUD_API_ACCESS_TOKEN;
const waPhoneNumberId = process.env.WA_PHONE_NUMBER_ID;
const cloudApiVersion = process.env.CLOUD_API_VERSION;

// WhatsApp API credentials
const whatsappApiUrl = `https://graph.facebook.com/${cloudApiVersion}/${waPhoneNumberId}/messages`;
const whatsappToken = cloudApiAccessToken;


// Rest of the code...
app.post('/webhook', async (req, res) => {
  const message = req.body.entry[0].changes[0].value.messages[0];
  const userId = message.from;

  if (message.type === 'text' && message.text.body.toLowerCase() === 'start') {
    await sendMessage(userId, 'Please send your documents.');
  } else if (message.type === 'image') {
    const mediaId = message.image.id;
    const mediaUrl = await getMediaUrl(mediaId);
    const document = new Document({ userId, documents: [mediaUrl], confirmed: false });
    await document.save();
    const ocrData = await performOCR(mediaUrl);
    document.ocrData = ocrData;
    await document.save();
    await sendMessage(userId, `OCR Data: ${JSON.stringify(ocrData)}. Please confirm by sending "confirm".`);
  } else if (message.type === 'text' && message.text.body.toLowerCase() === 'confirm') {
    const document = await Document.findOne({ userId, confirmed: false });
    if (document) {
      document.confirmed = true;
      await document.save();
      await forwardToEmployer(document);
      await sendMessage(userId, 'Documents and data forwarded to the employer.');
    } else {
      await sendMessage(userId, 'No unconfirmed documents found.');
    }
  } else {
    await sendMessage(userId, 'Unknown command. Please send "start" to begin.');
  }

  res.sendStatus(200);
});

const sendMessage = async (to, text) => {
  await axios.post(whatsappApiUrl, {
    messaging_product: 'whatsapp',
    to,
    text: { body: text },
  }, {
    headers: { Authorization: `Bearer ${whatsappToken}` },
  });
};

const getMediaUrl = async (mediaId) => {
  const response = await axios.get(`https://graph.facebook.com/${cloudApiVersion}/${mediaId}`, {
    headers: { Authorization: `Bearer ${whatsappToken}` },
  });
  return response.data.url;
};

const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

const performOCR = async (mediaUrl) => {
  // Implement OCR logic here
  const performOCR = async (mediaUrl) => {
    const [result] = await client.textDetection(mediaUrl);
    const detections = result.textAnnotations;
    return detections[0] ? detections[0].description : '';
    console.log(`OCR Data: ${detections[0].description}`);
  };
};

const forwardToEmployer = (document) => {
  // Implement logic to forward data to the employer
};

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
