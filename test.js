const Parallel = require("paralleljs")
const bcrypt = require("bcrypt")
bcrypt.

const t = async () => {
    const t = new Parallel("Test")
    t.spawn(item => {
        return bcrypt.hashSync(item, 10)
    }).then(e => console.log("Result", e))
}

t()