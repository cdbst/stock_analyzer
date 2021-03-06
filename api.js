const express = require('express');
const app = express();
var body_parser = require('body-parser');
const api_router = express.Router();
const http = require('http');

const seeking_alpha = require('./seeking_alpha.js');
const gl_spreadsheet = require('./google_spreadsheet.js');
const gl_api_auth = require('./google_api_auth.js');
const gl_drive = require('./google_drive');

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const SHEET_TOKEN_PATH = './config/token_sheet.json';
const SHEET_CREDENTIALS_PATH = './config/credentials_sheet.json';

const DRIVE_TOKEN_PATH = './config/token_drive.json';
const DRIVE_CREDENTIALS_PATH = './config/credentials_drive.json';

const STOCK_ANALYSIS_FILE_NAME_PREFIX = 'US Stock Analysis' // prefix of file name
const FINANCE_STOCK_ANALYSIS_TEMPLATE_FILE_NAME = STOCK_ANALYSIS_FILE_NAME_PREFIX + ' - Template(Finance Type)';
const NORMAL_STOCK_ANALYSIS_TEMPLATE_FILE_NAME = STOCK_ANALYSIS_FILE_NAME_PREFIX + ' - Template(Normal Type)';
const RETIS_STOCK_ANALYSIS_TEMPLATE_FILE_NAME = STOCK_ANALYSIS_FILE_NAME_PREFIX + ' - Template(Reits Type)';
const INSURANCE_STOCK_ANALYSIS_TEMPLATE_FILE_NAME = STOCK_ANALYSIS_FILE_NAME_PREFIX + ' - Template(Insurance Type)';

const PARENT_STOCK_ANALYSIS_FOLDER_NAME = 'US Stock Anaysis';
const PARENT_STOCK_ANALYSIS_FOLDER_URL = 'https://drive.google.com/drive/folders/1j71iRw3CjIphM9ngCR_zuLJumrexMGmI?usp=sharing';

var run = function(__callback){

    app.use(body_parser.json());
    app.use('/api', api_router);
    
    app.get('/', function (req, res) {
        res.send('test'); 
    });
    
    app.listen(process.env.PORT || 8080, function () {
        console.log('run -> stock analyzer API server ' + (process.env.PORT || 8080));
        if(__callback != undefined) __callback();
    });
    
    setInterval(function() {
        http.get("http://localhost:" + (process.env.PORT || 8080));
    }, 300000); // every 5 minutes (300000) heartbeat..
    
    
    api_router.post('/finance', function (_req, _res){
    
        var client_req = new ClientRequest(0, _req, _res);
    
        if(client_req.is_req_valid() == false){
            console.error('client request has no stock ticker information');
            client_req.res_to_client('???????????? ?????? ??????????????? ???????????????.');
            return;
        }
    
        var ticker = client_req.get_req_parm_value('ticker');
    
        if(ticker == undefined){
            console.error('client request has no stock ticker information');
            client_req.res_to_client('???????????? ?????? ??????????????? ???????????????(?????? ????????? ??????).');
            return;
        }
    
        if(is_ticker_str_validate(ticker) == false){
            client_req.res_to_client('???????????? ?????? ?????? ???????????????.');
            return;
        }
    
        ticker = ticker.toUpperCase();
    
        seeking_alpha.is_valid_ticker(ticker, (_err)=>{
            if(_err){
                client_req.res_to_client('???????????? ?????? [' + ticker + '] ?????? ????????? ???????????? ????????? ????????? ??? ????????????.');
                return;
            }
            
            client_req.res_to_client('???????????? ?????? [' + PARENT_STOCK_ANALYSIS_FOLDER_NAME  + ' - ' + ticker + '] ??? ?????? ????????? ????????? ???????????? ?????? ??? 5~10??? ?????? ???????????????.' +
                                    ' ????????? ?????? ????????????. ????????? ????????? ??????????????? ????????? ??? ????????? ????????? Drive??? ????????? ????????? ????????????. : \n' + PARENT_STOCK_ANALYSIS_FOLDER_URL);
            
            client_req.update_template_file(seeking_alpha.enum_req_period_type.annual, ticker, (_err, _annual_stock_type)=>{
    
                if(_err){
                    console.error('?????? ?????? ????????? ???????????? ???????????? ??????????????????.');
                    return;
                }
        
                client_req.update_template_file(seeking_alpha.enum_req_period_type.quarterly, ticker, (_err, _quarterly_stock_type)=>{ 
                    
                    if(_err){
                        console.error('?????? ?????? ????????? ???????????? ???????????? ??????????????????.');
                        return;
                    }
    
                    var create_stock_analysis_file = function(){
    
                        var template_file_name = undefined;
        
                        if(_annual_stock_type == gl_spreadsheet.enum_stock_types.FINANCE){
                            template_file_name = FINANCE_STOCK_ANALYSIS_TEMPLATE_FILE_NAME;
                        }else if(_annual_stock_type == gl_spreadsheet.enum_stock_types.NORMAL){
                            template_file_name = NORMAL_STOCK_ANALYSIS_TEMPLATE_FILE_NAME;
                        }else if(_annual_stock_type == gl_spreadsheet.enum_stock_types.REITS){
                            template_file_name = RETIS_STOCK_ANALYSIS_TEMPLATE_FILE_NAME;
                        }else if(_annual_stock_type == gl_spreadsheet.enum_stock_types.INSURANCE){
                            template_file_name = INSURANCE_STOCK_ANALYSIS_TEMPLATE_FILE_NAME;
                        }else{
                            console.error('invalid stock type : \n' + useage_string);
                            return;
                        }
            
                        client_req.create_stock_analysis_file(ticker, template_file_name, (_err, _analysis_file, _analysis_file_url)=>{
                            if(_err){
                                console.error('?????? ?????? ????????? ???????????? ???????????? ??????????????????.');
                                return;
                            }
            
                            console.log('????????? ?????? : ' + _analysis_file + '\n' + _analysis_file_url);
                        });
                    }
    
                    if(_quarterly_stock_type == undefined){ // annual data??? ?????? quarterly data??? ?????? ??????. cleanup ????????? ??????.
                        cleanup_sheet(_annual_stock_type, 'summary-quarterly', client_req, (_err)=>{
                            if(_err){
                                console.error('?????? ?????? ????????? ????????? ?????? ???????????? ??????????????????.');
                                return;
                            }
                            create_stock_analysis_file();
                        });
                    }else{
                        create_stock_analysis_file();
                    }
                });
            });
        });
    });
}

class ClientRequest{

    constructor(_client_id, _request, _response){
        this.client_id = _client_id;
        this.request = _request;
        this.response = _response;

        this.sheet_authenticator = new gl_api_auth.Authenticator(gl_api_auth.enum_SCOPES.spreadsheet, SHEET_CREDENTIALS_PATH, SHEET_TOKEN_PATH);
        this.drive_authenticator = new gl_api_auth.Authenticator(gl_api_auth.enum_SCOPES.drive, DRIVE_CREDENTIALS_PATH, DRIVE_TOKEN_PATH);
    }

    get_req_parm_value(param_key){
        return this.request.body.action.params.hasOwnProperty(param_key) ? this.request.body.action.params[param_key] : undefined;
    }

    is_req_valid(){

        if(this.request.body == undefined || this.request.body.action == undefined || this.request.body.action.params == undefined){
            return false;
        }
        return true;
    }

    update_template_file(_period_type, _ticker, __callback){

        seeking_alpha.get_data_from_seeking_alpha(_ticker, _period_type, (_err, _income_state, _balance_sheet, _cash_flow, _period_type)=>{
            if(_err){
                console.error(_err);
                __callback(_err);
                return;
            }

            var stock_type = undefined;

            if(seeking_alpha.find_data_type_in_dataset('Cost Of Revenues', _income_state)){
                stock_type = gl_spreadsheet.enum_stock_types.NORMAL;
            }else if(seeking_alpha.find_data_type_in_dataset('Rental Revenue', _income_state)){
                stock_type = gl_spreadsheet.enum_stock_types.REITS;
            }else if(seeking_alpha.find_data_type_in_dataset('Provision For Loan Losses', _income_state)){
                stock_type = gl_spreadsheet.enum_stock_types.FINANCE;
            }else if(seeking_alpha.find_data_type_in_dataset('Total Interest And Dividend Income', _income_state)){
                stock_type = gl_spreadsheet.enum_stock_types.INSURANCE;
            }else{ // default value is normal
                stock_type = gl_spreadsheet.enum_stock_types.NORMAL;
            }

            // if(_period_type == seeking_alpha.enum_req_period_type.annual){
            //     console.error('invalid stock type');
            //     __callback('invalid stock type');
            //     return;
            // }else if(_period_type == seeking_alpha.enum_req_period_type.quarterly){
            //     __callback(undefined, undefined);
            //     return;
            // }
    
            this.sheet_authenticator.get_auth_obj((_err, _sheet_auth)=>{

                if(_err){
                    console.error(_err);
                    __callback(_err);
                    return;
                }

                var sheet_name = undefined;
    
                if(_period_type == seeking_alpha.enum_req_period_type.annual){
                    sheet_name = 'summary-annual';
                }else if(_period_type == seeking_alpha.enum_req_period_type.quarterly){
                    sheet_name = 'summary-quarterly';
                }else{
                    console.error('invalid period type : ' + _period_type);
                    __callback('invalid period type : ' + _period_type);
                    return;
                }
    
                gl_spreadsheet.setup_data_into_sheet(_sheet_auth, stock_type, sheet_name, _ticker, _income_state, _balance_sheet, _cash_flow, (_err)=>{
                    if(_err){
                        console.error('fail : setup data into sheet' + _err);
                        __callback(_err);
                        return;
                    }
    
                    __callback(undefined, stock_type);
                });
            });
        });
    }

    create_stock_analysis_file(ticker, template_file_name, __callback){

        this.drive_authenticator.get_auth_obj(function(err, drive_auth){
            
            if(err){
                console.error(err);
                __callback(err);
                return;
            }
    
            //search template file
            gl_drive.search_file(drive_auth, template_file_name, function(err, template_file_obj){
                if(err){
                    console.error(err);
                    __callback(err);
                    return;
                }
    
                //copy template file
                gl_drive.copy_file(drive_auth, template_file_obj, function(err, copied_file_obj){
                    if(err){
                        console.error(err);
                        __callback(err);
                        return;
                    }
    
                    var generated_file_name = STOCK_ANALYSIS_FILE_NAME_PREFIX + ' - ' + ticker;
    
                    //rename copied template file
                    gl_drive.rename_file(drive_auth, copied_file_obj, generated_file_name, function(err, renamed_file){
    
                        if(err){
                            console.error(err);
                            __callback(err);
                            return;
                        }
    
                        //search parent stock analysis folder
                        gl_drive.search_file(drive_auth, PARENT_STOCK_ANALYSIS_FOLDER_NAME, function(err, parent_stock_folder_obj){
    
                            if(err){
                                console.error(err);
                                __callback(err);
                                return;
                            }
    
                            //get filelist in parent stock foler
                            gl_drive.get_file_list_in_folder(drive_auth, parent_stock_folder_obj, function(err, file_obj_list){
    
                                if(err){
                                    console.error(err);
                                    __callback(err);
                                    return;
                                }
    
                                //remove duplicated file
                                file_obj_list.forEach(file_obj => {
                                    if(file_obj['name'] != generated_file_name) return;
                                    gl_drive.delete_file(drive_auth, file_obj, ()=>{
                                        console.log('... notice : remove old file : [' + generated_file_name + ']');
                                    });
                                });
    
                                //move into parent stock folder
                                gl_drive.move_file(drive_auth, renamed_file, parent_stock_folder_obj, function(err, moved_file_obj){
                                    if(err){
                                        console.error(err);
                                        __callback(err);
                                        return;
                                    }
    
                                    __callback(undefined, generated_file_name, moved_file_obj['webViewLink']);
                                });
                            });
                        });
                    });
                });
            });
        });
    }

    res_to_client(_msg){

        const res_body = {
            result : _msg
        };
    
        this.response.status(200).send(res_body);   
    }
}


function is_ticker_str_validate(ticker){

    var ticker_pettern = /[a-zA-Z.]+/;
    var pattern_spc = /[~!@#$%^&*()_+|<>?:{}]/;

    if(ticker_pettern.test(ticker) && pattern_spc.test(ticker) === false){
        return true;
    }
    return false;
}

function cleanup_sheet(_stock_type, _sheet_name, _client_req, __callback){

    _client_req.sheet_authenticator.get_auth_obj((_err, _sheet_auth)=>{
        if(_err){
            console.error(_err);
            __callback(_err);
            return;
        }

        var sheet_operator = new gl_spreadsheet.SheetOperator(_stock_type, _sheet_name, _sheet_auth);
        sheet_operator.cleanup_sheet((_err)=>{
            if(_err){
                console.error(_err);
                __callback(_err);
                return;
            }
            __callback(undefined);
        })
    })
}

module.exports.run = run;