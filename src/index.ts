import 'dotenv/config';
import express from 'express';
import { google } from 'googleapis';

const app = express();
app.use(express.json());

const REDIRECT_URI = 'http://localhost:3000/auth';
const getAuthClient = () => new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  REDIRECT_URI
)

app.get('/', (req, res) => {
  const oauth2Client = getAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/spreadsheets']
  });
  res.send(`<a href="${url}" target="_blank">Authorize</a>`);
});

app.get('/auth', async (req, res) => {
  const oauth2Client = getAuthClient();
  const { tokens } = await oauth2Client.getToken(req.query.code as string);
  res.json(tokens);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
