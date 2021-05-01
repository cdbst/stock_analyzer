const fs = require('fs');
const { google } = require('googleapis');


// If modifying these scopes, delete token.json.
const enum_SCOPES = {
    spreadsheet : 'https://www.googleapis.com/auth/spreadsheets', 
    drive : 'https://www.googleapis.com/auth/drive'
};

class Authenticator {

    constructor(_scope, _credentials_path, _token_path) {

        this.scope = [_scope];
        this.credentials_path = _credentials_path;
        this.token_path = _token_path;
    }

    get_auth_obj(__callback) {

        fs.readFile(this.credentials_path, (err, content) => {

            if (err) {
                console.log(err);
                __callback(err);
                return;
            }
            // Authorize a client with credentials, then call the Google Sheets API.
            this.authorize(JSON.parse(content), __callback);
        });
    };

    authorize(credentials, __callback) {

        var { client_secret, client_id, redirect_uris } = credentials.installed;

        const o_auth2_client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        fs.readFile(this.token_path, (err, token) => {

            if (err) {
                //remove below code bacause this app cannot get user's input
                //return this.get_new_token(o_auth2_client, __callback);
                console.log(err);
                __callback(err);
                return;
            }

            o_auth2_client.setCredentials(JSON.parse(token));

            //console.log('setting up authorize is successful');
            __callback(undefined, o_auth2_client);
        });
    };

    get_new_token(o_auth2_client, __callback) {

        const auth_url = o_auth2_client.generateAuthUrl({
            access_type: 'offline',
            scope: this.scope,
        });

        console.log('Authorize this app by visiting this url:', auth_url);

        o_auth2_client.getToken('set auth_rul return code', (err, token) => {

            if (err)
                return console.error('Error while trying to retrieve access token', err);

            o_auth2_client.setCredentials(token);

            // Store the token to disk for later program executions
            fs.writeFile(this.token_path, JSON.stringify(token), (err) => {
                if (err)
                    return console.error(err);
                console.log('Token stored to', this.token_path);
            });

            __callback(o_auth2_client);
        });
    };
}


module.exports.Authenticator = Authenticator;
module.exports.enum_SCOPES = enum_SCOPES;