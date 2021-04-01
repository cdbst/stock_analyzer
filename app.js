
const express = require('express');
const app = express();
const api_router = express.Router();

const data_reader = require('./data_reader.js');
const data_writer = require('./data_writer.js');
const gl_api_auth = require('./google_api_auth.js');

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

var req_sheet_type = undefined
    
if(['finance', 'f'].includes(param.stock_type)){
    req_sheet_type = data_writer.enum_sheet_types.SPREADSHEET_ID_FINANCE;
}else if(['normal', 'n'].includes(param.stock_type)){
    req_sheet_type = data_writer.enum_sheet_types.SPREADSHEET_ID_NORMAL;
}else if(['reits', 'r'].includes(param.stock_type)){
    req_sheet_type = data_writer.enum_sheet_types.SPREADSHEET_ID_REITS;
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

                if(req_sheet_type == data_writer.enum_sheet_types.SPREADSHEET_ID_REITS){
                    validate_sample_data_type = 'Rental Revenue';
                }else if(req_sheet_type == data_writer.enum_sheet_types.SPREADSHEET_ID_NORMAL){
                    validate_sample_data_type = 'Cost Of Revenues';
                }else if(req_sheet_type == data_writer.enum_sheet_types.SPREADSHEET_ID_FINANCE){
                    validate_sample_data_type = 'Provision For Loan Losses';
                }

                if(data_reader.find_data_type_in_dataset(validate_sample_data_type, income_state) == false){
                    console.log('invalid data format : expected type is : ' + param.stock_type);
                    process.exit(1);
                };

                gl_api_auth.get_auth_obj(function(err, auth){

                    if(err){
                        console.log('auth fail.');
                        process.exit(1);
                    }
    
                    data_writer.cleanup_sheet(auth, req_sheet_type, function(e){

                        if(e){
                            console.log(e);
                            process.exit(1);
                        }

                        console.log('1. cleanup complete!!!!');

                        data_writer.update_sheet(auth, req_sheet_type, param.tiker, income_state, balance_sheet, cash_flow, function(e){
                            if(e){
                                console.log(e);
                                process.exit(1);
                            }
                            console.log('2. set complete!!!!');
                            process.exit(0);
                        });
                    });
                });
            });
        });
    });

}else{

    gl_api_auth.get_auth_obj(function(err, auth){

        if(err){
            console.log('auth fail.');
            process.exit(1);
        }

        data_writer.cleanup_sheet(req_sheet_type, function(e){
            if(e){
                console.log(e);
                process.exit(1);
            }
            console.log('cleanup complete!!!!');
            process.exit(0);
        });
    });
}

