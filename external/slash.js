const fetch = require("node-fetch");
async function createSlashCommands(object, bot) {
    async function posts(url) {
            let response = await fetch(url, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bot " + process.env.TOKEN
                    },
                    method: "POST",
                    body: JSON.stringify(object)
                })
                .then(res => res.json())
                .then(json => {
                    if (json.id != undefined) return true;
                    if (json.retry_after != undefined) {
                        console.log(json);
                        return false;
                    }
                })
                return response;
    }
    //UNCOMMENT UPON FINAL RELEASE
        let response = await posts(`https://discord.com/api/v8/applications/${bot.user.id}/commands`);
        //let response = await posts(`https://discord.com/api/v8/applications/${bot.user.id}/guilds/876552011196272700/commands`, false);
        return response;
}
module.exports = {
    createSlashCommands: createSlashCommands
}
