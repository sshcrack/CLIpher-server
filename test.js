const forge = require("node-forge")
const size = 16
const iterations = 15

var iv = forge.random.getBytesSync(size);

var salt = forge.random.getBytesSync(128);
var key = forge.pkcs5.pbkdf2('password', salt, iterations, size);

var cipher = forge.cipher.createCipher('AES-CBC', key);
cipher.start({iv: iv});
cipher.update(forge.util.createBuffer("Lol"));
cipher.finish();
var encrypted = cipher.output;
// outputs encrypted hex
console.log("Encrypted", encrypted);
 

var saltTwo = forge.random.getBytesSync(128);
var keyTwo = forge.pkcs5.pbkdf2('password', saltTwo, iterations, size);

// decrypt some bytes using CBC mode
// (other modes include: CFB, OFB, CTR, and GCM)
var decipher = forge.cipher.createDecipher('AES-CBC', keyTwo);
decipher.start({iv: iv});
decipher.update(encrypted);
var result = decipher.finish(); // check 'result' for true/false
// outputs decrypted hex
console.log(result, "Decrypted", decipher.output);


console.log("Salt1", salt, "Salt2", saltTwo)