const { MongoClient } = require('mongodb');
const config = require("../../config.json");
const { MessageEmbed } = require("discord.js");
module.exports = {
  struct: {
    name: "connections",
    type: 1,
    description: "Retrieves a list of connected roles."
  },
  run: async (bot, interaction) => {
    try {
      await interaction.deferReply({ ephemeral: true });
      let errorEmbed = new MessageEmbed()
        .setColor(config.colors.red)
        .setTitle("MISSING PERMISSIONS")
        .setDescription(`This command requires the \`MANAGE ROLES\` permission.`)
        .setFooter(bot.user.username, bot.user.avatarURL())
        .setTimestamp();
      if (!interaction.member.permissions.has("MANAGE_ROLES")) return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
      let userEmbed = new MessageEmbed()
        .setColor(config.colors.red)
        .setTitle("USER ON TIMEOUT")
        .setDescription(`Please wait a short while between using commands.`)
        .setFooter(bot.user.username, bot.user.avatarURL())
        .setTimestamp();
      if (bot.commandTimeout.find(i => i.id == interaction.member.id)) return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [userEmbed] });
      bot.commandTimeout.push({ id: interaction.member.id, command: interaction.commandName });
      setTimeout(() => {
        bot.commandTimeout = bot.commandTimeout.filter(i => i.id != interaction.member.id);
      }, config.command.timeout);
      const client = new MongoClient(process.env.MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true });
      client.connect(err => {
        if (err) console.log(err);
        const guilds = client.db("Global").collection("Guilds");
        guilds.findOne({ guild: interaction.guild.id }, (err, guild) => {
          if (guild) {
            let connectionsEmbed = new MessageEmbed()
              .setColor(config.colors.main)
              .setTitle("GUILD CONNECTIONS")
              .addField("Guilds Connected", guild.hypixel_guilds.length ? guild.hypixel_guilds.join(", ") : "none", false)
              .addField("Guest Roles", guild?.roles?.guest?.length ? constructRoles(guild.roles.guest) : "none", false)
              .addField("Member Roles", guild?.roles?.member?.length ? constructRoles(guild.roles.member) : "none", false)
              .addField("Verified Roles", guild?.roles?.verified?.length ? constructRoles(guild.roles.verified) : "none", false)
              .addField("Guild Roles", guild?.roles?.guild?.length ? constructCombos(guild.roles.guild) : "none", false)
              .addField("Network Roles", guild?.roles?.network?.length ? constructCombos(guild.roles.network) : "none", false)
              .setFooter(bot.user.username, bot.user.avatarURL())
              .setTimestamp();
            client.close();
            return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [connectionsEmbed] });
          } else {
            let errorEmbed = new MessageEmbed()
              .setColor(config.colors.red)
              .setTitle("NO LINKED GUILD FOUND")
              .setDescription(`There's no Hypixel guilds connected to this Discord server.`)
              .setFooter(bot.user.username, bot.user.avatarURL())
              .setTimestamp();
            client.close();
            return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
          }
        });
      });
    } catch (e) {
      let errorEmbed = new MessageEmbed()
        .setColor(config.colors.red)
        .setTitle("Hypixel API unaccessable")
        .setDescription(`Please try again later...`)
        .setFooter(bot.user.username, bot.user.avatarURL())
        .setTimestamp();
      console.log(e);
      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
    }
  },
};

function constructRoles(roles) {
  return roles.map(r => `<@&${r}>`).join(" ");
}
function constructCombos(array) {
  return array.map(a => `${a.rank} ➟ <@&${a.role}>`).join("\n");
}