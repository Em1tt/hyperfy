const { MongoClient } = require("mongodb");
const { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const config = require("../../config.json");

module.exports = {
  struct: {
    name: "role",
    type: 1,
    description: "Set post-verification roles.",
    options: [
      {
        name: "guest",
        description:
          "Manages the guest role. (Assigned to verified people who are not in the Hypixel guild).",
        type: 2, // 1 is type SUB_COMMAND,
        options: [
          {
            name: "set",
            description: "Sets the guest role (multiple allowed)",
            type: 1,
            options: [
              {
                name: "role",
                type: 8,
                description: "Sets this role as a guest role.",
                required: true,
              },
            ],
          },
          {
            name: "unset",
            description: "Unsets the guest role",
            type: 1,
          }
        ],
      },
      {
        name: "member",
        description:
          "Manages the member role. (Assigned to verified people who are in the Hypixel guild)",
        type: 2, // 1 is type SUB_COMMAND,
        options: [
          {
            name: "set",
            description: "Sets the member role (multiple allowed)",
            type: 1,
            options: [
              {
                name: "role",
                type: 8,
                description: "Sets this role as a member role.",
                required: true,
              },
            ],
          },
          {
            name: "unset",
            description:
              "Unsets the member role",
            type: 1,
          }
        ],
      },
      {
        name: "verified",
        description:
          "Manages the verified role. (Assigned to all verified people)",
        type: 2, // 1 is type SUB_COMMAND,
        options: [
          {
            name: "set",
            description: "Sets the verified role (multiple allowed)",
            type: 1,
            options: [
              {
                name: "role",
                type: 8,
                description: "Sets this role as a verified role.",
                required: true,
              },
            ],
          },
          {
            name: "unset",
            description:
              "Unsets the verified role",
            type: 1,
          }
        ],
      },
      {
        name: "guild",
        description:
          "Manages the guild roles (Assigned to all verified people who have a certain guild role)",
        type: 2, // 1 is type SUB_COMMAND,
        options: [
          {
            name: "set",
            description: "Sets a guild role",
            type: 1,
            options: [
              {
                "name": "rank",
                description: "Connects this rank...",
                "type": 3,
                required: true
              },
              {
                "name": "role",
                description: "... to this role.",
                type: 8,
                required: true
              }
            ]
          },
          {
            name: "unset",
            description:
              "Unsets a guild role",
            type: 1,
          }
        ],
      },
      {
        name: "network",
        description:
          "Manages the network roles (Assigned to all verified people who have a network role)",
        type: 2, // 1 is type SUB_COMMAND,
        options: [
          {
            name: "set",
            description: "Sets a guild role",
            type: 1,
            options: [
              {
                "name": "rank",
                description: "Connects this rank...",
                "type": 3,
                required: true,
                "choices": [
                  {
                    "name": "VIP",
                    "value": "vip"
                  },
                  {
                    "name": "VIP+",
                    "value": "vip_plus"
                  },
                  {
                    "name": "MVP",
                    "value": "mvp"
                  },
                  {
                    "name": "MVP+",
                    "value": "mvp_plus"
                  },
                  {
                    "name": "MVP++",
                    "value": "mvp_plus_plus"
                  }
                ]
              },
              {
                "name": "role",
                description: "... to this role.",
                type: 8,
                required: true
              }
            ]
          },
          {
            name: "unset",
            description:
              "Unsets a guild role",
            type: 1,
          }
        ],
      },
    ],
  },
  run: async (bot, interaction) => {
    try {
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
      const role = interaction.options._hoistedOptions.find(
        (o) => o.name == "role"
      );
      if (!interaction.member.permissions.has("MANAGE_ROLES")) {
        let errorEmbed = new MessageEmbed()
          .setColor(config.colors.red)
          .setTitle("MISSING PERMMISSIONS")
          .setDescription(
            `This command requires the \`MANAGE ROLES\` permission.`
          )
          .setFooter(bot.user.username, bot.user.avatarURL())
          .setTimestamp();
        return interaction.editReply({ ephemeral: true, embeds: [errorEmbed] });
      } else if (
        interaction.guild.me.roles.botRole.position <
        interaction.guild.roles.cache.get(role?.value)?.position
      ) {
        let errorEmbed = new MessageEmbed()
          .setColor(config.colors.red)
          .setTitle("SETTING ROLE FAILED")
          .setDescription(
            `Role <@&${role.value}> cannot be used as it's higher in the role hierarchy than my bot role.`
          )
          .setFooter(bot.user.username, bot.user.avatarURL())
          .setTimestamp();
        return interaction.editReply({
          content: `⠀`,
          ephemeral: true,
          embeds: [errorEmbed],
        });
      } else {
        if (!interaction.guild.me.permissions.has("MANAGE_ROLES")) {
          try {
            if (!bot.roleWarn.includes(interaction.guild.id)) {
              let warningEmbed = new MessageEmbed()
                .setColor(config.colors.yellow)
                .setTitle("WARNING")
                .setDescription(
                  `Bot is missing \`MANAGE ROLES\` permission, and thus won't grant new roles to verified members.`
                )
                .setFooter(
                  bot.user.username + " | This message is only shown once.",
                  bot.user.avatarURL()
                )
                .setTimestamp();
              interaction.followUp({ embeds: [warningEmbed], ephemeral: false });
              bot.roleWarn.push(interaction.guild.id);
            }
          } catch (e) {
            e;
          }
        }
        const client = new MongoClient(process.env.MONGOURI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        client.connect(async err => {
          let internalEmbed = new MessageEmbed()
          .setColor(config.colors.red)
          .setTitle("INTERNAL ERROR")
          .setDescription("Error has been logged.")
          .setFooter(bot.user.username, bot.user.avatarURL())
          .setTimestamp();
          if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
          const db = client.db("Global").collection("Guilds");
          db.findOne({ guild: interaction.guild.id }, (err, item) => {
            let internalEmbed = new MessageEmbed()
            .setColor(config.colors.red)
            .setTitle("INTERNAL ERROR")
            .setDescription("Error has been logged.")
            .setFooter(bot.user.username, bot.user.avatarURL())
            .setTimestamp();
            if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
            if (!item) {
              let errorEmbed = new MessageEmbed()
                .setColor(config.colors.red)
                .setTitle("GUILD NOT LINKED")
                .setDescription(
                  `Use \`/guild add <hypixelGuild>\` to link your guild.`
                )
                .setFooter(bot.user.username, bot.user.avatarURL())
                .setTimestamp();
              client.close();
              return interaction.editReply({
                content: `⠀`,
                ephemeral: true,
                embeds: [errorEmbed],
              });
            } else {
              let obj = {};
              switch (interaction.options._group) {
                case "guest": {
                  if (interaction.options._subcommand == "set") {
                    if (item?.roles?.guest?.length == config.roles.maximum) {
                      let errorEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("ADDING ROLE FAILED")
                        .setDescription(`This server already has the maximum amount of guest roles connected to it. (${config.roles.maximum})`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                    } else {
                      obj.guest = item?.roles?.guest ? [...new Set(item.roles.guest.concat(role.value))] : [role.value];
                      db.updateOne({ guild: interaction.guild.id }, { $set: { roles: { ...item.roles, ...obj } } }, (err, result) => {
                        let internalEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("INTERNAL ERROR")
                        .setDescription("Error has been logged.")
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                        if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                      });
                      let successEmbed = new MessageEmbed()
                        .setColor(config.colors.green)
                        .setTitle("ADDED ROLE SUCCESSFULLY")
                        .setDescription(`Added role <@&${role.value}> as a guest role.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed] });
                    }
                  } else if (interaction.options._subcommand == "unset") { //Unset
                    if (item?.roles?.guest?.length == 1) {
                      db.updateOne({ guild: interaction.guild.id }, { $set: { roles: { guest: [] } } }, (err, result) => {
                        let internalEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("INTERNAL ERROR")
                        .setDescription("Error has been logged.")
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                        if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                      });
                      let successEmbed = new MessageEmbed()
                        .setColor(config.colors.green)
                        .setTitle("ROLE UNSET SUCCESSFULLY")
                        .setDescription(`Unlinked guest role <@&${item.roles.guest[0]}> from this Discord server.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed], components: [] });
                    } else if (item?.roles?.guest?.length > 1) {
                      //Button popup
                      let rows = [];
                      let row = [];
                      item.roles.guest.forEach((r, i, a) => {
                        row.push(new MessageButton().setCustomId(r).setLabel(interaction.guild.roles.cache.get(r).name).setStyle('DANGER'));
                        if ((row.length == 5 || i + 1 == a.length) && i / 5 < 5) {
                          rows.push(new MessageActionRow().addComponents(row));
                          row = [];
                        }
                      });
                      let waitEmbed = new MessageEmbed()
                        .setColor(config.colors.main)
                        .setTitle("Choose the role to unlink from this Discord server.")
                        .setDescription(`Click on the button below with the name of the role you wish to unset.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      interaction.editReply({ content: `⠀`, embeds: [waitEmbed], components: rows, ephemeral: true });
                      bot.on("interactionCreate", button => {
                        if (!button.isButton()) return;
                        if (button.message.interaction.id != interaction.id) return;
                        db.updateOne({ guild: interaction.guild.id }, { $set: { roles: { guest: item.roles.guest.filter(e => e !== button.customId) } } }, (err, result) => {
                          if (err) console.log(err);
                        });
                        let successEmbed = new MessageEmbed()
                          .setColor(config.colors.green)
                          .setTitle("ROLE UNSET SUCCESSFULLY")
                          .setDescription(`Unlinked guest role <@&${button.customId}> from this Discord server.`)
                          .setFooter(bot.user.username, bot.user.avatarURL())
                          .setTimestamp();
                        client.close();
                        return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed], components: [] });
                      });
                    } else {
                      let errorEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("NOTHING TO UNSET")
                        .setDescription(`This Discord server has no guest roles set up.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                    }
                  }
                }; break;
                case "member": {
                  if (interaction.options._subcommand == "set") {
                    if (item?.roles?.member?.length == config.roles.maximum) {
                      let errorEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("ADDING ROLE FAILED")
                        .setDescription(`This server already has the maximum amount of member roles connected to it. (${config.roles.maximum})`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                    } else {
                      obj.member = item?.roles?.member ? [...new Set(item.roles.member.concat(role.value))] : [role.value];
                      db.updateOne({ guild: interaction.guild.id }, { $set: { roles: { ...item.roles, ...obj } } }, (err, result) => {
                        let internalEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("INTERNAL ERROR")
                        .setDescription("Error has been logged.")
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                        if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                      });
                      let successEmbed = new MessageEmbed()
                        .setColor(config.colors.green)
                        .setTitle("ADDED ROLE SUCCESSFULLY")
                        .setDescription(`Added role <@&${role.value}> as a member role.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed] });
                    }
                  } else if (interaction.options._subcommand == "unset") { //Unset
                    if (item?.roles?.member?.length == 1) {
                      db.updateOne({ guild: interaction.guild.id }, { $set: { roles: { member: [] } } }, (err, result) => {
                        let internalEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("INTERNAL ERROR")
                        .setDescription("Error has been logged.")
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                        if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                      });
                      let successEmbed = new MessageEmbed()
                        .setColor(config.colors.green)
                        .setTitle("ROLE UNSET SUCCESSFULLY")
                        .setDescription(`Unlinked member role <@&${item.roles.member[0]}> from this Discord server.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed], components: [] });
                    } else if (item?.roles?.member?.length > 1) {
                      //Button popup
                      let rows = [];
                      let row = [];
                      item.roles.member.forEach((r, i, a) => {
                        row.push(new MessageButton().setCustomId(r).setLabel(interaction.guild.roles.cache.get(r).name).setStyle('DANGER'));
                        if ((row.length == 5 || i + 1 == a.length) && i / 5 < 5) {
                          rows.push(new MessageActionRow().addComponents(row));
                          row = [];
                        }
                      });
                      let waitEmbed = new MessageEmbed()
                        .setColor(config.colors.main)
                        .setTitle("Choose the role to unlink from this Discord server.")
                        .setDescription(`Click on the button below with the name of the role you wish to unset.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      interaction.editReply({ content: `⠀`, embeds: [waitEmbed], components: rows, ephemeral: true });
                      bot.on("interactionCreate", button => {
                        if (!button.isButton()) return;
                        if (button.message.interaction.id != interaction.id) return;
                        db.updateOne({ guild: interaction.guild.id }, { $set: { roles: { member: item.roles.member.filter(e => e !== button.customId) } } }, (err, result) => {
                          let internalEmbed = new MessageEmbed()
                          .setColor(config.colors.red)
                          .setTitle("INTERNAL ERROR")
                          .setDescription("Error has been logged.")
                          .setFooter(bot.user.username, bot.user.avatarURL())
                          .setTimestamp();
                          if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                        });
                        let successEmbed = new MessageEmbed()
                          .setColor(config.colors.green)
                          .setTitle("ROLE UNSET SUCCESSFULLY")
                          .setDescription(`Unlinked member role <@&${button.customId}> from this Discord server.`)
                          .setFooter(bot.user.username, bot.user.avatarURL())
                          .setTimestamp();
                        client.close();
                        return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed], components: [] });
                      });
                    } else {
                      let errorEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("NOTHING TO UNSET")
                        .setDescription(`This Discord server has no member roles set up.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                    }
                  }
                }; break;
                case "verified": {
                  if (interaction.options._subcommand == "set") {
                    if (item?.roles?.verified?.length == config.roles.maximum) {
                      let errorEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("ADDING ROLE FAILED")
                        .setDescription(`This server already has the maximum amount of verified roles connected to it. (${config.roles.maximum})`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                    } else {
                      obj.verified = item?.roles?.verified ? [...new Set(item.roles.verified.concat(role.value))] : [role.value];
                      db.updateOne({ guild: interaction.guild.id }, { $set: { roles: { ...item.roles, ...obj } } }, (err, result) => {
                        let internalEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("INTERNAL ERROR")
                        .setDescription("Error has been logged.")
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                        if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                      });
                      let successEmbed = new MessageEmbed()
                        .setColor(config.colors.green)
                        .setTitle("ADDED ROLE SUCCESSFULLY")
                        .setDescription(`Added role <@&${role.value}> as a verified role.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed] });
                    }
                  } else if (interaction.options._subcommand == "unset") { //Unset
                    if (item?.roles?.verified?.length == 1) {
                      db.updateOne({ guild: interaction.guild.id }, { $set: { roles: { verified: [] } } }, (err, result) => {
                        let internalEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("INTERNAL ERROR")
                        .setDescription("Error has been logged.")
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                        if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                      });
                      let successEmbed = new MessageEmbed()
                        .setColor(config.colors.green)
                        .setTitle("ROLE UNSET SUCCESSFULLY")
                        .setDescription(`Unlinked verified role <@&${item.roles.verified[0]}> from this Discord server.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed], components: [] });
                    } else if (item?.roles?.verified?.length > 1) {
                      //Button popup
                      let rows = [];
                      let row = [];
                      item.roles.verified.forEach((r, i, a) => {
                        row.push(new MessageButton().setCustomId(r).setLabel(interaction.guild.roles.cache.get(r).name).setStyle('DANGER'));
                        if ((row.length == 5 || i + 1 == a.length) && i / 5 < 5) {
                          rows.push(new MessageActionRow().addComponents(row));
                          row = [];
                        }
                      });
                      let waitEmbed = new MessageEmbed()
                        .setColor(config.colors.main)
                        .setTitle("Choose the role to unlink from this Discord server.")
                        .setDescription(`Click on the button below with the name of the role you wish to unset.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      interaction.editReply({ content: `⠀`, embeds: [waitEmbed], components: rows, ephemeral: true });
                      bot.on("interactionCreate", button => {
                        if (!button.isButton()) return;
                        if (button.message.interaction.id != interaction.id) return;
                        db.updateOne({ guild: interaction.guild.id }, { $set: { roles: { verified: item.roles.verified.filter(e => e !== button.customId) } } }, (err, result) => {
                          let internalEmbed = new MessageEmbed()
                          .setColor(config.colors.red)
                          .setTitle("INTERNAL ERROR")
                          .setDescription("Error has been logged.")
                          .setFooter(bot.user.username, bot.user.avatarURL())
                          .setTimestamp();
                          if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                        });
                        let successEmbed = new MessageEmbed()
                          .setColor(config.colors.green)
                          .setTitle("ROLE UNSET SUCCESSFULLY")
                          .setDescription(`Unlinked verified role <@&${button.customId}> from this Discord server.`)
                          .setFooter(bot.user.username, bot.user.avatarURL())
                          .setTimestamp();
                        client.close();
                        return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed], components: [] });
                      });
                    } else {
                      let errorEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("NOTHING TO UNSET")
                        .setDescription(`This Discord server has no verified roles set up.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                    }
                  }
                }; break;
                case "guild": {
                  if (interaction.options._subcommand == "set") {
                    if (item?.roles?.guild?.length == config.roles.guild.maximum) {
                      let errorEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("ADDING ROLE FAILED")
                        .setDescription(`This server already has the maximum amount of guild roles connected to it. (${config.roles.guild.maximum})`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                    } else {
                      const rank = interaction.options._hoistedOptions.find(
                        (o) => o.name == "rank"
                      );
                      obj.guild = item?.roles?.guild ? [...new Set(item.roles.guild.concat({ rank: rank.value, role: role.value }))] : [{ rank: rank.value, role: role.value }];
                      db.updateOne({ guild: interaction.guild.id }, { $set: { roles: { ...item.roles, ...obj } } }, (err, result) => {
                        let internalEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("INTERNAL ERROR")
                        .setDescription("Error has been logged.")
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                        if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                      });
                      let successEmbed = new MessageEmbed()
                        .setColor(config.colors.green)
                        .setTitle("ADDED ROLE SUCCESSFULLY")
                        .setDescription(`Added role <@&${role.value}> as a role for the guild rank **${rank.value}**.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed] });
                    }
                  } else if (interaction.options._subcommand == "unset") { //Unset
                    if (item?.roles?.guild?.length == 1) {
                      db.updateOne({ guild: interaction.guild.id }, { $set: { roles: { guild: [] } } }, (err, result) => {
                        let internalEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("INTERNAL ERROR")
                        .setDescription("Error has been logged.")
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                        if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                      });
                      let successEmbed = new MessageEmbed()
                        .setColor(config.colors.green)
                        .setTitle("ROLE UNSET SUCCESSFULLY")
                        .setDescription(`Unlinked role <@&${item.roles.guild[0].role}> from guild rank **${item.roles.guild[0].rank}**.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed], components: [] });
                    } else if (item?.roles?.guild?.length > 1) {
                      //Button popup
                      let rows = [];
                      let row = [];
                      item.roles.guild.forEach((r, i, a) => {
                        row.push(new MessageButton().setCustomId(r.role).setLabel(r.rank).setStyle('DANGER'));
                        if ((row.length == 5 || i + 1 == a.length) && i / 5 < 5) {
                          rows.push(new MessageActionRow().addComponents(row));
                          row = [];
                        }
                      });
                      let waitEmbed = new MessageEmbed()
                        .setColor(config.colors.main)
                        .setTitle("UNLINK GUILD ROLE")
                        .setDescription(`Click on the button below with the guild rank you want to unlink from a Discord role.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      interaction.editReply({ content: `⠀`, embeds: [waitEmbed], components: rows, ephemeral: true });
                      bot.on("interactionCreate", button => {
                        if (!button.isButton()) return;
                        if (button.message.interaction.id != interaction.id) return;
                        db.updateOne({ guild: interaction.guild.id }, { $set: { roles: { verified: item.roles.guild.filter(e => e.role !== button.customId) } } }, (err, result) => {
                          let internalEmbed = new MessageEmbed()
                          .setColor(config.colors.red)
                          .setTitle("INTERNAL ERROR")
                          .setDescription("Error has been logged.")
                          .setFooter(bot.user.username, bot.user.avatarURL())
                          .setTimestamp();
                          if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                        });
                        let successEmbed = new MessageEmbed()
                          .setColor(config.colors.green)
                          .setTitle("ROLE UNSET SUCCESSFULLY")
                          .setDescription(`Unlinked verified role <@&${button.customId}> from this Discord server.`)
                          .setFooter(bot.user.username, bot.user.avatarURL())
                          .setTimestamp();
                        client.close();
                        return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed], components: [] });
                      });
                    } else {
                      let errorEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("NOTHING TO UNSET")
                        .setDescription(`This Discord server has no verified roles set up.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                    }
                  }
                }; break;
                case "network": {
                  if (interaction.options._subcommand == "set") {
                    if (item?.roles?.network?.length == config.roles.network.maximum) {
                      let errorEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("ADDING ROLE FAILED")
                        .setDescription(`This server already has the maximum amount of network roles connected to it. (${config.roles.network.maximum})`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                    } else {
                      const rank = interaction.options._hoistedOptions.find(
                        (o) => o.name == "rank"
                      );
                      obj.network = item?.roles?.network ? [...new Set(item.roles.network.concat({ rank: rank.value, role: role.value }))] : [{ rank: rank.value, role: role.value }];
                      db.updateOne({ guild: interaction.guild.id }, { $set: { roles: { ...item.roles, ...obj } } }, (err, result) => {
                        let internalEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("INTERNAL ERROR")
                        .setDescription("Error has been logged.")
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                        if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                      });
                      let successEmbed = new MessageEmbed()
                        .setColor(config.colors.green)
                        .setTitle("ADDED ROLE SUCCESSFULLY")
                        .setDescription(`Added role <@&${role.value}> as a role for the network rank **${rank.value}**.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed] });
                    }
                  } else if (interaction.options._subcommand == "unset") { //Unset
                    if (item?.roles?.network?.length == 1) {
                      db.updateOne({ guild: interaction.guild.id }, { $set: { roles: { network: [] } } }, (err, result) => {
                        let internalEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("INTERNAL ERROR")
                        .setDescription("Error has been logged.")
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                        if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                      });
                      let successEmbed = new MessageEmbed()
                        .setColor(config.colors.green)
                        .setTitle("ROLE UNSET SUCCESSFULLY")
                        .setDescription(`Unlinked role <@&${item.roles.network[0].role}> from network rank **${item.roles.network[0].rank}**.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed], components: [] });
                    } else if (item?.roles?.network?.length > 1) {
                      //Button popup
                      let rows = [];
                      let row = [];
                      item.roles.network.forEach((r, i, a) => {
                        row.push(new MessageButton().setCustomId(r.role).setLabel(r.rank).setStyle('DANGER'));
                        if ((row.length == 5 || i + 1 == a.length) && i / 5 < 5) {
                          rows.push(new MessageActionRow().addComponents(row));
                          row = [];
                        }
                      });
                      let waitEmbed = new MessageEmbed()
                        .setColor(config.colors.main)
                        .setTitle("UNLINK NETWORK ROLE")
                        .setDescription(`Click on the button below with the network rank you want to unlink from a Discord role.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      interaction.editReply({ content: `⠀`, embeds: [waitEmbed], components: rows, ephemeral: true });
                      bot.on("interactionCreate", button => {
                        if (!button.isButton()) return;
                        if (button.message.interaction.id != interaction.id) return;
                        db.updateOne({ guild: interaction.guild.id }, { $set: { roles: { verified: item.roles.network.filter(e => e.role !== button.customId) } } }, (err, result) => {
                          let internalEmbed = new MessageEmbed()
                          .setColor(config.colors.red)
                          .setTitle("INTERNAL ERROR")
                          .setDescription("Error has been logged.")
                          .setFooter(bot.user.username, bot.user.avatarURL())
                          .setTimestamp();
                          if(err) return console.log(err), client.close(), interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [internalEmbed] });
                        });
                        let successEmbed = new MessageEmbed()
                          .setColor(config.colors.green)
                          .setTitle("ROLE UNSET SUCCESSFULLY")
                          .setDescription(`Unlinked verified role <@&${button.customId}> from this Discord server.`)
                          .setFooter(bot.user.username, bot.user.avatarURL())
                          .setTimestamp();
                        client.close();
                        return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [successEmbed], components: [] });
                      });
                    } else {
                      let errorEmbed = new MessageEmbed()
                        .setColor(config.colors.red)
                        .setTitle("NOTHING TO UNSET")
                        .setDescription(`This Discord server has no verified roles set up.`)
                        .setFooter(bot.user.username, bot.user.avatarURL())
                        .setTimestamp();
                      client.close();
                      return interaction.editReply({ content: `⠀`, ephemeral: true, embeds: [errorEmbed] });
                    }
                  }
                }; break;
              }
            }
          });
        });
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
