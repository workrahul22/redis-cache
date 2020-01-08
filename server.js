const express = require("express");
const responseTime = require("response-time");
const axios = require("axios");
const redis = require("redis");

const app = express();

const client = redis.createClient();

client.on('error',(err) => {
    console.log('Error '+err);
});

app.use(responseTime());

app.get("/api/search", (req,res) => {
    const query = (req.query.query).trim();
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=parse&format=json&section=0&page=${query}`;
    return client.get(`wikipedia:${query}`, (err,result) => {
        if(result) {
            const resultJson = JSON.parse(result);
            return res.status(200).json(resultJson);
        } else{
            return axios.get(searchUrl)
            .then(response => {
                const responseJson = response.data;
                client.setex(`wikipedia:${query}`, 3600, JSON.stringify({source: 'Redis Cache', ...responseJson}));
                return res.status(200).json({source: 'Wikipedia API', ...responseJson});
            })
            .catch(err=>{
                return res.json(err);
            });
        }
    });
});

app.listen(3000, () => {
    console.log('Server listening on port: ', 3000);
});