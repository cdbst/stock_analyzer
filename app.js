
const express = require('express');
const app = express();
const api_router = express.Router();

const data_reader = require('./data_reader.js');
const data_writer = require('./data_writer.js')

var args = process.argv.slice(2);

var param = {}
param.mode = args[0];


if(args.length < 2){
    console.log('invalid argument : usage : node app.js {mode} - [mode : set, cleanup]\n' +
                '   set mode useage : {tiker} {sheet_type}\n' +
                '       {tiker} - [stock_type]\n' + 
                '       {sheet_type} - [finance, normal, reits]' +
                '   cleanup mode useage : cleanup {sheet_type}\n' +
                '       {sheet_type} - [finance, normal, reits]');

    process.exit(1);
}

if(args[0] == 'set' && args.length != 3){
    console.log('invalid argument : usage : node app.js {mode} - [mode : set, cleanup]\n' +
                '   set mode useage : {tiker} {sheet_type}\n' +
                '       {tiker} - [stock_type]\n' + 
                '       {sheet_type} - [finance, normal, reits]' +
                '   cleanup mode useage : cleanup {sheet_type}\n' +
                '       {sheet_type} - [finance, normal, reits]');

    process.exit(1);
}

if(args[0] == 'cleanup' && args.length != 2){
    console.log('invalid argument : usage : node app.js {mode} - [mode : set, cleanup]\n' +
                '   set mode useage : {tiker} {sheet_type}\n' +
                '       {tiker} - [stock_type]\n' + 
                '       {sheet_type} - [finance, normal, reits]' +
                '   cleanup mode useage : cleanup {sheet_type}\n' +
                '       {sheet_type} - [finance, normal, reits]');

    process.exit(1);
}

var run_mode = args[0] == 'set' ? 0 : 1; // 0 is default mode. 1 is cleanup mode

if(run_mode == 0){ //set mode
    param.tiker = args[1];
    param.stock_type = args[2];
}else{
    param.stock_type = args[1];
}

if(args.length == 2 && args[0] != 'cleanup'){
    console.log('invalid argument : usage : node app.js cleanup');
    process.exit(1);
}

if(args.length == 1){
    run_mode = 1;
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
                data_writer.run(function(){
    
                    var req_sheet_type = undefined
    
                    if(param.stock_type == 'finance'){
                        req_sheet_type = data_writer.enum_sheet_types.SPREADSHEET_ID_FINANCE;
                    }else if(param.stock_type == 'normal'){
                        req_sheet_type = data_writer.enum_sheet_types.SPREADSHEET_ID_NORMAL;
                    }else if(param.stock_type == 'reits'){
                        req_sheet_type = data_writer.enum_sheet_types.SPREADSHEET_ID_REITS;
                    }else{
                        console.log('invalid stock type : ' + param.stock_type);
                        return;
                    }

                    data_writer.cleanup_sheet(req_sheet_type, function(e){
                        
                        if(e){
                            console.log(e);
                            process.exit(1);
                        }

                        console.log('1. cleanup complete!!!!');

                        data_writer.update_sheet(req_sheet_type, param.tiker, income_state, balance_sheet, cash_flow, function(e){
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

    data_writer.run(function(){
    
        var req_sheet_type = undefined

        if(param.stock_type == 'finance'){
            req_sheet_type = data_writer.enum_sheet_types.SPREADSHEET_ID_FINANCE;
        }else if(param.stock_type == 'normal'){
            req_sheet_type = data_writer.enum_sheet_types.SPREADSHEET_ID_NORMAL;
        }else if(param.stock_type == 'reits'){
            req_sheet_type = data_writer.enum_sheet_types.SPREADSHEET_ID_REITS;
        }else{
            console.log('invalid stock type : ' + param.stock_type);
            return;
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

