const fetch = require("node-fetch");
async function createSlashCommands(object, bot, deleteMode) {
    async function posts(url, deleteMode) {
            let response = await fetch(url, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bot " + process.env.TOKEN
                    },
                    method: deleteMode ? "DELETE" : "POST",
                    body: deleteMode ? "" : JSON.stringify(object)
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
        let response = deleteMode ? await posts(`https://discord.com/api/v8/applications/${bot.user.id}/commands/${object}`, true) : await posts(`https://discord.com/api/v8/applications/${bot.user.id}/commands`, false);
        //let response = deleteMode ? await posts(`https://discord.com/api/v8/applications/${bot.user.id}/guilds/934560536606179329/commands/${object}`, true) : await posts(`https://discord.com/api/v8/applications/${bot.user.id}/guilds/934560536606179329/commands`, false);
        return response;
}
module.exports = {
    createSlashCommands: createSlashCommands
}