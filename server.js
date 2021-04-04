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
