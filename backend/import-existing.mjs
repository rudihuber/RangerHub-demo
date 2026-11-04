/** Operator-only, explicit import of an existing rhv9 JSON export. */
import {readFileSync,writeFileSync} from 'node:fs';
import {openDatabase,loadModel,importExisting} from './knowledge-server.mjs';
const [dbPath,exportPath,templatePath]=process.argv.slice(2);
if(!dbPath||!exportPath||!templatePath)throw Error('Usage: node backend/import-existing.mjs /secure/knowledge.sqlite /secure/existing-export.json /secure/principals-template.json');
const exported=JSON.parse(readFileSync(exportPath,'utf8')),db=openDatabase(dbPath),{model}=loadModel();
importExisting(db,exported,model,{includeVerifiedKnowledge:process.argv.includes('--include-verified-knowledge')});
const principals=Object.entries(exported.stamms).flatMap(([homeStammId,s])=>['rangers','leaders'].flatMap(kind=>s[kind].filter(p=>!p.archived&&p.active!==false).map(p=>({homeStammId,kind,id:p.id,tokenHash:'REPLACE_WITH_SHA256_OF_PERSONAL_RANDOM_TOKEN',expiresAt:'SET_EXPLICIT_EXPIRY'}))));
writeFileSync(templatePath,JSON.stringify(principals,null,2)+'\n',{mode:0o600,flag:'wx'});db.close();
process.stdout.write('Existing memberships imported without resetting knowledge. Credential template created; no user account or token generated.\n');
