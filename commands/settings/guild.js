const { request } = require("../../external/requestHandler");
const { MongoClient } = require('mongodb');
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const config = require("../../config.json");
const QuickChart = require('quickchart-js');
module.exports = {
  struct: {
    name: "guild",
    type: 1,
    description: "Connect a Hypixel guild to this Discord server.",
    options: [
      {
        "name": "add",
        description: "Adds a Hypixel guild to this Discord server.",
        "type": 1,
        options: [
          {
            "name": "guild",
            "type": 3,
            description: "The guild to add.",
            required: true
          }
        ]
      },
      {
        "name": "remove",
        description: "Removes a Hypixel guild from this Discord server.",
        "type": 1
      },
      {
        "name": "stats",
        description: "Retrieves the Hypixel stats for all guilds connected to this Discord server.",
        "type": 1,
        options: [
          {
            "name": "guild",
            "type": 3,
            description: "The guild to view the stats of.",
            required: false
          }
        ]
      }
    ]
  },
  run: async (bot, interaction) => {
    await interaction.deferReply({ ephemeral: true });
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
    switch (interaction.options._subcommand) {
      case "add": {
        if (interaction.member.permissions.has("MANAGE_SERVER")) {
          request(`https://api.slothpixel.me/api/guilds/name/${interaction.options._hoistedOptions.find(o => o.name == "guild")?.value}`).then(async result => {
            let data = await result.json();
            let errorEmbed = new MessageEmbed()
              .setColor(config.colors.red)
              .setTitle("ADDING GUILD FAILED")
              .setDescription(`Couldn't find guild \`${interaction.options._hoistedOptions.find(o => o.name == "guild")?.value}\``)
              .setFooter(bot.user.username, bot.user.avatarURL())
              .setTimestamp();
            if (!data.guild_master) return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
            const client = new MongoClient(process.env.MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true });
            client.connect(async err => {
              let internalEmbed = new MessageEmbed()
              .setColor(config.colors.red)
              .setTitle("INTERNAL ERROR")
              .setDescription("Error has been logged.")
              .setFooter(bot.user.username, bot.user.avatarURL())
              .setTimestamp();
              if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
              let collection = client.db("Global").collection("Users");
              try {
                collection.findOne({ user: interaction.user.id }, (err, item) => {
                  let internalEmbed = new MessageEmbed()
                  .setColor(config.colors.red)
                  .setTitle("INTERNAL ERROR")
                  .setDescription("Error has been logged.")
                  .setFooter(bot.user.username, bot.user.avatarURL())
                  .setTimestamp();
                  if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                  if (item) {
                    item.guilds.includes(interaction.guild.id) ? "" : item.guilds.push(interaction.guild.id);
                    if (item.uuid != data.guild_master.uuid) {
                      let guilds = client.db("Global").collection("Guilds");
                      guilds.findOne({ guild: interaction.guild.id }, (err, guild) => {
                        if (guild) {
                          if (guild.hypixel_guilds.length == config.guilds.maximum) {
                            let errorEmbed = new MessageEmbed()
                              .setColor(config.colors.red)
                              .setTitle("ADDING GUILD FAILED")
                              .setDescription(`This server already has the maximum amount of guilds connected to it. (${config.guilds.maximum})`)
                              .setFooter(bot.user.username, bot.user.avatarURL())
                              .setTimestamp();
                            client.close();
                            return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                          } else if (!guild.hypixel_guilds.includes(interaction.options._hoistedOptions.find(i => i.name == "guild")?.value)) {
                            guild.hypixel_guilds.push(interaction.options._hoistedOptions.find(i => i.name == "guild")?.value)
                            guilds.updateOne({ guild: interaction.guild.id }, { $set: { hypixel_guilds: guild.hypixel_guilds } }, (err, result) => {
                              let internalEmbed = new MessageEmbed()
                              .setColor(config.colors.red)
                              .setTitle("INTERNAL ERROR")
                              .setDescription("Error has been logged.")
                              .setFooter(bot.user.username, bot.user.avatarURL())
                              .setTimestamp();
                          client.close();

                              if(err) return console.log(err), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                            });
                            let successEmbed = new MessageEmbed()
                              .setColor(config.colors.green)
                              .setTitle("ADDING GUILD SUCCESSFUL")
                              .setDescription(`Successfully connected \`${interaction.options._hoistedOptions.find(o => o.name == "guild")?.value}\` to this Discord server.`)
                              .setFooter(bot.user.username, bot.user.avatarURL())
                              .setTimestamp();
                            return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed] });
                          } else {
                            let errorEmbed = new MessageEmbed()
                              .setColor(config.colors.red)
                              .setTitle("ADDING GUILD FAILED")
                              .setDescription(`This guild is already connected to this Discord server.`)
                              .setFooter(bot.user.username, bot.user.avatarURL())
                              .setTimestamp();
                            client.close();
                            return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                          }
                        } else {
                          guilds.insertOne({ guild: interaction.guild.id, hypixel_guilds: [interaction.options._hoistedOptions.find(i => i.name == "guild")?.value] }, (err, result) => {
                            let internalEmbed = new MessageEmbed()
                            .setColor(config.colors.red)
                            .setTitle("INTERNAL ERROR")
                            .setDescription("Error has been logged.")
                            .setFooter(bot.user.username, bot.user.avatarURL())
                            .setTimestamp();
                          client.close();
                            if(err) return console.log(err), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                          })
                          let successEmbed = new MessageEmbed()
                            .setColor(config.colors.green)
                            .setTitle("ADDING GUILD SUCCESSFUL")
                            .setDescription(`Successfully connected \`${interaction.options._hoistedOptions.find(o => o.name == "guild")?.value}\` to this Discord server.`)
                            .setFooter(bot.user.username, bot.user.avatarURL())
                            .setTimestamp();
                          return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed] });
                        }
                      });
                    } else {
                      let errorEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("SETTING UP GUILD FAILED")
                        .setDescription(`You can only connect a guild you are the guild master in.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                    }
                  } else {
                    let errorEmbed = new MessageEmbed()
                      .setColor(config.colors.red)
                      .setTitle("SETTING UP GUILD FAILED")
                      .setDescription(`You need to connect your account first. Do \`/verify\` for more information.`)
                      .setFooter(bot.user.username, bot.user.avatarURL())
                      .setTimestamp();
                    client.close();
                    return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                  }
                });
              } catch (e) {
                let errorEmbed = new MessageEmbed()
                  .setColor(config.colors.red)
                  .setTitle("SETTING UP GUILD FAILED")
                  .setDescription(`Database error. Please try again later.`)
                  .setFooter(bot.user.username, bot.user.avatarURL())
                  .setTimestamp();
                console.log(e);
                client.close();
                return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
              }
            });
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
          let errorEmbed = new MessageEmbed()
            .setColor(config.colors.red)
            .setTitle("MISSING PERMISSIONS")
            .setDescription(`This command requires the \`MANAGE SERVER\` permission.`)
            .setFooter(bot.user.username, bot.user.avatarURL())
            .setTimestamp();
          return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
        }
      }; break;
      case "remove": {
        if (interaction.member.permissions.has("MANAGE_SERVER")) {
          const client = new MongoClient(process.env.MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true });
          client.connect(async err => {
            let internalEmbed = new MessageEmbed()
            .setColor(config.colors.red)
            .setTitle("INTERNAL ERROR")
            .setDescription("Error has been logged.")
            .setFooter(bot.user.username, bot.user.avatarURL())
            .setTimestamp();
            if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
            let collection = client.db("Global").collection("Guilds");
            try {
              collection.findOne({ guild: interaction.guild.id }, (err, item) => {
                let internalEmbed = new MessageEmbed()
                .setColor(config.colors.red)
                .setTitle("INTERNAL ERROR")
                .setDescription("Error has been logged.")
                .setFooter(bot.user.username, bot.user.avatarURL())
                .setTimestamp();
                if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                if (item && item.hypixel_guilds.length) {
                  //Button popup
                  let rows = [];
                  let row = [];
                  item.hypixel_guilds.forEach((g, i, a) => {
                    row.push(new MessageButton().setCustomId(g).setLabel(g).setStyle('DANGER'));
                    if ((row.length == 5 || i + 1 == a.length) && i / 5 < 5) {
                      rows.push(new MessageActionRow().addComponents(row));
                      row = [];
                    }
                  });
                  let waitEmbed = new MessageEmbed()
                    .setColor(config.colors.main)
                    .setTitle("Choose guild to unlink from this Discord server.")
                    .setDescription(`Click on the button below with the name of the guild you wish to remove.`)
                    .setFooter(bot.user.username, bot.user.avatarURL())
                    .setTimestamp();
                  interaction.editReply({ content: `⠀`, embeds: [waitEmbed], components: rows, ephemeral: true });
                  bot.on("interactionCreate", button => {
                    if (!button.isButton()) return;
                    if (button.message.interaction.id != interaction.id) return;
                    collection.updateOne({ guild: interaction.guild.id }, { $set: { hypixel_guilds: item.hypixel_guilds.filter(e => e !== button.customId) } }, (err, result) => {
                      let internalEmbed = new MessageEmbed()
                      .setColor(config.colors.red)
                      .setTitle("INTERNAL ERROR")
                      .setDescription("Error has been logged.")
                      .setFooter(bot.user.username, bot.user.avatarURL())
                      .setTimestamp();
                      client.close();
                      if(err) return console.log(err), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                    });
                    let successEmbed = new MessageEmbed()
                      .setColor(config.colors.green)
                      .setTitle("REMOVING GUILD SUCCESSFUL")
                      .setDescription(`Unlinked guild ${button.customId} from this Discord server.`)
                      .setFooter(bot.user.username, bot.user.avatarURL())
                      .setTimestamp();
                    return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed], components: [] });
                  });

                } else {
                  let errorEmbed = new MessageEmbed()
                    .setColor(config.colors.red)
                    .setTitle("REMOVING GUILD FAILED")
                    .setDescription(`This Discord server has no Hypixel guilds connected to it.`)
                    .setFooter(bot.user.username, bot.user.avatarURL())
                    .setTimestamp();
                  client.close();
                  return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                }
              })
            } catch (e) {
              let errorEmbed = new MessageEmbed()
                .setColor(config.colors.red)
                .setTitle("REMOVING GUILD FAILED")
                .setDescription(`Database error. Please try again later.`)
                .setFooter(bot.user.username, bot.user.avatarURL())
                .setTimestamp();
              console.log(e);
              client.close();
              return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
            }
          });
        } else {
          let errorEmbed = new MessageEmbed()
            .setColor(config.colors.red)
            .setTitle("MISSING PERMMISSIONS")
            .setDescription(`This command requires the \`MANAGE SERVER\` permission.`)
            .setFooter(bot.user.username, bot.user.avatarURL())
            .setTimestamp();
          return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
        }
      } break;
      case "stats": {
        if (interaction.options._hoistedOptions.find(o => o.name == "guild")?.value) {
          request(`https://api.slothpixel.me/api/guilds/name/${interaction.options._hoistedOptions.find(o => o.name == "guild")?.value}`).then(async response => {
            const data = await response.json();
            if (data.guild_master) {
              request(`https://api.slothpixel.me/api/players/${data.guild_master.uuid}`).then(async userBuf => {
                const user = await userBuf.json();
                let createdAt = new Date(data.created).toDateString().split(" ");
                createdAt[2].endsWith(1) ? createdAt[2] = `${createdAt[2]}st` : createdAt[2].endsWith(2) ? createdAt[2] = `${createdAt[2]}nd` : createdAt[2].endsWith(3) ? createdAt[2] = `${createdAt[2]}rd` : createdAt[2] = `${createdAt[2]}th`;
                if (createdAt[2].startsWith(0)) createdAt[2].slice(1);
                let days = [];
                let week = 0;
                Object.entries(data.exp_history).forEach(entry => {
                  days.push(`\`•\` ${entry[0]} ➟ \`${Math.floor(scaleXP(entry[1])).toLocaleString()}\` | \`${entry[1].toLocaleString()}\``);
                  week = week + entry[1];
                });
                weekly = `\`${scaleXP(week).toLocaleString()}\` | \`${week.toLocaleString()}\``
                days.reverse();
                data.ranks.splice(0, 1);
                const chart = new QuickChart();
                chart.setWidth(800);
                chart.setHeight(300);
                chart.setBackgroundColor("transparent");
                chart.setConfig({
                  type: "line",
                  data: {
                    labels: Object.keys(data.exp_history).reverse(),
                    datasets: [{
                      label: 'Guild EXP',
                      data: Object.values(data.exp_history).reverse(),
                      fill: true,
                      backgroundColor: "rgba(233,167,40,0.2)",
                      borderColor: config.colors.main,
                      lineTension: "0.2"
                    }]
                  },
                  options: {
                    scales: {
                      yAxes: [{
                        beginAtZero: true,
                        ticks: {
                          fontColor: "white"
                        }
                      }],
                      xAxes: [{
                        beginAtZero: true,
                        ticks: {
                          fontColor: "white"
                        }
                      }]
                    },
                    legend: {
                      labels: {
                        fontColor: "white"
                      }
                    }
                  }
                });

                let successEmbed = new MessageEmbed()
                  .setColor(config.colors.main)
                  .setTitle("GUILD STATS - " + data.name)
                  .setDescription(data.description ? data.description : "no description")
                  .addFields([{
                    name: "❯ Guild Master",
                    value: user.username ? user.username : "Couldn't find user",
                    inline: true
                  }, {
                    name: "❯ Members",
                    value: `${data.members.length}/125`,
                    inline: true
                  }, {
                    name: "❯ Created",
                    value: `${createdAt[1]} ${createdAt[2]} ${createdAt[3]}`,
                    inline: true
                  }, {
                    name: "❯ Level",
                    value: `${Math.floor(data.level)}`,
                    inline: true
                  }, {
                    name: "❯ Total Experience",
                    value: `${data.exp.toLocaleString()}`,
                    inline: true
                  }, {
                    name: "❯ Daily EXP (Scaled | Raw)",
                    value: days.reverse().join("\n")
                  }, {
                    name: "❯ Weekly EXP (Scaled | Raw)",
                    value: weekly
                  }, {
                    name: "❯ Preferred Games",
                    value: data.preferred_games.length ? data.preferred_games.join(", ") : "none"
                  }, {
                    name: "❯ Ranks",
                    value: data.ranks.length ? data.ranks.map(i => `\`${i.name}\``).join(", ") : "none"
                  }])
                  .setFooter(bot.user.username, bot.user.avatarURL())
                  .setImage(chart.getUrl())
                  .setTimestamp();
                return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed], components: [] });
              }).catch(e => {
                let errorEmbed = new MessageEmbed()
                  .setColor(config.colors.red)
                  .setTitle("Hypixel API unaccessable")
                  .setDescription(`Please try again later...`)
                  .setFooter(bot.user.username, bot.user.avatarURL())
                  .setTimestamp();
                console.log(e);
                return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
              });
            } else { //Error with invalid guild
              let errorEmbed = new MessageEmbed()
                .setColor(config.colors.red)
                .setTitle("INVALID GUILD")
                .setDescription(`Couldn't find guild....`)
                .setFooter(bot.user.username, bot.user.avatarURL())
                .setTimestamp();
              return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
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
          const client = new MongoClient(process.env.MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true });
          client.connect(async err => {
            let internalEmbed = new MessageEmbed()
            .setColor(config.colors.red)
            .setTitle("INTERNAL ERROR")
            .setDescription("Error has been logged.")
            .setFooter(bot.user.username, bot.user.avatarURL())
            .setTimestamp();
            if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
            let collection = client.db("Global").collection("Guilds");
            try {
              collection.findOne({ guild: interaction.guild.id }, (err, item) => {
                let internalEmbed = new MessageEmbed()
                .setColor(config.colors.red)
                .setTitle("INTERNAL ERROR")
                .setDescription("Error has been logged.")
                .setFooter(bot.user.username, bot.user.avatarURL())
                .setTimestamp();
                if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                if (item?.hypixel_guilds?.length > 1) {
                  //Button popup
                  let rows = [];
                  let row = [];
                  item.hypixel_guilds.forEach((g, i, a) => {
                    row.push(new MessageButton().setCustomId(g).setLabel(g).setStyle('DANGER'));
                    if ((row.length == 5 || i + 1 == a.length) && i / 5 < 5) {
                      rows.push(new MessageActionRow().addComponents(row));
                      row = [];
                    }
                  });
                  let waitEmbed = new MessageEmbed()
                    .setColor(config.colors.main)
                    .setTitle("GUILD STATS")
                    .setDescription(`Click on the button below with the name of the guild you wish to see the stats of.`)
                    .setFooter(bot.user.username, bot.user.avatarURL())
                    .setTimestamp();
                  interaction.editReply({ content: `⠀`, embeds: [waitEmbed], components: rows, ephemeral: true });
                  bot.on("interactionCreate", button => {
                    if (!button.isButton()) return;
                    if (button.message.interaction.id != interaction.id) return;
                    request(`https://api.slothpixel.me/api/guilds/name/${button.customId}`).then(async response => {
                      const data = await response.json();
                      console.log(data);
                      if (data.guild_master) {
                        request(`https://api.slothpixel.me/api/players/${data.guild_master.uuid}`).then(async userBuf => {
                          const user = await userBuf.json();
                          let createdAt = new Date(data.created).toDateString().split(" ");
                          createdAt[2].endsWith(1) ? createdAt[2] = `${createdAt[2]}st` : createdAt[2].endsWith(2) ? createdAt[2] = `${createdAt[2]}nd` : createdAt[2].endsWith(3) ? createdAt[2] = `${createdAt[2]}rd` : createdAt[2] = `${createdAt[2]}th`;
                          if (createdAt[2].startsWith(0)) createdAt[2].slice(1);
                          let days = [];
                          let week = 0;
                          Object.entries(data.exp_history).forEach(entry => {
                            days.push(`\`•\` ${entry[0]} ➟ \`${Math.floor(scaleXP(entry[1])).toLocaleString()}\` | \`${entry[1].toLocaleString()}\``);
                            week = week + entry[1];
                          });
                          weekly = `\`${scaleXP(week).toLocaleString()}\` | \`${week.toLocaleString()}\``
                          days.reverse();
                          data.ranks.splice(0, 1);
                          const chart = new QuickChart();
                          chart.setWidth(800);
                          chart.setHeight(300);
                          chart.setBackgroundColor("transparent");
                          chart.setConfig({
                            type: "line",
                            data: {
                              labels: Object.keys(data.exp_history).reverse(),
                              datasets: [{
                                label: 'Guild EXP',
                                data: Object.values(data.exp_history).reverse(),
                                fill: true,
                                backgroundColor: "rgba(233,167,40,0.1)",
                                borderColor: config.colors.main,
                                lineTension: "0.2"
                              }]
                            },
                            options: {
                              scales: {
                                yAxes: [{
                                  beginAtZero: true,
                                  ticks: {
                                    fontColor: "white"
                                  }
                                }],
                                xAxes: [{
                                  beginAtZero: true,
                                  ticks: {
                                    fontColor: "white"
                                  }
                                }]
                              },
                              legend: {
                                labels: {
                                  fontColor: "white"
                                }
                              }
                            }
                          });

                          let successEmbed = new MessageEmbed()
                            .setColor(config.colors.main)
                            .setTitle("GUILD STATS - " + data.name)
                            .setDescription(data.description ? data.description : "no description")
                            .addFields([{
                              name: "❯ Guild Master",
                              value: user.username ? user.username : "Couldn't find user",
                              inline: true
                            }, {
                              name: "❯ Members",
                              value: `${data.members.length}/125`,
                              inline: true
                            }, {
                              name: "❯ Created",
                              value: `${createdAt[1]} ${createdAt[2]} ${createdAt[3]}`,
                              inline: true
                            }, {
                              name: "❯ Level",
                              value: `${Math.floor(data.level)}`,
                              inline: true
                            }, {
                              name: "❯ Total Experience",
                              value: `${data.exp.toLocaleString()}`,
                              inline: true
                            }, {
                              name: "❯ Daily EXP (Scaled | Raw)",
                              value: days.reverse().join("\n")
                            }, {
                              name: "❯ Weekly EXP (Scaled | Raw)",
                              value: weekly
                            }, {
                              name: "❯ Preferred Games",
                              value: data.preferred_games.length ? data.preferred_games.join(", ") : "none"
                            }, {
                              name: "❯ Ranks",
                              value: data.ranks.length ? data.ranks.map(i => `\`${i.name}\``).join(", ") : "none"
                            }])
                            .setFooter(bot.user.username, bot.user.avatarURL())
                            .setImage(chart.getUrl())
                            .setTimestamp();
                          client.close();
                          return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed], components: [] });
                        }).catch(e => {
                          let errorEmbed = new MessageEmbed()
                            .setColor(config.colors.red)
                            .setTitle("Hypixel API unaccessable")
                            .setDescription(`Please try again later...`)
                            .setFooter(bot.user.username, bot.user.avatarURL())
                            .setTimestamp();
                          console.log(e);
                          client.close();
                          return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                        });;
                      } else { //Error with invalid guild
                        let errorEmbed = new MessageEmbed()
                          .setColor(config.colors.red)
                          .setTitle("INVALID GUILD")
                          .setDescription(`Please try again later...`)
                          .setFooter(bot.user.username, bot.user.avatarURL())
                          .setTimestamp();
                        console.log(e);
                        client.close();
                        return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                      }
                    }).catch(e => {
                      let errorEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("Hypixel API unaccessable")
                        .setDescription(`Please try again later...`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      console.log(e);
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                    });

                  });
                } else if (item?.hypixel_guilds?.length) {
                  request(`https://api.slothpixel.me/api/guilds/name/${item.hypixel_guilds[0]}`).then(async response => {
                    const data = await response.json();
                    if (data.guild_master) {
                      request(`https://api.slothpixel.me/api/players/${data.guild_master.uuid}`).then(async userBuf => {
                        const user = await userBuf.json();
                        let createdAt = new Date(data.created).toDateString().split(" ");
                        createdAt[2].endsWith(1) ? createdAt[2] = `${createdAt[2]}st` : createdAt[2].endsWith(2) ? createdAt[2] = `${createdAt[2]}nd` : createdAt[2].endsWith(3) ? createdAt[2] = `${createdAt[2]}rd` : createdAt[2] = `${createdAt[2]}th`;
                        if (createdAt[2].startsWith(0)) createdAt[2].slice(1);
                        let days = [];
                        let week = 0;
                        Object.entries(data.exp_history).forEach(entry => {
                          days.push(`\`•\` ${entry[0]} ➟ \`${Math.floor(scaleXP(entry[1])).toLocaleString()}\` | \`${entry[1].toLocaleString()}\``);
                          week = week + entry[1];
                        });
                        weekly = `\`${scaleXP(week).toLocaleString()}\` | \`${week.toLocaleString()}\``
                        days.reverse();
                        data.ranks.splice(0, 1);
                        const chart = new QuickChart();
                        chart.setWidth(800);
                        chart.setHeight(300);
                        chart.setBackgroundColor("transparent");
                        chart.setConfig({
                          type: "line",
                          data: {
                            labels: Object.keys(data.exp_history).reverse(),
                            datasets: [{
                              label: 'Guild EXP',
                              data: Object.values(data.exp_history).reverse(),
                              fill: true,
                              backgroundColor: "rgba(233,167,40,0.2)",
                              borderColor: config.colors.main,
                              lineTension: "0.2"
                            }]
                          },
                          options: {
                            scales: {
                              yAxes: [{
                                beginAtZero: true,
                                ticks: {
                                  fontColor: "white"
                                }
                              }],
                              xAxes: [{
                                beginAtZero: true,
                                ticks: {
                                  fontColor: "white"
                                }
                              }]
                            },
                            legend: {
                              labels: {
                                fontColor: "white"
                              }
                            }
                          }
                        });

                        let successEmbed = new MessageEmbed()
                          .setColor(config.colors.main)
                          .setTitle("GUILD STATS - " + data.name)
                          .setDescription(data.description ? data.description : "no description")
                          .addFields([{
                            name: "❯ Guild Master",
                            value: user.username ? user.username : "Couldn't find user",
                            inline: true
                          }, {
                            name: "❯ Members",
                            value: `${data.members.length}/125`,
                            inline: true
                          }, {
                            name: "❯ Created",
                            value: `${createdAt[1]} ${createdAt[2]} ${createdAt[3]}`,
                            inline: true
                          }, {
                            name: "❯ Level",
                            value: `${Math.floor(data.level)}`,
                            inline: true
                          }, {
                            name: "❯ Total Experience",
                            value: `${data.exp.toLocaleString()}`,
                            inline: true
                          }, {
                            name: "❯ Daily EXP (Scaled | Raw)",
                            value: days.reverse().join("\n")
                          }, {
                            name: "❯ Weekly EXP (Scaled | Raw)",
                            value: weekly
                          }, {
                            name: "❯ Preferred Games",
                            value: data.preferred_games.length ? data.preferred_games.join(", ") : "none"
                          }, {
                            name: "❯ Ranks",
                            value: data.ranks.length ? data.ranks.map(i => `\`${i.name}\``).join(", ") : "none"
                          }])
                          .setFooter(bot.user.username, bot.user.avatarURL())
                          .setImage(chart.getUrl())
                          .setTimestamp();
                        client.close();
                        return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed], components: [] });
                      }).catch(e => {
                        let errorEmbed = new MessageEmbed()
                          .setColor(config.colors.red)
                          .setTitle("Hypixel API unaccessable")
                          .setDescription(`Please try again later...`)
                          .setFooter(bot.user.username, bot.user.avatarURL())
                          .setTimestamp();
                        console.log(e);
                        client.close();
                        return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                      });
                    } else { //Error with invalid guild
                      let errorEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("INVALID GUILD")
                        .setDescription(`Please try again later...`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                    }
                  }).catch(e => {
                    let errorEmbed = new MessageEmbed()
                      .setColor(config.colors.red)
                      .setTitle("Hypixel API unaccessable")
                      .setDescription(`Please try again later...`)
                      .setFooter(bot.user.username, bot.user.avatarURL())
                      .setTimestamp();
                    console.log(e);
                    client.close();
                    return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                  })
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
            } catch (e) {
              let errorEmbed = new MessageEmbed()
                .setColor(config.colors.red)
                .setTitle("RETRIEVING GUILD STATS FAILED")
                .setDescription(`Database error. Please try again later.`)
                .setFooter(bot.user.username, bot.user.avatarURL())
                .setTimestamp();
              console.log(e);
              client.close();
              return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
            }
          })
        }
      }; break;

    }
  },
};

function scaleXP(raw) {
  if (raw <= 200000) {
    return raw;
  } else if (200000 + (raw - 200000) * 0.1 > 250000) {
    return 250000 + (raw - 700000) * 0.03
  } else {
    return 200000 + (raw - 200000) * 0.1
  }
}