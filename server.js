const express = require('express');
const app = express();
const api_router = express.Router();


app.use('/api', api_router);

app.get('/', function (req, res) {
    res.send('test');
});

app.listen(process.env.PORT || 8080, function () {
    console.log('run -> stock analyzer API server ' + (process.env.PORT || 8080));
});

/**
 * @description 'rest api' -  'getthreqexp' : 타이틀 홀더 카드의 특정 레벨 달성을 위해 필요한 기존카드의 최소 경험치를 계산함.
 */
 api_router.post('/getthreqexp', function (req, res){

    if(req.body.action == null && req.body.action.params == null){
        res_to_kakao_server(res, "invalid server error (invalid client request)");
        return;      
    }

    const tiker = req.body.action.params.tiker; // title holder card level
});


var res_to_kakao_server = function (_res, _msg){

    const res_body = {
        result : _msg
    };

    _res.status(200).send(res_body);   
}