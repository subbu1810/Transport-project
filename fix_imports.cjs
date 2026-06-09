const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(srcDir);
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // Fix the malformed imports:
    // Pattern: 
    // import {
    // import { API_BASE_URL, STORAGE_URL } from '../config/api';
    const regex = /(import\s*\{\s*)(?:\r?\n)(.*import\s*\{\s*API_BASE_URL[^]*?['"];)/g;
    
    if (regex.test(content)) {
        content = content.replace(regex, "$2\n$1");
        fs.writeFileSync(file, content);
        count++;
    }
});
console.log(`Successfully fixed import order in ${count} files.`);
