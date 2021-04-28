const axios = require('axios')
const server = require('./api.js');
const readline = require('readline');

const rl = readline.createInterface({input: process.stdin, output: process.stdout});

var read_stock_tiker = function(){
    process.stdout.write('input stock tiker> ');

    rl.on("line", function(line){
        request_making_finance_file(line);
        rl.close();
    });
}

var request_making_finance_file = function(_ticker){


    axios.post('http://localhost:' + (process.env.PORT || 8080) + '/api/finance', {
        action: {
            params : {
                ticker : _ticker
            }
        }
    })
    .then(res => {

        if(res.status == 200){
            console.log(res.data);
        }else{
            console.log('req fail - status code : ' + res.status);
        }
        
        read_stock_tiker();
    })
    .catch(error => {
        console.error(error)
    });
}

server.run(()=>{
    read_stock_tiker();
    //request_making_finance_file('MMM');
});