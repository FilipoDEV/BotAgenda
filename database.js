const mongoose = require("mongoose")

mongoose.connect(process.env.DB_URI, { useNewUrlParser:  true, useUnifiedTopology: true }, (err) => {
    if (err) console.log(err)
    console.log("[DATABASE] Conectado com sucesso a database.")
})

const homeworkSchema = new mongoose.Schema({
    homeworks: [],
    homeworksDates: [],
    updater: String
})

module.exports.Tarefas = mongoose.model("Tarefas", homeworkSchema)
