var root_cas = require('ssl-root-cas/latest').create();
var https = require('https');
https.globalAgent.options.ca = root_cas;

var zlib = require('zlib');

var enum_financial_data_type = {
    income_statement : 'income-statement',
    balance_sheet : 'balance-sheet',
    cash_flow_statement : 'cash-flow-statement'
}

https://seekingalpha.com/symbol/KO/financials-data?period_type=annual&statement_type=cash-flow-statement&order_type=latest_right&is_pro=false

var get_financial_data = function(tiker, financial_data_type, __callback){

    var get_options = {
        host: 'seekingalpha.com',
        port: '443',
        path: '/symbol/' + tiker + '/financials-data?period_type=annual&statement_type=' + financial_data_type + '&order_type=latest_right&is_pro=false',
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

module.exports.get_financial_data = get_financial_data;
module.exports.enum_financial_data_type = enum_financial_data_type;