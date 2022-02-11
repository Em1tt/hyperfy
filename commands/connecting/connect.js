const { request } = require("../../external/requestHandler");
const { MongoClient } = require('mongodb');

module.exports = {
  struct: {
    name: "connect",
    type: 1,
    description: "Connect a Hypixel rank to a Discord role. Requires MANAGE SERVER permission.",
    options: [
      {
        name: "guild",
        description: "Connects a guild rank to a Discord role. Requires MANAGE SERVER permission.",
        type: 1, // 1 is type SUB_COMMAND,
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
        name: "network",
        description: "Connects a network rank to a Discord role. Requires MANAGE SERVER permission.",
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
      }
    ],
  },
  run: (bot, interaction) => {
      const role = interaction.options._hoistedOptions.find(o => o.name == "role").
        rank = interaction.options._hoistedOptions.find(o => o.name == "rank");
      //console.log(role, rank);

      interaction.reply({ content: "<a:loading:906818576474837022> Waiting for results...", ephemeral: true});
      request("https://api.slothpixel.me/api/guilds/name/guild").then(async result => {
        const data = await result.json();
        console.log(data);
        const client = new MongoClient(process.env.MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true });
        client.connect(err => {
          if(err) console.log(err);
          client.close();
        });
      })
      //console.log(interaction, interaction.options);
  },
};