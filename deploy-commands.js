const fs = require("fs")
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord-api-types/v9")
const { clientId, guildId } = require("./config.json")

const commands = []
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"))

commandFiles.forEach(files => {
    const command = require(`./commands/${files}`)
    commands.push(command.data.toJSON())
})

const rest = new REST({ version: "9" }).setToken(process.env.TOKEN)

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    .then(() => console.log("Comandos registrados com sucesso."))
    .catch(console.error)