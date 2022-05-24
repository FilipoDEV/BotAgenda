const { SlashCommandBuilder } = require("@discordjs/builders")
const { objectID, homeworksLogsChannelID } = require("../config.json")
const { dayOfYear, updateHomeworksDates } = require("../utils/functions")
const DISCIPLINES = {
    "portugues": "Português",
    "matematica": "Matemática",
    "fisica": "Física",
    "biologia": "Biologia",
    "quimica": "Química",
    "topicos_de_matematica": "Tópicos de Matemática",
    "fisioquimica": "FisioQuímica",
    "meio_ambiente": "Meio Ambiente",
    "producao_textual": "Produção de Texto",
    "artes": "Artes",
    "geografia": "Geografia",
    "educacao_fisica": "Educação Física",
    "projeto_de_vida": "Projeto de Vida",
    "filosofia": "Filosofia",
    "historia": "História",
    "ingles": "Inglês",
    "sociologia": "Sociologia"
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("homework")
        .setDescription("Comando principal, aquele que cria uma árvore de subcomandos para os outros.")
        .addSubcommand(subcommand => (
            subcommand
                .setName("add")
                .setDescription("Adiciona uma tarefa a lista de tarefas.")
                .addStringOption(option => {
                    option
                        .setName("discipline")
                        .setDescription("A matéria da tarefa.")
                        .setRequired(true)
                    Object.entries(DISCIPLINES).forEach(disciplinesArray => {
                        option.addChoice(disciplinesArray[1], disciplinesArray[0])
                    })    
                    return option
                })
                .addStringOption(option => (
                    option
                        .setName("description")
                        .setDescription("Descrição da tarefa.")
                        .setRequired(true)
                ))
                .addStringOption(option => (
                    option
                        .setName("date")
                        .setDescription("Prazo de entrega da tarefa. Utilize o formato DD/MM")
                        .setRequired(true)
                ))
        ))
        .addSubcommand(subcommand => (
            subcommand
                .setName("remove")
                .setDescription("Remove uma tarefa da lista de tarefas.")
                .addNumberOption(option => (
                    option
                        .setName("id")
                        .setDescription("ID da tarefa, use /homework list para saber os IDs.")
                        .setRequired(true)
                ))
        ))
        .addSubcommand(subcommand => (
            subcommand
                .setName("list")
                .setDescription("Lista todas as tarefas.")
        )),
    async execute(interaction) {
        await interaction.reply(".")
        const logChannel = interaction.client.channels.cache.get(homeworksLogsChannelID)

        if (interaction.options.getSubcommand() === "add") {
            var discipline = DISCIPLINES[interaction.options.getString("discipline")]
            var description = interaction.options.getString("description")
            var date = interaction.options.getString("date")
            var dateFormated = date.split("/")
            var dayOfTheYear = dayOfYear(new Date(`2022-${dateFormated[1]}-${dateFormated[0]}`))
            var today = dayOfYear(new Date())
            var id = Math.floor(Math.random() * 100000) + 1

            if (dayOfTheYear < today) {
                await interaction.editReply({ content: "Você deve colocar uma data de entrega a partir do dia de hoje." })
            } else if (!dayOfTheYear) {
                await interaction.editReply({ content: "Você deve usar o formato DD/MM" })
            } else {
                interaction.client.database.Tarefas.findById(objectID, async (err, docs) => {
                    if (err) console.log(err);
                    docs.homeworks.push({ discipline, description, date, dayOfTheYear, id })
                    docs.homeworks.sort((a, b) => a.dayOfTheYear - b.dayOfTheYear)
                    updateHomeworksDates(docs)
                    docs.save()
                    logChannel.send(`\`\`\`\nTarefa adicionada:\n${discipline}\n${description}\n${date}\n${id}\`\`\``)
                    await interaction.editReply("Tarefa adicionada.")
                })
            }
        } else if (interaction.options.getSubcommand() === "remove") {
            var homeworkID = interaction.options.getNumber("id")

            interaction.client.database.Tarefas.findById(objectID, async (err, docs) => {
                if (err) console.log(err)
                var hWork = docs.homeworks.find(homework => homework.id == homeworkID)
                if (!hWork) {
                    await interaction.editReply({ content: "ID inválido." })
                } else {
                    var hWorks = [...docs.homeworks]
                    hWorks.splice(hWorks.indexOf(hWork), 1)
                    docs.homeworks = hWorks
                    updateHomeworksDates(docs)
                    docs.save()
                    logChannel.send(`\`\`\`\nTarefa removida:\n${hWork.discipline}\n${hWork.description}\n${hWork.date}\`\`\``)
                    await interaction.editReply("Tarefa removida.")
                }
            })
        } else if (interaction.options.getSubcommand() === "list") {
            interaction.client.database.Tarefas.findById(objectID, async (err, docs) => {
                if (err) console.log(err)
                var msg = "Tarefas:\n\n"
                docs.homeworks.forEach(homework => {
                    msg += `\`${homework.discipline}\` - \`${homework.description}\` - \`${homework.date}\` - \`${homework.id}\`\n`
                })
                interaction.editReply(msg)
            })
        }
    }
}