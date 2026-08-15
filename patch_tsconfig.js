import fs from 'fs';
let code = fs.readFileSync('tsconfig.json', 'utf8');
let json = JSON.parse(code);
if (!json.exclude) json.exclude = [];
if (!json.exclude.includes("dist")) json.exclude.push("dist");
fs.writeFileSync('tsconfig.json', JSON.stringify(json, null, 2));
