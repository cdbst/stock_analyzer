const fs = require('fs');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = './config/token.json';
const CREDENTIALS_PATH = './config/credentials.json';

var enum_sheet_types = {
    SPREADSHEET_ID_NORMAL : '1JRkKLvUePsNEzSe2yW7Fz4BrXxmyCivdzXQI0L0QylE',
    SPREADSHEET_ID_FINANCE : '1t_dNbefojsdih9P0ZZ4inEX3Zf8M623O2u_2_dWkh-U',
    SPREADSHEET_ID_REITS : '113X2f5R284SPQlXkq_NIPaPax7p1ybxzC6LBzSSRQi0'
}

var g = {};
g.auth = undefined;

// Load client secrets from a local file.
function run(_callback) {

    fs.readFile(CREDENTIALS_PATH, (err, content) => {

        if(err){
            console.log(err);
            _callback(err);
            return;
        }
        // Authorize a client with credentials, then call the Google Sheets API.
        authorize(JSON.parse(content), _callback);
    });
}


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, _callback) {

    var { client_secret, client_id, redirect_uris } = credentials.web;

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {

        if (err){
            //remove below code bacause this app cannot get user's input
            //return get_new_token(oAuth2Client, _callback);
            console.log(err);
            _callback(err);
            return;
        }

        oAuth2Client.setCredentials(JSON.parse(token));
        g.auth = oAuth2Client; // auth is global resource

        console.log('setting up authorize is successful');
        _callback(undefined);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function get_new_token(oAuth2Client, _callback) {
    
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    console.log('Authorize this app by visiting this url:', authUrl);

    oAuth2Client.getToken('4/0AY0e-g4vp4k25b5E5KNTys6xFZTGziU6ixn1jEBZ7Cx40Es2uEa6k0ckNZCacw1A8MdlmQ', (err, token) => {

        if (err) return console.error('Error while trying to retrieve access token', err);
        oAuth2Client.setCredentials(token);

        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) return console.error(err);
            console.log('Token stored to', TOKEN_PATH);
        });

        _callback(oAuth2Client);
    });
}

function get_sheet(sheet_id, _callback){

    if(g.auth == undefined){
        console.log('auth is not set condition');
        _callback('auth is not set condition');
        return;
    }

    var auth  = g.auth;

    var sheets = google.sheets({ version: 'v4', auth });

    sheets.spreadsheets.values.get({
        spreadsheetId: sheet_id,
        range: 'summary',
    }, (err, res) => {

        if (err){
            console.log('fail with getting spc_list from google server (api err) ' + err);
            _callback(err);
            return;
        }

        const rows = res.data.values;

        if (rows.length){
            console.log('success with setting up spc sheet information');
            _callback(undefined);
            return;
        }else{
            
            console.log('spc sheet information is empty');
            _callback(GSS_V4_ERR.CANNOT_FOUND);
            return;
        }
    });
}

function update_sheet(sheet_id, tiker, income_state_datas, balance_sheet_datas, cash_flow_datas, _callback){

    var auth = g.auth;

    var sheets = google.sheets({ version: 'v4', auth });

    var update_datas = undefined;
    
    if(sheet_id == enum_sheet_types.SPREADSHEET_ID_NORMAL){
        update_datas = build_normal_sheet_data(tiker, income_state_datas, balance_sheet_datas, cash_flow_datas);
    }else if(sheet_id == enum_sheet_types.SPREADSHEET_ID_REITS){

    }else if(sheet_id == enum_sheet_types.SPREADSHEET_ID_FINANCE){

    }else{
        _callback('undefiend sheet type in update_sheet');
        return;
    }

    var resources = {
        auth: g.auth,
        spreadsheetId: sheet_id,
        resource:{
            valueInputOption: "RAW",
            data: update_datas
        }
    };

    // sample data
    // data:[
    //     {
    //         range: sheet_name + "!A3", // Update single cell
    //         values: [[tiker]]
    //     }, 
    //     // {
    //     //     range: "Sheet1!B4:B6", // Update a column
    //     //     values: [["B4"], ["B5"], ["B6"]]
    //     // }, 
    //     // {
    //     //     range: "Sheet1!C4:E4", // Update a row
    //     //     values: [["C4", "D4", "E4"]]
    //     // }, 
    //     // {
    //     //     range: "Sheet1!F5:H6", // Update a 2d range
    //     //     values: [["F5", "F5"], ["H6", "H6"]]
    //     // }
    // ]

    sheets.spreadsheets.values.batchUpdate(resources, (err, result)=>{
        if(err){
            _callback(err);
            return;
        }
        console.log('test');
    });
}

function build_normal_sheet_data(tiker, income_state_datas, balance_sheet_datas, cash_flow_datas){

    var update_datas = [];

    if(income_state_datas.length == 0 || balance_sheet_datas.length == 0 || cash_flow_datas.length == 0){
        return update_datas;
    }

    const sheet_name = 'summary';

    var month_end = get_month_end(income_state_datas);
    var years = get_years(income_state_datas);
    var total_revenues = get_row_datas(years, income_state_datas, find_row_idx('Total Revenues', income_state_datas.data));
    var operating_incomes = get_row_datas(years, income_state_datas, find_row_idx('Operating Income', income_state_datas.data));
    var net_interest_expenses = get_row_datas(years, income_state_datas, find_row_idx('Net Interest Expenses', income_state_datas.data));
    var net_incomes = get_row_datas(years, income_state_datas, find_row_idx('Net Income', income_state_datas.data));
    var ebitdas = get_row_datas(years, income_state_datas, find_row_idx('EBITDA', income_state_datas.data));

    var total_assets = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Assets', balance_sheet_datas.data));
    var total_liabilities = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Liabilities', balance_sheet_datas.data));
    var total_common_equity = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Common Equity', balance_sheet_datas.data));
    var minority_interest = get_row_datas(years, balance_sheet_datas, find_row_idx('Minority Interest', balance_sheet_datas.data)); // 우선주 지분
    var total_shares_outstanding = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Shares Out. on Filing Date', balance_sheet_datas.data)); // 발행주식수

    var total_cash_n_st_investments = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Cash & ST Investments', balance_sheet_datas.data));
    var total_current_assets = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Current Assets', balance_sheet_datas.data));
    var total_current_liabilities = get_row_datas(years, balance_sheet_datas, find_row_idx('Total Current Liabilities', balance_sheet_datas.data));

    var cash_from_operations = get_row_datas(years, cash_flow_datas, find_row_idx('Cash from Operations', cash_flow_datas.data));
    var capex = get_row_datas(years, cash_flow_datas, find_row_idx('Capital Expenditure', cash_flow_datas.data));
    var levered_free_cash_flow = get_row_datas(years, cash_flow_datas, find_row_idx('Levered Free Cash Flow', cash_flow_datas.data));
    var fcf_per_shares = get_row_datas(years, cash_flow_datas, find_row_idx('Free Cash Flow / Share', cash_flow_datas.data));
    var dividends_paids = get_row_datas(years, cash_flow_datas, find_row_idx('Common & Preferred Stock Dividends Paid', cash_flow_datas.data));
    
    //step1 : update tiker
    update_datas.push({
        range: sheet_name + "!A3", // TIKER
        values: [[tiker]]
    });

    //step2 : update month end
    update_datas.push({
        range: sheet_name + "!H8", // add month end
        values: [['<Month end : ' + month_end + '>']]
    });

    //step3 : update year column header
    update_datas.push({
        range: sheet_name + "!B9:G9", // add row col
        values: [years]
    });

    update_datas.push({
        range: sheet_name + "!B10:G10", // add total revenues
        values: [total_revenues]
    });

    update_datas.push({
        range: sheet_name + "!B12:G12", // add op incomes
        values: [operating_incomes]
    });

    update_datas.push({
        range: sheet_name + "!B15:G15", // add net interest expense
        values: [net_interest_expenses]
    });

    update_datas.push({
        range: sheet_name + "!B17:G17", // add net incomes
        values: [net_incomes]
    });

    update_datas.push({
        range: sheet_name + "!B19:G19", // add ebitas
        values: [ebitdas]
    });

    update_datas.push({
        range: sheet_name + "!B21:G21", // add total assets
        values: [total_assets]
    });

    update_datas.push({
        range: sheet_name + "!B22:G22", // add total liablilities
        values: [total_liabilities]
    });

    update_datas.push({
        range: sheet_name + "!B24:G24", // add common equity
        values: [total_common_equity]
    });

    update_datas.push({
        range: sheet_name + "!B25:G25", // add minority interest
        values: [minority_interest]
    });

    update_datas.push({
        range: sheet_name + "!B26:G26", // add total_shares_outstanding
        values: [total_shares_outstanding]
    });

    update_datas.push({
        range: sheet_name + "!B27:G27", // add total cash and short term investments
        values: [total_cash_n_st_investments]
    });

    update_datas.push({
        range: sheet_name + "!B28:G28", // add total current assets
        values: [total_current_assets]
    });

    update_datas.push({
        range: sheet_name + "!B29:G29", // add total current liabilities
        values: [total_current_liabilities]
    });

    update_datas.push({
        range: sheet_name + "!B31:G31", 
        values: [cash_from_operations]
    });

    update_datas.push({
        range: sheet_name + "!B33:G33", 
        values: [capex]
    });

    update_datas.push({
        range: sheet_name + "!B34:G34", 
        values: [levered_free_cash_flow]
    });

    update_datas.push({
        range: sheet_name + "!B35:G35", 
        values: [fcf_per_shares]
    });

    update_datas.push({
        range: sheet_name + "!B37:G37", 
        values: [dividends_paids]
    });

    return update_datas;
}

function get_month_end(income_state_datas){
    return income_state_datas.data[0][1][1]['name'].split(' ')[0];
}

function get_years(income_state_datas){
    var years = [];

    var sample_data_list = income_state_datas.data[0][0];

    sample_data_list.forEach(sample_data => {

        if(sample_data['name'] == 'TTM'){
            years.push('TTM');
            return;
        }

        var month_year_pair = sample_data['name'].split(' ');

        if(month_year_pair.length != 2) return;
        if(sample_data['value'].includes('<svg')) return;
        
        years.push(parseInt(month_year_pair[1]));
    });

    return years;
}

function get_row_datas(years, data_set, row_idx){
    var row_datas = [];

    if(row_idx.superset == -1 || row_idx.sub_set == -1){
        return row_datas;
    }

    var row_data_list = data_set.data[row_idx.superset][row_idx.subset];

    row_data_list.forEach(row_data => {

        var year = undefined;

        if(row_data['name'] == 'Last Report') row_data['name'] = 'TTM';

        if(row_data['name'] != 'TTM'){
            var month_year_pair = row_data['name'].split(' ');
            if(month_year_pair.length != 2) return;
            year = parseInt(month_year_pair[1]);
        }else{
            year = 'TTM';
        }

        if(years.includes(year) == false) return;

        if(row_data['value'].includes('<svg')) return;
        
        var cell_data = row_data['value'];
        if(cell_data.includes('(') && cell_data.includes(')')){ //negative val
            cell_data = cell_data.replace(/\(/g, '');
            cell_data = cell_data.replace(/\)/g, '');
            cell_data = '-' + cell_data;
        }
        if(cell_data == '-'){ // unknown data
            cell_data = '0';
        }
        
        cell_data = cell_data.replace(/\$/g, '');
        cell_data = cell_data.replace(/,/g, '');
        cell_data = parseFloat(cell_data);

        row_datas.push(cell_data);
    });

    return row_datas;
}

function find_row_idx(row_col_str, data_set){

    for(var i = 0; i < data_set.length; i++){
        var superset = data_set[i];

        for(var j = 0; j < superset.length; j++){
            var sub_set = superset[j];

            if(sub_set[0]['value'] == row_col_str){
                return {
                    superset : i,
                    subset : j
                }
            }
        }
    }

    return {
        superset : -1,
        subset : -1
    };
}

module.exports.run = run;
module.exports.get_sheet = get_sheet;
module.exports.update_sheet = update_sheet;
module.exports.enum_sheet_types = enum_sheet_types;