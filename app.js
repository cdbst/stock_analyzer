
const express = require('express');
const app = express();
const api_router = express.Router();

const data_reader = require('./data_reader.js');
const data_writer = require('./data_writer.js');
const gl_api_auth = require('./google_api_auth.js');
const gl_driver = require('./google_driver');

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const SHEET_TOKEN_PATH = './config/token_sheet.json';
const SHEET_CREDENTIALS_PATH = './config/credentials_sheet.json';

const TOKEN_PATH_DRIVE = './config/token_drive.json';
const CREDENTIALS_PATH_DRIVE = './config/credentials_drive.json';

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
    g.req_sheet_type = data_writer.enum_sheet_types.SPREADSHEET_ID_FINANCE;
    g.template_file_name = FINANCE_STOCK_ANALYSIS_TEMPLATE_FILE_NAME_POSTFIX;
}else if(['normal', 'n'].includes(param.stock_type)){
    g.req_sheet_type = data_writer.enum_sheet_types.SPREADSHEET_ID_NORMAL;
    g.template_file_name = NORMAL_STOCK_ANALYSIS_TEMPLATE_FILE_NAME_POSTFIX;
}else if(['reits', 'r'].includes(param.stock_type)){
    g.req_sheet_type = data_writer.enum_sheet_types.SPREADSHEET_ID_REITS;
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

    data_reader.get_financial_data(param.tiker, data_reader.enum_financial_data_type.income_statement, function(err, income_state_data){

        if(err){
            console.log(err);
            process.exit(1);
        }
    
        var income_state = JSON.parse(income_state_data);
    
        data_reader.get_financial_data(param.tiker, data_reader.enum_financial_data_type.balance_sheet, function(err, balance_sheet_data){
            if(err){
                console.log(err);
                process.exit(1);
            }

            var balance_sheet = JSON.parse(balance_sheet_data);
    
            data_reader.get_financial_data(param.tiker, data_reader.enum_financial_data_type.cash_flow_statement, function(err, cash_flow_data){
    
                if(err){
                    console.log(err);
                    process.exit(1);
                }
            
                var cash_flow = JSON.parse(cash_flow_data);

                var validate_sample_data_type = undefined;

                if(g.req_sheet_type == data_writer.enum_sheet_types.SPREADSHEET_ID_REITS){
                    validate_sample_data_type = 'Rental Revenue';
                }else if(g.req_sheet_type == data_writer.enum_sheet_types.SPREADSHEET_ID_NORMAL){
                    validate_sample_data_type = 'Cost Of Revenues';
                }else if(g.req_sheet_type == data_writer.enum_sheet_types.SPREADSHEET_ID_FINANCE){
                    validate_sample_data_type = 'Provision For Loan Losses';
                }

                if(data_reader.find_data_type_in_dataset(validate_sample_data_type, income_state) == false){
                    console.log('invalid data format : expected type is : ' + param.stock_type);
                    process.exit(1);
                };

                var sheet_authenticator = new gl_api_auth.Authenticator(gl_api_auth.enum_SCOPES.spreadsheet, SHEET_CREDENTIALS_PATH, SHEET_TOKEN_PATH);

                sheet_authenticator.get_auth_obj(function(err, sheet_auth){

                    if(err){
                        console.log('auth fail.');
                        process.exit(1);
                    }
    
                    data_writer.cleanup_sheet(sheet_auth, g.req_sheet_type, function(err){

                        if(err){
                            console.log(err);
                            process.exit(1);
                        }

                        console.log('1/3. cleanup complete!!!!');

                        data_writer.update_sheet(sheet_auth, g.req_sheet_type, param.tiker, income_state, balance_sheet, cash_flow, function(err){

                            if(err){
                                console.log(err);
                                process.exit(1);
                            }

                            console.log('2/3. set complete!!!!');

                            var drive_authenticator = new gl_api_auth.Authenticator(gl_api_auth.enum_SCOPES.drive, CREDENTIALS_PATH_DRIVE, TOKEN_PATH_DRIVE);

                            drive_authenticator.get_auth_obj(function(err, drive_auth){
                                
                                if(err){
                                    console.log(err);
                                    process.exit(1);
                                }

                                //search template file
                                gl_driver.search_file(drive_auth, g.template_file_name, function(err, template_file_obj){
                                    if(err){
                                        console.log(err);
                                        process.exit(1);
                                    }

                                    //copy template file
                                    gl_driver.copy_file(drive_auth, template_file_obj, function(err, copied_file_obj){
                                        if(err){
                                            console(err);
                                            process.exit(1);
                                        }

                                        var generated_file_name = STOCK_ANALYSIS_FILE_NAME_PREFIX + ' - ' + param.tiker;

                                        //rename copied template file
                                        gl_driver.rename_file(drive_auth, copied_file_obj, generated_file_name, function(err, renamed_file){

                                            if(err){
                                                console(err);
                                                process.exit(1);
                                            }

                                            //search parent stock analysis folder
                                            gl_driver.search_file(drive_auth, PARENT_STOCK_ANALYSIS_FOLDER_NAME, function(err, parent_stock_folder_obj){

                                                if(err){
                                                    console(err);
                                                    process.exit(1);
                                                }


                                                //get filelist in parent stock foler
                                                gl_driver.get_file_list_in_folder(drive_auth, parent_stock_folder_obj, function(err, file_obj_list){

                                                    if(err){
                                                        console(err);
                                                        process.exit(1);
                                                    }

                                                    //remove duplicated file
                                                    file_obj_list.forEach(file_obj => {
                                                        if(file_obj['name'] != generated_file_name) return;

                                                        gl_driver.delete_file(drive_auth, file_obj, ()=>{});                                                        
                                                    });

                                                    //move into parent stock folder
                                                    gl_driver.move_file(drive_auth, renamed_file, parent_stock_folder_obj, function(err, moved_file_obj){
                                                        if(err){
                                                            console(err);
                                                            process.exit(1);
                                                        }

                                                        console.log('3/3. finish!!! generated file name :: [' + generated_file_name + ']');
                                                        process.exit(0);
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
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

        data_writer.cleanup_sheet(sheet_auth, g.req_sheet_type, function(e){
            if(e){
                console.log(e);
                process.exit(1);
            }
            console.log('cleanup complete!!!!');
            process.exit(0);
        });
    });
}

