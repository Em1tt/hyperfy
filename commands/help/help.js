const { MessageEmbed } = require("discord.js");
const config = require("../../config.json");
module.exports = {
    struct: {
        name: "help",
        type: 1,
        description: "Get help with setting up the bot.",
        options: [
            {
                name: "subcategory",
                description: "Coming soon",
                type: 3,
                required: false,
                choices: [
                    {
                        name: "verification",
                        value: "verification"
                    },
                    {
                        name: "updating",
                        value: "updating"
                    },
                    {
                        name: "roles",
                        value: "roles"
                    },
                    {
                        name: "guild",
                        value: "guild"
                    },
                ]
            }
        ],
    },
    run: async (bot, interaction) => {
        let subcat = interaction.options._hoistedOptions.find(i => i.name == "subcategory")?.value
        await interaction.deferReply({ ephemeral: true });
        let embed = new MessageEmbed().setColor(config.colors.main).setFooter(bot.user.username, bot.user.avatarURL());
        switch (subcat) {
            case "verification": {
                embed.setTitle("Verification")
                    .setDescription(
                        "**1.** Join Hypixel\n**2.** Right-Click your Player Head in the hotbar.\n**3.**  Click on Social Media (Twitter Icon).\n**4.**  Click on Discord.\n**5.** Type into the chat your DISCORD username and discriminator. (Username#0000)\n**6.** Return to Discord and run \`/verify (in-game username)\`."
                    )
                    .setImage("https://hypixel.net/attachments/osl_-gif.1881710/.gif");
            }; break;
            case "updating": {
                embed.setTitle("Updating")
                    .setDescription("Updating is a helpful tool to help you synchronize roles across multiple users at once, or a single user at a time.\n\nTo start the process\
                    for multiple users, run \`/update\`.\nTo update a single user, run \`/update @user\`");
            }; break;
            case "roles": {
                embed.setTitle("Roles")
                    .setDescription("Binding roles allows you to give special Hypixel users different roles on your Discord server.\n\n**To start the process\
                        you need to first connect your Hypixel guild to the Discord server**\n\
                        \`guest roles\` ➟ Given to verified users who are not inside the Hypixel guild\n\
                        \`member roles\` ➟ Given to verified users who are inside the Hypixel guild\n\
                        \`verified roles\` ➟ Given to verified users regardless of whether in Hypixel guild\n\
                        \`guild roles\` ➟ Given to verified users who have a Hypixel guild role\n\
                        \`network roles\` ➟ Given to verified users who have a Hypixel network role\n\nRun \`/role <category> <action>\`");
            }; break;
            case "guild": {
                embed.setTitle("Guild")
                    .setDescription("Connecting your Hypixel guild to the Discord server unlocks essential tools of this bot. **You can connect up to two per Discord server.**\n\nRun \
                    \`/guild add <hypixel_guild>\`");
            }; break;
            default: {
                embed.setDescription(`Here's a few instructions to get you started.\n\nTo link a Hypixel guild, run \`/guild add <hypixelGuild>\` (you have to be the Guild Master)\n\n**Add verification roles (up to 3 per category)**\n\
    \`/role guest set\` ➟ Given to verified users who are not inside the Hypixel guild\n\
    \`/role member set\` ➟ Given to verified users who are inside the Hypixel guild\n\
    \`/role verified set\` ➟ Given to verified users regardless whether in Hypixel guild\n\
    \`/role guild set\` ➟ Given to verified users who have a Hypixel guild role\n\
    \`/role network set\` ➟ Given to verified users who have a Hypixel network role\n\n\
    Prompt your users to run \`/verify <username>\` to verify.\n\nIf you have any questions, feel free to [join our support server](${config.supportServer})`)
            }; break;
        }
        interaction.editReply({ ephemeral: true, embeds: [embed] })
    },
};