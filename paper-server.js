// ExpressJS Setup
const express = require('express');
const app = express();
var bodyParser = require('body-parser');

// Hyperledger Bridge
const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const ccpPath = path.resolve(__dirname, '..', 'network' ,'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

// Constants
const PORT = 3000;
const HOST = '0.0.0.0';

// use static file
app.use(express.static(path.join(__dirname, 'views')));

// configure app to use body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// main page routing
app.get('/', (req, res)=>{
    res.sendFile(__dirname + '/index.html');
})

async function cc_call(fn_name, args){
    
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = new FileSystemWallet(walletPath);

    const userExists = await wallet.exists('user1');
    if (!userExists) {
        console.log('An identity for the user "user1" does not exist in the wallet');
        console.log('Run the registerUser.js application before retrying');
        return;
    }
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('papercontract');

    var result;
    
    if(fn_name == 'issue')
        result = await contract.submitTransaction('issue', args[0],args[1],args[2],args[3],args[4]);
    if(fn_name == 'buy')
        result = await contract.submitTransaction('buy', args); 
    if(fn_name == 'redeem')
        result = await contract.submitTransaction('redeem', args);   
    if(fn_name == 'getHistory')
        result = await contract.submitTransaction('getHistory', args);   
    else
        result = 'not supported function'

    return result;
}

// paper issue // 생성
app.post('/paper', async(req, res)=>{
    const issuer = req.body.issuer;
    const pid = req.body.pid;
    const idate = req.body.idate;
    const mdate = req.body.mdate;
    const fvalue = req.body.fvalue;

    result = cc_call('issue', [issuer, pid, idate, mdate, fvalue])

    const myobj = {result: "success"}
    res.status(200).json(myobj) 
})
// buy redeem
app.post('/paper/:pid', async (req,res)=>{
    const type = req.body.type;
    // type == 1 : buy
    // type == 2 : redeem
    if ( type == 1 )
    {
        const owner = req.body.owner;
        const price = req.body.price;
    }
    else {
        const owner = req.body.owner;
    }
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    console.log(`llet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    const userExists = await wallet.exists('user1');
    if (!userExists) {
        console.log('An identity for the user "user1" does not exist in the wallet');
        console.log('Run the registerUser.js application before retrying');
        return;
    }
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('papercontract');

    if (type == 1 ) {
        const result = await contract.evaluateTransaction('buy', pid, owner, price);
    }else{
        const result = await contract.evaluateTransaction('redeem', pid, owner);
    }
    const myobj = {result: "success"}
    res.status(200).json(myobj) 

});

// server start
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);