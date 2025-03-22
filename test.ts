import * as dotenv from 'dotenv';
dotenv.config();

console.log("hello world");
const QUICKNODE_RPC = JSON.stringify(process.env.QUICKNODE_RPC);
console.log(`QUICKNODE_RPC: ${QUICKNODE_RPC}`);