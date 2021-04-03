
const express = require('express');
const app = express();
const api_router = express.Router();

const data_reader = require('./data_reader.js');
const gl_spreadsheet = require('./google_spreadsheet.js');
const gl_api_auth = require('./google_api_auth.js');
const gl_driver = require('./google_driver');

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const SHEET_TOKEN_PATH = './config/token_sheet.json';
const SHEET_CREDENTIALS_PATH = './config/credentials_sheet.json';

const DRIVE_TOKEN_PATH = './config/token_drive.json';
const DRIVE_CREDENTIALS_PATH = './config/credentials_drive.json';

const STOCK_ANALYSIS_FILE_NAME_PREFIX = 'US Stock Analysis' // prefix of file name 
const FINANCE_STOCK_ANALYSIS_TEMPLATE_FILE_NAME_POSTFIX = STOCK_ANALYSIS_FILE_NAME_PREFIX + ' - Template(Finance Type)';
const NORMAL_STOCK_ANALYSIS_TEMPLATE_FILE_NAME_POSTFIX = STOCK_ANALYSIS_FILE_NAME_PREFIX + ' - Template(Normal Type)';
const RETIS_STOCK_ANALYSIS_TEMPLATE_FILE_NAME_POSTFIX = STOCK_ANALYSIS_FILE_NAME_PREFIX + ' - Template(Reits Type)';

const PARENT_STOCK_ANALYSIS_FOLDER_NAME = 'US Stock Anaysis';

var args = process.argv.slice(2);

var param = {}
param.mode = args[0];

const useage_string =   'invalid argument : usage : node app.js {mode} - [mode : set, cleanup]\n' +
                        '   set mode useage : {tiker} {sheet_type}\n' +
                        '       {tiker} - [stock_type]\n' + 
                        '       {sheet_type} - [finance(f), normal(n), reits(r)]\n' +
                        '   cleanup mode useage : cleanup {sheet_type}\n' +
                        '       {sheet_type} - [finance(f), normal(n), reits(r)]';

if(args.length < 2){
    console.log(useage_string);
    process.exit(1);
}

if(args[0] == 'set' && args.length != 3){
    console.log(useage_string);
    process.exit(1);
}

if(args[0] == 'cleanup' && args.length != 2){
    console.log(useage_string);
    process.exit(1);
}

var run_mode = args[0] == 'set' ? 0 : 1; // 0 is default mode. 1 is cleanup mode

if(run_mode == 0){ //set mode
    param.tiker = args[1].toUpperCase();
    param.stock_type = args[2];
}else{ // cleanup mode
    param.stock_type = args[1];
}

if(args.length == 2 && args[0] != 'cleanup'){
    console.log('invalid argument : usage : node app.js cleanup');
    process.exit(1);
}

if(args.length == 1){
    run_mode = 1;
}

var g = {} // globals

g.req_sheet_type = undefined
g.template_file_name = undefined;
    
if(['finance', 'f'].includes(param.stock_type)){
    g.req_sheet_type = gl_spreadsheet.enum_stock_types.FINANCE;
    g.template_file_name = FINANCE_STOCK_ANALYSIS_TEMPLATE_FILE_NAME_POSTFIX;
}else if(['normal', 'n'].includes(param.stock_type)){
    g.req_sheet_type = gl_spreadsheet.enum_stock_types.NORMAL;
    g.template_file_name = NORMAL_STOCK_ANALYSIS_TEMPLATE_FILE_NAME_POSTFIX;
}else if(['reits', 'r'].includes(param.stock_type)){
    g.req_sheet_type = gl_spreadsheet.enum_stock_types.REITS;
    g.template_file_name = RETIS_STOCK_ANALYSIS_TEMPLATE_FILE_NAME_POSTFIX;
}else{
    console.log('invalid stock type : \n' + useage_string);
    process.exit(1);
}

app.use('/api', api_router);

app.get('/', function (req, res) {
    res.send('test');
});

app.listen(process.env.PORT || 8080, function () {
    console.log('run -> lpkakaoplus API server ' + (process.env.PORT || 8080));
});

if(run_mode == 0){

    get_data_from_seeking_alpha((balance_sheet_data, income_state_data, cashflow_data) =>{
        console.log('Phase 1 complete. get data from seekingalpha success');

        setup_data_into_sheet(balance_sheet_data, income_state_data, cashflow_data, ()=>{
            console.log('Phase 2 complete. updating sheet is success');

            create_stock_analysis_file(()=>{
                console.log('Phase 3 complete. success with creating stock anaysis file');
                process.exit(0);
            });
        });
    });

}else{

    var sheet_authenticator = new gl_api_auth.Authenticator(gl_api_auth.enum_SCOPES.spreadsheet, SHEET_CREDENTIALS_PATH, SHEET_TOKEN_PATH);

    sheet_authenticator.get_auth_obj(function(err, sheet_auth){

        if(err){
            console.log('auth fail.');
            process.exit(1);
        }

        console.log('Phase 1. success with getting auth.');

        sheet_operator = new gl_spreadsheet.SheetOperator(g.req_sheet_type, 'summary', sheet_auth);

        sheet_operator.cleanup_sheet((err)=>{
            if(err){
                console.error('fail : cleanup sheet\n' + err);
                process.exit(1);
            }

            console.log('Phase 2. cleaning up sheet is success');
            process.exit(0);
        });
    });
}

function get_data_from_seeking_alpha(__callback){

    data_reader.get_financial_data(param.tiker, data_reader.enum_financial_data_type.income_statement, function(err, income_state_data){

        if(err){
            console.error(err);
            process.exit(1);
        }
        
        console.log('Phase 1. get income state data from seekingalpha success');
        var income_state = JSON.parse(income_state_data);
    
        data_reader.get_financial_data(param.tiker, data_reader.enum_financial_data_type.balance_sheet, function(err, balance_sheet_data){
            if(err){
                console.error(err);
                process.exit(1);
            }

            console.log('Phase 1. get balance sheet data from seekingalpha success');
            var balance_sheet = JSON.parse(balance_sheet_data);
    
            data_reader.get_financial_data(param.tiker, data_reader.enum_financial_data_type.cash_flow_statement, function(err, cash_flow_data){
    
                if(err){
                    console.error(err);
                    process.exit(1);
                }
            
                console.log('Phase 1. get cash flow data from seekingalpha success');
                var cash_flow = JSON.parse(cash_flow_data);

                var validate_sample_data_type = undefined;

                if(g.req_sheet_type == gl_spreadsheet.enum_stock_types.REITS){
                    validate_sample_data_type = 'Rental Revenue';
                }else if(g.req_sheet_type == gl_spreadsheet.enum_stock_types.NORMAL){
                    validate_sample_data_type = 'Cost Of Revenues';
                }else if(g.req_sheet_type == gl_spreadsheet.enum_stock_types.FINANCE){
                    validate_sample_data_type = 'Provision For Loan Losses';
                }

                if(data_reader.find_data_type_in_dataset(validate_sample_data_type, income_state) == false){
                    console.error('invalid data format : expected type is : ' + param.stock_type);
                    process.exit(1);
                };

                __callback(income_state, balance_sheet, cash_flow);
            });
        });
    });
}


function setup_data_into_sheet(income_state_data, balance_sheet_data, cashflow_data, __callback){

    var sheet_authenticator = new gl_api_auth.Authenticator(gl_api_auth.enum_SCOPES.spreadsheet, SHEET_CREDENTIALS_PATH, SHEET_TOKEN_PATH);

    sheet_authenticator.get_auth_obj((err, sheet_auth)=>{
        if(err){
            console.error('fail : authentication\n' + err);
            process.exit(1);
        }

        //Sheet operator for annually data.
        sheet_operator = new gl_spreadsheet.SheetOperator(g.req_sheet_type, 'summary', sheet_auth);

        sheet_operator.cleanup_sheet((err)=>{
            if(err){
                console.error('fail : cleanup sheet\n' + err);
                process.exit(1);
            }

            console.log('Phase 2. cleaning up sheet is success');

            sheet_operator.update_sheet(param.tiker, income_state_data, balance_sheet_data, cashflow_data, (err)=>{

                if(err){
                    console.error('fail : updating sheet\n' + err);
                    process.exit(1);
                }

                __callback();
            });
        });
    });
}

function create_stock_analysis_file(__callback){

    var drive_authenticator = new gl_api_auth.Authenticator(gl_api_auth.enum_SCOPES.drive, DRIVE_CREDENTIALS_PATH, DRIVE_TOKEN_PATH);

    drive_authenticator.get_auth_obj(function(err, drive_auth){
        
        if(err){
            console.error(err);
            process.exit(1);
        }

        console.log('Phase 3. success : get google api auth');

        //search template file
        gl_driver.search_file(drive_auth, g.template_file_name, function(err, template_file_obj){
            if(err){
                console.error(err);
                process.exit(1);
            }

            console.log('Phase 3. success : search template file');

            //copy template file
            gl_driver.copy_file(drive_auth, template_file_obj, function(err, copied_file_obj){
                if(err){
                    console.error(err);
                    process.exit(1);
                }

                console.log('Phase 3. success : copy template file success');

                var generated_file_name = STOCK_ANALYSIS_FILE_NAME_PREFIX + ' - ' + param.tiker;

                //rename copied template file
                gl_driver.rename_file(drive_auth, copied_file_obj, generated_file_name, function(err, renamed_file){

                    if(err){
                        console.error(err);
                        process.exit(1);
                    }

                    console.log('Phase 3. success : rename file success');

                    //search parent stock analysis folder
                    gl_driver.search_file(drive_auth, PARENT_STOCK_ANALYSIS_FOLDER_NAME, function(err, parent_stock_folder_obj){

                        if(err){
                            console.error(err);
                            process.exit(1);
                        }

                        console.log('Phase 3. success : search parent stock analysis folder');

                        //get filelist in parent stock foler
                        gl_driver.get_file_list_in_folder(drive_auth, parent_stock_folder_obj, function(err, file_obj_list){

                            if(err){
                                console.error(err);
                                process.exit(1);
                            }

                            console.log('Phase 3. success : get child file list in parent stock analysis folder');

                            //remove duplicated file
                            file_obj_list.forEach(file_obj => {
                                if(file_obj['name'] != generated_file_name) return;
                                gl_driver.delete_file(drive_auth, file_obj, ()=>{
                                    console.log('Phase 3. notice : remove old file : [' + generated_file_name + ']');
                                });
                            });

                            //move into parent stock folder
                            gl_driver.move_file(drive_auth, renamed_file, parent_stock_folder_obj, function(err, moved_file_obj){
                                if(err){
                                    console.error(err);
                                    process.exit(1);
                                }

                                console.log('Phase 3. success : move stock analysis file to parent stock analysis folder');
                                __callback();
                            });
                        });
                    });
                });
            });
        });
    });
}