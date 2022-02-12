/*const { request } = require("../../external/requestHandler");
const { MongoClient } = require('mongodb');
const config = require("../../config.json");

module.exports = {
  struct: {
    name: "delete",
    type: 1,
    description: "Turns on Delete mode. All commands ran while this is on will be deleted from the API.",
    options: [
         {
             name: "switch",
             description: "Whether to turn on or off.",
             type: 5,
             required: true
         }
    ],
  },
  run: (bot, interaction) => {
    console.log(interaction);
      if(!config.developers.includes(interaction.user.id)) return interaction.reply({ content: `${config.cross} **Missing permission**`, ephemeral: true});
      const bool = interaction.options._hoistedOptions.find(o => o.name == "switch").value;
      bot.deleteMode = bool;
      interaction.reply({ content: `${config.success} Delete mode is now set to: ${bool}`, ephemeral: true});
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
*/