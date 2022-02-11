const { readFile, readdir } = require("fs"),
    {mainCommands} = require("../config.json");
module.exports = async (bot, AsciiTable) => {
    let date = new Date();
    readdir(mainCommands, (err, subcategories) => {
        if(err){
            console.error(new AsciiTable("Error loading commands").addRow("Current time", date.toTimeString().split(" ")[0]).addRow("Error", err).toString().red); //Shouldn't happen, but it is here just in case...
        }else{
            subcategories.sort().forEach((sub) => {
                readdir(mainCommands+"/"+sub, (err, commands) => {
                    if(err){ //Found a file instead of a folder
                        console.error(new AsciiTable("Error loading script into handler").addRow("Current time", date.toTimeString().split(" ")[0]).addRow("Error", `Please put ${mainCommands}/${sub} into a subcategory folder.`).toString().red);
                    }else{
                        if(commands.length == 0){
                            console.error(new AsciiTable("Empty subcategory found in handler").addRow("Current time", date.toTimeString().split(" ")[0]).addRow("Subcategory name", `${sub}`).toString().yellow);
                        }else{
                            commands.sort().forEach( async (command) => {
                                await bot.commands.set(require(`.${mainCommands}/${sub}/${command}`).struct.name, `${mainCommands}/${sub}/${command}`);
                            });
                        }
                    }
                })
            });
        }
    });
}