import { cipher, util } from 'node-forge';

export class AES {
    static encrypt(data, key) {
        return new Promise((resolve, reject) => {
            var cipher = cipher.createCipher('AES-CBC', key);
            cipher.start({iv: iv});
    
            cipher.update(data);
    
            cipher.finish();
            var encrypted = cipher.output;

            resolve(encrypted)
        });
    }
}