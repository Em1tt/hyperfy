const { MessageEmbed } = require("discord.js");
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
                        name: "connecting",
                        value: "connecting"
                    },
                    {
                        name: "roles",
                        value: "roles"
                    },
                ]
            }
        ],
    },
    run: async (bot, interaction) => {
        await interaction.deferReply({ ephemeral: true });
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
        interaction.editReply({ ephemeral: true, embeds: [inviteEmbed] })
    },
};