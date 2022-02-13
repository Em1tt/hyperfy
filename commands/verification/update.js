const { request } = require("../../external/requestHandler");
const { MongoClient } = require('mongodb');
const config = require("../../config.json");
const { MessageEmbed } = require("discord.js");

module.exports = {
  struct: {
    name: "update",
    type: 1,
    description: "Check & update the role status of a user or leave empty to update the entire guild.",
    options: [
      {
        name: "user",
        description: "User to update",
        type: 6,
      }
    ],
  },
  run: async (bot, interaction) => {
    try {
      let errors = 0;
      let updated = 0;
      await interaction.deferReply({ ephemeral: true });
      let errorEmbed = new MessageEmbed()
        .setColor(config.colors.red)
        .setTitle("MISSING PERMISSIONS")
        .setDescription(`This command requires the \`MANAGE SERVER\` permission.`)
        .setFooter(bot.user.username, bot.user.avatarURL())
        .setTimestamp();
      if (!interaction.member.permissions.has("MANAGE_SERVER")) return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
      let warningEmbed = new MessageEmbed()
        .setColor(config.colors.red)
        .setTitle("MISSING PERMISSIONS")
        .setDescription(`The bot is missing the \`MANAGE ROLES\` permissions.`)
        .setFooter(bot.user.username, bot.user.avatarURL())
        .setTimestamp();
      if (!interaction.guild.me.permissions.has("MANAGE_ROLES")) return interaction.followUp({ content: `⠀`, embeds: [warningEmbed] });
      let timeoutEmbed = new MessageEmbed()
        .setColor(config.colors.red)
        .setTitle("GUILD ON TIMEOUT")
        .setDescription(`You can only update an entire guild once per 24 hours.`)
        .setFooter(bot.user.username, bot.user.avatarURL())
        .setTimestamp();
      if (bot.updateTimeout.has(interaction.guild.id)) return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [timeoutEmbed] });

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
      const user = interaction.options._hoistedOptions.find(o => o.name == "user")?.value;
      const client = new MongoClient(process.env.MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true });
      client.connect(err => {
        let internalEmbed = new MessageEmbed()
        .setColor(config.colors.red)
        .setTitle("INTERNAL ERROR")
        .setDescription("Error has been logged.")
        .setFooter(bot.user.username, bot.user.avatarURL())
        .setTimestamp();
        if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
        const guilds = client.db("Global").collection("Guilds");
        const users = client.db("Global").collection("Users");
        guilds.findOne({ guild: interaction.guild.id }, async (err, guild) => {
          let internalEmbed = new MessageEmbed()
          .setColor(config.colors.red)
          .setTitle("INTERNAL ERROR")
          .setDescription("Error has been logged.")
          .setFooter(bot.user.username, bot.user.avatarURL())
          .setTimestamp();
          if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
          if (guild) {
            guild.hypixel_guilds.forEach(g => {
              try {
                request(`https://api.slothpixel.me/api/guilds/name/${g}`).then(async result => {
                  const guildData = await result.json();
                  if (user) {
                    users.findOne({ user: user }, (err, userr) => {
                      let internalEmbed = new MessageEmbed()
                      .setColor(config.colors.red)
                      .setTitle("INTERNAL ERROR")
                      .setDescription("Error has been logged.")
                      .setFooter(bot.user.username, bot.user.avatarURL())
                      .setTimestamp();
                      if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                      if (!userr) {
                        let errorEmbed = new MessageEmbed()
                          .setColor(config.colors.red)
                          .setTitle("USER NOT FOUND")
                          .setDescription("User was not found in database.")
                          .setFooter(bot.user.username, bot.user.avatarURL())
                          .setTimestamp();
                        client.close();
                        return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                      } else {
                        request(`https://api.slothpixel.me/api/players/${userr.uuid}`).then(async result => {
                          const data = await result.json();
                          updateRoles(interaction, guildData, data, guild, userr, user, bot, true);
                          client.close();
                        });
                      };
                    });
                  } else {
                    bot.updateTimeout.add(interaction.guild.id);
                    setTimeout(() => {
                      bot.updateTimeout.delete(interaction.guild.id);
                    }, config.update.timeout);
                    let time = Date.now();
                    let waitEmbed = new MessageEmbed()
                      .setColor(config.colors.yellow)
                      .setTitle("UPDATING USERS")
                      .setDescription(`This might take a while...\
                    \n\nUsers checked: \`0/${await interaction.guild.members.fetch().then(members => { return members.filter(m => !m.user.bot).size })}\`\
                    \nUsers updated: \`0\`\
                    \nUsers not verified: \`0\`\
                    \nErrors while updating: \`0\``)
                      .setFooter(bot.user.username, bot.user.avatarURL())
                      .setTimestamp();
                    await interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [waitEmbed] });
                    let uuidArray = [];
                    let notFound = 0;
                    let checked = 0;
                    interaction.guild.members.fetch().then(members => {
                      members = [...members.filter(m => !m.user.bot)];
                      members.forEach((m, i, a) => {
                        users.findOne({ user: m[0] }, (err, item) => {
                          checked = checked + 1;
                          if (item) {
                            uuidArray.push({ uuid: item.uuid, id: item.user });
                          } else {
                            notFound = notFound + 1;
                          };
                          if (i + 1 == a.length) {
                            const interval = setInterval(async () => {
                              let sliced = uuidArray.splice(0, 15);
                              request(`https://api.slothpixel.me/api/players/${sliced.map(i => i.uuid).join(",")}`).then(async result => {
                                const data = await result.json();
                                if (data.length > 1) {
                                  data.forEach(async (d, i, a) => {
                                    if (interaction.guild.members.cache.get(sliced[i].id)) {
                                      await updateRoles(interaction, guildData, d, guild, sliced[i], sliced[i].id, bot, false);
                                      updated = updated + 1;
                                    } else {
                                      errors = errors + 1;
                                    }
                                  });
                                } else {
                                  interaction.guild.members.fetch(sliced[0]).then(async fetched => {
                                    if (interaction.guild.members.cache.get(sliced[0].id)) {
                                      await updateRoles(interaction, guildData, data, guild, sliced[0], sliced[0].id, bot, false);
                                      updated = updated + 1;
                                    } else {
                                      errors = errors + 1;
                                    }
                                  }).catch(e => {
                                    errors = errors + 1;
                                  });
                                }
                                if (sliced.length < 15) {
                                  clearInterval(interval);
                                  let successEmbed = new MessageEmbed()
                                    .setColor(config.colors.green)
                                    .setTitle("USERS SUCCESSFULLY UPDATED")
                                    .setDescription(`This update took \`${((Date.now() - time) / 1000).toFixed(2)} seconds\``)
                                    .setFooter(bot.user.username, bot.user.avatarURL())
                                    .setTimestamp();
                                  client.close();
                                  await interaction.followUp({ content: `<@${interaction.member.id}>`, ephemeral: true, embeds: [successEmbed] });
                                }
                                let waitEmbed = new MessageEmbed()
                                  .setColor(config.colors.yellow)
                                  .setTitle("UPDATING USERS")
                                  .setDescription(`This might take a while...\
                              \n\nUsers checked: \`${checked}/${await interaction.guild.members.fetch().then(members => { return members.filter(m => !m.user.bot).size })}\`\
                              \nUsers updated: \`${updated}\`\
                              \nUsers not verified: \`${notFound}\`\
                              \nErrors while updating: \`${errors}\``)
                                  .setFooter(bot.user.username, bot.user.avatarURL())
                                  .setTimestamp();
                                await interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [waitEmbed] });
                              });
                            }, 5000);
                          };
                        });
                      });
                    });
                  };
                });
              } catch (e) {
                if (e) console.log(e);
              }
            });
          }
        });
      });

      function updateRoles(interaction, guildData, data, guild, userr, user, bot, update) {
        let roles = [];
        roles = roles.concat(guild?.roles?.verified);
        let guildUser = guildData.members.find(member => member.uuid == userr.uuid);
        if (guildUser) {
          roles = roles.concat(guild?.roles?.member);
          guild?.roles?.guild?.forEach(r => {
            if (r.rank.toLowerCase() == guildUser.rank.toLowerCase()) {
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
          interaction.guild.fetch().then(g => {
            try {
              g.members.cache.get(user).fetch().then(async u => {
                let roless = [...u.roles.cache].map(i => i[0]);
                let errorEmbed = new MessageEmbed()
                  .setColor(config.colors.green)
                  .setTitle("USER UPDATED SUCCESSFULLY")
                  .setDescription(`User was given the following roles: ${roles.filter(i => !roless.includes(i)).length ? roles.filter(i => !roless.includes(i)).map(r => `<@&${r}>`).join(" ") : "`none`"}`)
                  .setFooter(bot.user.username, bot.user.avatarURL())
                  .setTimestamp();
                  try{
                await u.roles.add(roles);
                  }catch(e){
                    e;
                  }
                if (update) {
                  return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                }
              });
            } catch (e) {
              e;
            }
          })
        } catch (e) {
          let errorEmbed = new MessageEmbed()
            .setColor(config.colors.red)
            .setTitle("Couldn't give roles to user")
            .setDescription(`Please check the bot's permissions and make sure the roles are lower in the hierarchy than the bot's highest role.`)
            .setFooter(bot.user.username, bot.user.avatarURL())
            .setTimestamp();
          if (update) {
            return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
          }
        }
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