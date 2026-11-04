/* Temporary browser-test service. Never used by the shipped HTML. */
import {readFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {openDatabase,loadModel,importExisting,createKnowledgeService} from '../backend/knowledge-server.mjs';
const config=JSON.parse(readFileSync(process.argv[2],'utf8')),db=openDatabase(config.dbPath),{model}=loadModel();
importExisting(db,config.exported,model);
const service=createKnowledgeService({db,principals:config.principals,origin:config.origin});
const server=createServer(service.handler);server.listen(0,'127.0.0.1',()=>process.stdout.write(JSON.stringify({port:server.address().port})+'\n'));
process.on('SIGTERM',()=>server.close(()=>{db.close();process.exit(0);}));
