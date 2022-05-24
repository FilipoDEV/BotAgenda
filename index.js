const fs = require("fs")
const schedule = require("node-schedule")
const { Client, Collection } = require("discord.js")
const { prefix, ownerId, homeworksChannelID, homeworksMessageID, homeworksWarnChannelID, homeworksLogsChannelID, objectID } = require("./config.json")
const { dayOfYear, updateHomeworksDates } = require("./utils/functions")

const client = new Client({ intents: 32767 })

require("./deploy-commands.js")
client.database = require("./database.js")
client.commands = new Collection()
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"))

commandFiles.forEach(files => {
    const command = require(`./commands/${files}`)
    client.commands.set(command.data.name, command)
})

client.once("ready", async () => {
    console.log("[BOT] Ligado.")
})

client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) return

    const command = client.commands.get(interaction.commandName)

    if (!command) return

    try {
        await command.execute(interaction)
    } catch (error) {
        console.error(error)
        return interaction.reply({ content: "Ocorreu um erro.", ephemeral: true })
    }
})

client.on("messageCreate", async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(" ")
    const command = args.shift().toLowerCase()

    if (command === "eval" && ownerId.includes(message.author.id)) {
        try {
            client.database.Tarefas.findById(objectID, async (err, docs) => {
                if (err) console.log(err)
                let util = require("util")
                let code = await eval(args.join(" "))
                code = util.inspect(code, { depth: 1 })
                message.channel.send(`\`\`\`js\n${code}\`\`\``)
            })
          } catch (err) {
              message.channel.send(`\`\`\`js\n${err}\`\`\``)
          }
    } else return;
})

client.on("messageUpdate", (oldMessage, newMessage) => {
    if (!newMessage.content.startsWith(prefix) || newMessage.author.bot) return;

    const args = newMessage.content.slice(prefix.length).trim().split(" ")
    const command = args.shift().toLowerCase()

    if (command === "eval" && ownerId.includes(newMessage.author.id)) {
        try {
            client.database.Tarefas.findById(objectID, async (err, docs) => {
                if (err) console.log(err)
                let util = require("util")
                let code = await eval(args.join(" "))
                code = util.inspect(code, { depth: 1 })
                newMessage.channel.send(`\`\`\`js\n${code}\`\`\``)
            })
          } catch (err) {
              newMessage.channel.send(`\`\`\`js\n${err}\`\`\``)
          }
    } else return;
})

client.database.Tarefas.watch().on("change", async () => {
    const message = await client.channels.cache.get(homeworksChannelID).messages.fetch(homeworksMessageID)
    var daysOfTheWeek= ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]
    var channelLog = client.channels.cache.get(homeworksLogsChannelID)

    client.database.Tarefas.findById(objectID, (err, docs) => {
        if (err) console.log(err)
        var msgDate = ""
        var msg = ""

        if (docs.homeworksDates.length === 0) {
            msgDate = "Sem tarefas :D"
            channelLog.send("```\nLista de tarefas atualizada.```")
        } else {
            docs.homeworksDates.map(h => Object.entries(h)).forEach(([key, value]) => {
                key[1].forEach(k => {
                    msg += `${k.discipline} - \`${k.description}\`\n`
                })
                var dayOfTheWeek = daysOfTheWeek[new Date(`2022-${key[0].split("/")[1]}-${key[0].split("/")[0]}`).getDay()]
                msgDate +=  `\`\`\`\n${dayOfTheWeek} (${key[0]})\`\`\`\n${msg}\n`
                msg = ""
            })
            channelLog.send("```\nLista de tarefas atualizada.```")
        }
        message.edit(msgDate)
    })
})

const rule = new schedule.RecurrenceRule()
rule.dayOfWeek = [1, new schedule.Range(2, 5)]
rule.hour = 12
rule.minute = 15
rule.tz = "America/Sao_Paulo"

const rule2 = new schedule.RecurrenceRule()
rule2.dayOfWeek = [0, new schedule.Range(1, 4)]
rule2.hour = 18
rule2.minute = 0
rule2.tz = "America/Sao_Paulo"

schedule.scheduleJob(rule, () => {
    client.database.Tarefas.findById(objectID, (err, docs) => {
        if (err) console.log(err)
        var homeworksDeleted = docs.homeworks.filter(hw => hw.dayOfTheYear <= dayOfYear(new Date()))
        var logChannel = client.channels.cache.get(homeworksLogsChannelID)
        if (docs.homeworks.length === 0) {
            logChannel.send("```\nTava olhando aqui parça\nAcabou as tarefas meu mano```")
        } else if (homeworksDeleted.length == 0) {
            logChannel.send("```\nTem tarefa pra deletar não cara```")
        } else {
            var homeworksFiltered = docs.homeworks.filter(h => h.dayOfTheYear > dayOfYear(new Date()))
            docs.homeworks = homeworksFiltered
            updateHomeworksDates(docs)
            logChannel.send(`\`\`\`\nDeletei tarefas dessas matérias aqui amigão: ${homeworksDeleted.map(hwd => hwd.discipline)}\`\`\``)
            docs.save()
        }
    })
})

schedule.scheduleJob(rule2, () => {
    const hChannel = client.channels.cache.get(homeworksWarnChannelID)
    client.database.Tarefas.findById(objectID, (err, docs) => {
        if (err) console.log(err)

        if (docs.homeworksDates.length === 0) {
            hChannel.send("Sem tarefas pra amanhã :D")
        } else if (dayOfYear(new Date()) === dayOfYear(new Date(`2022-${Object.keys(docs.homeworksDates[0])[0].split("/")[1]}-${Object.keys(docs.homeworksDates[0])[0].split("/")[0]}`)) - 1) {
            const homeworks = Object.values(docs.homeworksDates[0])[0]
            var homeworksTomorrow = homeworks.map(h => ` ${h.discipline}`)
            hChannel.send(`Tem tarefas das seguintes matérias pra amanhã guys:${homeworksTomorrow}`)
        } else {
            hChannel.send("Sem tarefas pra amanhã :D")
        }
    })
})

client.login(process.env.TOKEN)