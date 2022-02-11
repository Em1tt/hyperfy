const { createSlashCommands } = require("./external/slash");
const config = require("./config.json");
const { Client, Intents, Collection, MessageEmbed } = require("discord.js"),
    AsciiTable = require('ascii-table'),
    bot = new Client({ "intents": [Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILDS] });
bot.updateTimeout = new Set();
bot.commandTimeout = new Array();
require("colors");

require("dotenv").config({
    path: __dirname + "/.env"
});

bot.commands = new Collection();

require("./external/cmd")(bot, AsciiTable);

bot.once("rateLimit", (data) => {
    let date = new Date();
    console.log(new AsciiTable("Discord Client Throttled").addRow("Current Time", date.toTimeString().split(" ")[0]).addRow("Timeout", data.timeout).addRow("Method", data.method).addRow("Path", data.path).toString().yellow);
    console.log(data);
})

bot.once("ready", async () => {
    let date = new Date();
    console.log(new AsciiTable("Discord Client Ready!").addRow("Current Time", date.toTimeString().split(" ")[0]).toString().green);
    //Start registering slash commands
    let commandTable = new AsciiTable("Registration of Slash commands".cyan).setHeading("Command Name", "Status", "Bound to");
    iteration = 0;
    bot.verifyWarn, bot.roleWarn = [];
    bot.commands.sort().forEach(async (command, name) => {
        var index = [...bot.commands].map(a => a[1]).indexOf(command);
        (index % 5 == 0 && index > 0) ? iteration++ : "";
        setTimeout(async () => {
            createSlashCommands(require(command).struct, bot, false).then(val => {
                if (val) {
                    commandTable.addRow(require(command).struct.name, "✅", command);
                } else {
                    commandTable.addRow(require(command).struct.name, "🚫", command);
                }
            })
        }, (index % 5 == 0 && index > 0) ? index * 5 * 1000 : iteration * 5 * 5 * 1000);
    })
    console.log(new AsciiTable().addRow(`Waiting for slash commands to register (approx. ${(iteration + 1) * 15} seconds)`).toString().cyan);
    let decoyIteration = 0;
    let interval = setInterval(() => {
        commandTable.setTitle("Registration of Slash commands ".cyan + `#${decoyIteration + 1}/${iteration + 1}`.cyan);
        commandTable.sortColumn(0, (a, b) => {
            return a - b;
        })
        console.log(commandTable.toString());
        commandTable.clearRows();
        if (decoyIteration == iteration) clearInterval(interval);
        decoyIteration++;
    }, 15000);
});

bot.on('guildCreate', guild => {
    if (guild.deleted || !guild.available) return;
    let inviteEmbed = new MessageEmbed()
        .setColor(config.colors.main)
        .setTitle("Thanks for inviting me!")
        .setDescription(`Here's a few instructions to get you started.\n\nTo link a Hypixel guild, run \`/guild add <hypixelGuild>\` (you have to be the Guild Master)\n\n**Add verification roles (up to 3 per category)**\n\
    \`/role guest set\` ➟ Given to verified users who are not inside the Hypixel guild\n\
    \`/role member set\` ➟ Given to verified users who are inside the Hypixel guild\n\
    \`/role verified set\` ➟ Given to verified users regardless whether in Hypixel guild\n\
    \`/role guild set\` ➟ Given to verified users who have a Hypixel guild role\n\
    \`/role network set\` ➟ Given to verified users who have a Hypixel network role\n\n\
    Prompt your users to run \`/verify <username>\` to verify.\n\nIf you have any questions, feel free to [join our support server](${config.supportServer})`)
        .setFooter(bot.user.username, bot.user.avatarURL())
        .setTimestamp();
    if (guild.systemChannel.permissionsFor(guild.me).has("SEND_MESSAGES")) {
        return guild.systemChannel.send({ content: `⠀`, embeds: [inviteEmbed] });
    } else {
        bot.users.fetch(guild.ownerId).then(user => {
            user.send({ content: `⠀`, embeds: [inviteEmbed] }).catch(e => {
                e;
            })
        }).catch(e => {
            e;
        })
    };
})

bot.once("invalidated", () => {
    console.log(new AsciiTable().addRow("Discord Client Invalidated!").toString().red);
    bot.destroy();
    process.kill();
})
bot.on("interactionCreate", (interaction) => {
    if (interaction.guild.deleted || !interaction.guild.available) return;
    if (interaction.isCommand()) {
        require(bot.commands.get(interaction.commandName)).run(bot, interaction);
        //remove after dev phase to decrease RAM usage. (provides automatic reload of command)
        delete require.cache[require.resolve(bot.commands.get(interaction.commandName))];
    };
});

bot.login(process.env.TOKEN);