const fetch = require("node-fetch");
async function request(url){
const result = await fetch(url, {
    headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.APIKEY
    },
    method: "GET"
});
return result;
}

module.exports = {
    request: request
}