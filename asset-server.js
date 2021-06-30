// 1 모듈포함 express body-parser
const express = require('express');
const app = express();
var bodyParser = require('body-parser');

// 2 서버, 패브릭 설정
const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const ccpPath = path.resolve(__dirname,'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);
// 서버속성
const PORT = 3000;
const HOST = '0.0.0.0';
// app.use
app.use(express.static(path.join(__dirname, 'views')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// 3 페이지 라우팅
app.get('/', (req, res)=>{
    res.sendFile(__dirname + '/views/index.html');
})

app.get('/create', (req, res)=>{
    res.sendFile(__dirname + '/views/create.html');
})

app.get('/query', (req, res)=>{
    res.sendFile(__dirname + '/views/query.html');
})

// 4 REST 라우팅 /asset  POST GET
// 4.1 자산 생성 라우팅 -> mychannel -> sacc -> set : key, value
app.post('/asset', async(req, res)=>{
    const assetkey = req.body.assetkey;
    const assetvalue = req.body.assetvalue;
    
    // user1 인증서 가져오기
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
    await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
    // 채널의 컴포넌트 가져오기
    const network = await gateway.getNetwork('mychannel');
    // 체인코드 컴포넌트 가져오기
    const contract = network.getContract('sacc');
    // 체인코드 기능 사용하기 - tx 제출
    await contract.submitTransaction('set', assetkey, assetvalue);
    console.log('Transaction has been submitted');
    await gateway.disconnect();

    res.status(200).send('Transaction has been submitted');

})
// 4.2 자산 조회 라우팅 -> mychannel -> sacc -> get : key 
app.get('/asset', async(req, res)=>{
    const assetkey = req.query.assetkey;
    
    // user1 인증서 가져오기
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
    await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
    // 채널의 컴포넌트 가져오기
    const network = await gateway.getNetwork('mychannel');
    // 체인코드 컴포넌트 가져오기
    const contract = network.getContract('sacc');
    // 체인코드 기능 사용하기 - tx 제출
    const result = await contract.evaluateTransaction('get', assetkey);
    console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

    await gateway.disconnect();

    // 체인코드의 반환값을 클라이언트에게 JSON형태로 응답
    var obj = JSON.parse(result);
    res.status(200).json(obj);

})
// 5 서버 시작
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
