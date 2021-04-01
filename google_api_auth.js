const fs = require('fs');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = './config/token.json';
const CREDENTIALS_PATH = './config/credentials.json';


function get_auth_obj(__callback) {

    fs.readFile(CREDENTIALS_PATH, (err, content) => {

        if(err){
            console.log(err);
            __callback(err);
            return;
        }
        // Authorize a client with credentials, then call the Google Sheets API.
        authorize(JSON.parse(content), __callback);
    });
}


function authorize(credentials, __callback) {

    var { client_secret, client_id, redirect_uris } = credentials.web;

    const o_auth2_client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {

        if (err){
            //remove below code bacause this app cannot get user's input
            //return get_new_token(o_auth2_client, __callback);
            console.log(err);
            __callback(err);
            return;
        }

        o_auth2_client.setCredentials(JSON.parse(token));

        console.log('setting up authorize is successful');
        __callback(undefined, o_auth2_client);
    });
}

function get_new_token(o_auth2_client, __callback) {
    
    const authUrl = o_auth2_client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    console.log('Authorize this app by visiting this url:', authUrl);

    o_auth2_client.getToken('4/0AY0e-g4vp4k25b5E5KNTys6xFZTGziU6ixn1jEBZ7Cx40Es2uEa6k0ckNZCacw1A8MdlmQ', (err, token) => {

        if (err) return console.error('Error while trying to retrieve access token', err);
        o_auth2_client.setCredentials(token);

        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) return console.error(err);
            console.log('Token stored to', TOKEN_PATH);
        });

        __callback(o_auth2_client);
    });
}

module.exports.get_auth_obj = get_auth_obj;