/**
 * Constants for the server
 * @module constants
 * @category Server
*/

import { google } from 'googleapis';

/*
  * the target range for posting and pulling guess the elo guesses
*/
const GUESS_TARGET_SHEET_RANGE = 'Sheet1'

const localUri = 'http://localhost:3000/auth';
const prodUri = '';

/**
 * @type {string}
 * @description the redirect URI for the google OAuth process as defined on the google cloud console
 */
const redirectUri = process.env.NODE_ENV ? prodUri : localUri;

/**
 * @type {Object}
 * @description enumerable error states encountered during the auth process
*/
const AUTH_ERRORS = {
  // when the client token is invalid or empty
  INVALID_CLIENT_TOKEN: 'INVALID_CLIENT_TOKEN',
  // when the client token is expired, and a new one has been issued in the response
  NEW_CLIENT_TOKEN_ISSUED: 'NEW_CLIENT_TOKEN_ISSUED',
  // when the google oauth code provided by the client is invalid
  INVALID_GOOGLE_OAUTH_CODE: 'INVALID_GOOGLE_OAUTH_CODE',
  // when the google oauth refresh token is invalid
  INVALID_GOOGLE_OAUTH_REFRESH_TOKEN: 'INVALID_GOOGLE_OAUTH_REFRESH_TOKEN',
  // when the google oauth access token is invalid
  INVALID_GOOGLE_OAUTH_ACCESS_TOKEN: 'INVALID_GOOGLE_OAUTH_ACCESS_TOKEN',
  // when google oauth url fails to generate
  GOOGLE_OAUTH_URL_GENERATION_FAILED: 'GOOGLE_OAUTH_URL_GENERATION_FAILED',
} as const;

/**
 * @type {string[]}
 * @description the google OAuth scopes required for the application
 */
const googleOAuthScope = [
  'https://www.googleapis.com/auth/spreadsheets'
]

/**
 * @type {Object}
 * @description the spreadsheet IDs as defined by google sheets for which the GoogleSheet class interfaces
*/
const spreadsheetIds = {
  dev: '1gKTFBN9lITCEyPKDWG31_yya-x3R3IRe6VH3Qa3sk1A',
  production: '',
}

const authClient = () => new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  redirectUri
)

/**
  * @param {string} googleOAuthRefreshToken
  * @description takes in a google oauth refresh token and returns a google oauth access token
  * @returns {Promise<string>} a promise that resolves with a google oauth access token
  * @throws {Error} if the google oauth refresh token is invalid
*/
async function generateGoogleOAuthAccessToken(googleOAuthRefreshToken: string) {
  const auth = authClient();

  try {
    auth.setCredentials({ refresh_token: googleOAuthRefreshToken });
    const tokens  = await auth.refreshAccessToken();
    return tokens.credentials.access_token;
  } catch (e) {
    throw AUTH_ERRORS.INVALID_GOOGLE_OAUTH_REFRESH_TOKEN;
  }
}

const getGoogleOAuthAccessToken = () => generateGoogleOAuthAccessToken(process.env.GOOGLE_OAUTH_REFRESH_TOKEN!);

export {
  AUTH_ERRORS,
  redirectUri,
  googleOAuthScope,
  spreadsheetIds,
  authClient,
  getGoogleOAuthAccessToken,
  GUESS_TARGET_SHEET_RANGE
}