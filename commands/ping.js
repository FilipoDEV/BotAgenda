const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Faz o famoso ping"),
    async execute(interaction) {
        await interaction.reply("pong né boi")    
    }
}