function dayOfYear(date) {
    return Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24) + 1;
}

function updateHomeworksDates(docs) {
    var array = []
    var set = [...new Set(docs.homeworks.map(h => h.date))]
    set.forEach(s => {
        array.push(s)
    })
    docs.homeworksDates = []
    array.forEach(e => {
        docs.homeworksDates.push({ [e]: [] })
    })
    docs.homeworks.forEach(homework => {
        var dateF = homework.date.split("/")
        docs.homeworksDates.find(element => element[`${dateF[0]}/${dateF[1]}`])[`${dateF[0]}/${dateF[1]}`].push({ discipline: homework.discipline, description: homework.description })
    })
    docs.updater += "oa"
}

module.exports = {
    dayOfYear,
    updateHomeworksDates
}