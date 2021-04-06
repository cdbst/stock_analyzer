var root_cas = require('ssl-root-cas/latest').create();
var https = require('https');
https.globalAgent.options.ca = root_cas;

const zlib = require('zlib');

const enum_financial_data_type = {
    income_statement : 'income-statement',
    balance_sheet : 'balance-sheet',
    cash_flow_statement : 'cash-flow-statement'
}

const enum_req_period_type = {
    annual : 'annual',
    quarterly : 'quarterly'
}

function get_financial_data(ticker, financial_data_type, period_type, timeout = undefined, __callback){

    // url example : https://seekingalpha.com/symbol/KO/financials-data?period_type=annual&statement_type=cash-flow-statement&order_type=latest_right&is_pro=false
    var get_options = {
        host: 'seekingalpha.com',
        port: '443',
        path: '/symbol/' + ticker + '/financials-data?period_type='+ period_type +'&statement_type=' + financial_data_type + '&order_type=latest_right&is_pro=false',
        method: 'GET',
        headers: {
            'accept' : '*/*',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'referer': 'https://seekingalpha.com/symbol/KO/income-statement',
            'cache-control': 'no-cache',
            'User-Agent': 'Mozilla/5.0'
        }
    };

    if(timeout != undefined){
        get_options.timeout = timeout;
    }
  
    var get_req = https.request(get_options, function(res) {

        if(res.statusCode != 200){
            __callback('invalid server response', undefined);
            return;
        }

        var gunzip = zlib.createGunzip();            
        res.pipe(gunzip);
        var buffer = [];

        gunzip.on('data', function(data) {
            
            buffer.push(data.toString())

        }).on("end", function() {
            
            __callback(null, buffer.join(""));

        }).on("error", function(e) {
            __callback(e, undefined);
        })

    });
  
    get_req.on('error', function(e) { 
        console.error(e);
        __callback(e, undefined);
    });

    get_req.end();
    return;
}

function find_data_type_in_dataset(data_types, date_set){

    var super_set = date_set.data;

    for(var i = 0; i < super_set.length; i++){
        var sub_set = super_set[i];

        for(var j = 0; j < sub_set.length; j++){
            var rows = sub_set[j];

            for(var k = 0; k < rows.length; k++){
                var row = rows[k];

                if(data_types.includes(row.value)){
                    return true;
                }
            }
        }
    }

    return false; // test code
}

function get_data_from_seeking_alpha(ticker, period_type, __callback){

    get_financial_data(ticker, enum_financial_data_type.income_statement, period_type, undefined, function(err, income_state_data){

        if(err){
            console.error('fail : get financial data from seeking alpah');
            __callback(err);
            return;
        }
        
        var income_state = JSON.parse(income_state_data);
    
        get_financial_data(ticker, enum_financial_data_type.balance_sheet, period_type, undefined, function(err, balance_sheet_data){
            if(err){
                console.error('fail : get financial data from seeking alpah');
                __callback(err);
                return;
            }

            var balance_sheet = JSON.parse(balance_sheet_data);
    
            get_financial_data(ticker, enum_financial_data_type.cash_flow_statement, period_type, undefined, function(err, cash_flow_data){
    
                if(err){
                    console.error('fail : get financial data from seeking alpah');
                    __callback(err);
                    return;
                }
            
                var cash_flow = JSON.parse(cash_flow_data);

                __callback(undefined, income_state, balance_sheet, cash_flow, period_type);
            });
        });
    });
}

function is_valid_ticker(_ticker, __callback){

    get_financial_data(_ticker, enum_financial_data_type.income_statement, enum_req_period_type.annual, 4000, (_err, _income_state)=>{
        if(_err){
            console.log(_err);
            __callback(_err);
            return;
        }

        var income_state = JSON.parse(_income_state);


        if(find_data_type_in_dataset(['Cost Of Revenues', 'Rental Revenue', 'Provision For Loan Losses'], income_state) == false){
            console.error('invalid stock type');
            __callback('invalid stock type');
            return;
        }

        __callback(undefined);
    });
}

module.exports.get_financial_data = get_financial_data;
module.exports.find_data_type_in_dataset = find_data_type_in_dataset;
module.exports.get_data_from_seeking_alpha = get_data_from_seeking_alpha;
module.exports.is_valid_ticker = is_valid_ticker;
module.exports.enum_financial_data_type = enum_financial_data_type;
module.exports.enum_req_period_type = enum_req_period_type;