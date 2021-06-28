// 모듈포함
const express = require('express');
const app = express();
var bodyParser = require('body-parser');
// 패브릭 연결설정
const {FileSystemWallet, Gateway} = require('fabric-network');
const fs = require('fs');
const path = require('path');
const ccpPath = path.resolve(__dirname,'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);
// 서버설정
const PORT= 3000;
const HOST='0.0.0.0';

app.use(express.static(path.join(__dirname, 'views')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// 인덱스라우팅
app.get('/', (req, res)=>{
    res.sendFile(__dirname + '/views/index.html');
})
// rest 라우팅
// url mate POST(type1-생성 type2-프로젝트점수추가)
app.post('/mate', async(req, res)=>{
    const id = req.body.id;

    // wallet 가져오기
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);
    const userExists = await wallet.exists('user1');
    if (!userExists) {
        console.log('An identity for the user "user1" does not exist in the wallet');
        console.log('Run the registerUser.js application before retrying');
        return;
    }
    // 게이트웨이에 연결하기
    const gateway = new Gateway();
    await gateway.connect(ccp, {wallet, identity:'user1', discovery:{enabled: false}});
    // 채널에 연결하기
    const network = await gateway.getNetwork('mychannel');
    // 체인코드 클래스 가져오기
    const contract = network.getContract('teamate');
    // submitTransaction
    const result = await contract.submitTransaction("registerUser",id)
    // 체인코드 수행결과를 클라이언트에 알려주기

    console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

    res.status(200).send(`{result:"success", msg:"TX has been submited."}`)
})
app.post('/score'), async(req,res)=>{
    const id = req.body.id;
    const pname = req.body.pname;
    const score = req.body.score;
}
// url mate POST(type1-조회 type2-이력조회)
app.get('/mate', async(req, res)=>{
    const id = req.query.id;
    const type = req.query.type;

        // wallet 가져오기
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        // 게이트웨이에 연결하기
        const gateway = new Gateway();
        await gateway.connect(ccp, {wallet, identity:'user1', discovery:{enabled: false}});
        // 채널에 연결하기
        const network = await gateway.getNetwork('mychannel');
        // 체인코드 클래스 가져오기
        const contract = network.getContract('teamate');
        // submitTransaction
        
        const result = await contract.evaluateTransaction("readUser",id)
        // 체인코드 수행결과를 클라이언트에 알려주기
    
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
    
        res.status(200).send(result)
})
// 서버시작
app.listen(PORT,HOST);
console.log(`Running on http://${HOST}:${PORT}`);