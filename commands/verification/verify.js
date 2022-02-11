const { request } = require("../../external/requestHandler");
const { MongoClient } = require('mongodb');
const config = require("../../config.json");
const { MessageEmbed } = require("discord.js");
module.exports = {
  struct: {
    name: "verify",
    type: 1,
    description: "Connect your Discord account to a Hypixel profile. (leave empty for verify instructions)",
    options: [
      {
        name: "username",
        description: "Your in-game username or your UUID",
        type: 3,
        required: false
      }
    ],
  },
  run: async (bot, interaction) => {
    try {
      await interaction.deferReply({ ephemeral: true });
      let warningEmbed = new MessageEmbed()
        .setColor(config.colors.red)
        .setTitle("MISSING PERMISSIONS")
        .setDescription(`The bot is missing the \`MANAGE ROLES\` permissions.`)
        .setFooter(bot.user.username, bot.user.avatarURL())
        .setTimestamp();
      if (!interaction.guild.me.permissions.has("MANAGE_ROLES")) return interaction.followUp({ content: `⠀`, embeds: [warningEmbed] });
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
      const username = interaction.options._hoistedOptions.find(o => o.name == "username")?.value;
      if (username) {
        request(`https://api.slothpixel.me/api/players/${username}`).then(async result => {
          const data = await result.json();
          if (data.error) {
            let errorEmbed = new MessageEmbed()
              .setColor(config.colors.red)
              .setTitle("VERIFICATION FAILED")
              .setDescription(`${data.error}\n\nIf you need help with verification, run \`/verify\` without a username.`)
              .setFooter(bot.user.username, bot.user.avatarURL())
              .setTimestamp();
            interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
          } else {
            if (data.links.DISCORD == null) {
              let errorEmbed = new MessageEmbed()
                .setColor(config.colors.red)
                .setTitle("VERIFICATION FAILED")
                .setDescription("You haven't connected your Discord account on Hypixel yet.\n\nIf you need help with verification, run \`/verify\` without a username.")
                .setFooter(bot.user.username, bot.user.avatarURL())
                .setTimestamp();
              return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
            } else if (data.links.DISCORD.toLowerCase() != interaction.user.tag.toLowerCase()) {
              let errorEmbed = new MessageEmbed()
                .setColor(config.colors.red)
                .setTitle("VERIFICATION FAILED")
                .setDescription(`Please check that your Discord account set on Hypixel matches the Discord account you're using right now.\n\n**Hypixel** → **Discord**\n${data.links.DISCORD} → ${interaction.user.tag}\n\nIf you need help with verification, run \`/verify\` without a username.`)
                .setFooter(bot.user.username, bot.user.avatarURL())
                .setTimestamp();
              return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
            } else {
              const client = new MongoClient(process.env.MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true });
              client.connect(async err => {
                if (err) console.log(err);
                let collection = client.db("Global").collection("Users");
                let guilds = client.db("Global").collection("Guilds");
                try {
                  collection.findOne({ user: interaction.user.id }, (err, item) => {
                    if (err) console.log(err);
                    if (item) {
                      item.guilds.includes(interaction.guild.id) ? 0 : item.guilds.push(interaction.guild.id);
                      collection.updateOne({ user: interaction.user.id }, { $set: { hypixel_username: data.username, uuid: data.uuid, guilds: item.guilds } }, (err, result) => {
                        if (err) console.log(err);
                      });
                    } else {
                      collection.insertOne({ user: interaction.user.id, hypixel_username: data.username, uuid: data.uuid, guilds: [interaction.guild.id] }, (err, result) => {
                        if (err) console.log(err);
                      });
                    };
                    let successEmbed = new MessageEmbed()
                      .setColor(config.colors.green)
                      .setTitle("VERIFICATION SUCCESSFUL")
                      .setDescription(`Name successfully verified: ${data.username}`)
                      .setThumbnail(`https://cravatar.eu/helmhead/${data.username}`)
                      .setFooter(bot.user.username, bot.user.avatarURL())
                      .setTimestamp();
                    guilds.findOne({ guild: interaction.guild.id }, (err, guild) => {
                      if (err) console.log(err);
                      if (guild) {
                        guild.hypixel_guilds.forEach(hypixel_guild => {
                          request(`https://api.slothpixel.me/api/guilds/name/${hypixel_guild}`).then(async result => {
                            let guildData = await result.json();
                            if (!guildData.guild_master) return;
                            let guildUser = guildData.members.find(member => member.uuid == data.uuid);
                            let roles = [];
                            roles = roles.concat(guild?.roles?.verified);
                            if (guildUser) {
                              roles = roles.concat(guild?.roles?.member);

                              guild?.roles?.guild?.forEach(r => {
                                if (r.rank.toLowerCase() == guildUser.rank.toLowerCase()) {
                                  console.log("found");
                                  roles.push(r.role);
                                }
                              });

                            } else {
                              roles = roles.concat(guild?.roles?.guest);
                            }

                            guild?.roles?.network?.forEach(r => {
                              if (r.rank.toLowerCase() == data.rank.toLowerCase()) {
                                roles.push(r.role);
                              }
                            });

                            try {
                              interaction.member.roles.add(roles);
                              client.close();
                            } catch (e) {
                              console.log(e);
                              let errorEmbed = new MessageEmbed()
                                .setColor(config.colors.red)
                                .setTitle("Couldn't give roles to user")
                                .setDescription(`Please check the bot's permissions and make sure the roles are lower in the hierarchy than the bot's highest role.`)
                                .setFooter(bot.user.username, bot.user.avatarURL())
                                .setTimestamp();
                              client.close();
                              return interaction.followUp({ content: `⠀`, ephemeral: false, embeds: [errorEmbed] });
                            }
                          }).catch(err => {
                            let errorEmbed = new MessageEmbed()
                              .setColor(config.colors.red)
                              .setTitle("Hypixel API unaccessible")
                              .setDescription(`Please try again later...`)
                              .setFooter(bot.user.username, bot.user.avatarURL())
                              .setTimestamp();
                            console.log(err);
                            client.close();
                            return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                          });
                        });
                      } else {
                        let errorEmbed = new MessageEmbed()
                          .setColor(config.colors.red)
                          .setTitle("NO LINKED GUILD FOUND")
                          .setDescription(`Please fill in the optional parameter for this command.`)
                          .setFooter(bot.user.username, bot.user.avatarURL())
                          .setTimestamp();
                        client.close();
                        return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                      }
                    })
                    return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed] });
                  });
                } catch (e) {
                  console.log(e);
                  let errorEmbed = new MessageEmbed()
                    .setColor(config.colors.red)
                    .setTitle("VERIFICATION FAILED")
                    .setDescription(`Database error. Please try again later.`)
                    .setFooter(bot.user.username, bot.user.avatarURL())
                    .setTimestamp();
                  client.close();
                  return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                }
              });
            }
          }
        }).catch(e => {
          let errorEmbed = new MessageEmbed()
            .setColor(config.colors.red)
            .setTitle("Hypixel API unaccessable")
            .setDescription(`Please try again later...`)
            .setFooter(bot.user.username, bot.user.avatarURL())
            .setTimestamp();
          console.log(e);
          return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
        })
      } else {
        let instructions = new MessageEmbed()
          .setTitle("VERIFICATION INSTRUCTIONS")
          .setColor(config.colors.main)
          .setDescription(
            "**1.** Join Hypixel\n**2.** Right-Click your Player Head in the hotbar.\n**3.**  Click on Social Media (Twitter Icon).\n**4.**  Click on Discord.\n**5.** Type into the chat your DISCORD username and discriminator. (Username#0000)\n**6.** Return to Discord and run \`/verify (in-game username)\`."
          )
          .setImage("https://hypixel.net/attachments/osl_-gif.1881710/.gif");
        interaction.editReply({ ephemeral: true, embeds: [instructions] });

      }
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
