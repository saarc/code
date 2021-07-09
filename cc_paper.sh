#chaincode insall
docker exec cli peer chaincode install -n papercontract -v 0.9 -p github.com/papercontract
#chaincode instatiate
docker exec cli peer chaincode instantiate -n papercontract -v 0.9 -C mychannel -c '{"Args":[]}' -P 'OR ("Org1MSP.member", "Org2MSP.member","Org3MSP.member")'
sleep 3

#chaincode invoke b
docker exec cli peer chaincode invoke -n papercontract -C mychannel -c '{"Args":["issue","MagnetoCorp","00001","8,July,2021","31,Dec,2021","500"]}'
sleep 3

docker exec cli peer chaincode invoke -n papercontract -C mychannel -c '{"Args":["buy","00001","Digibank","490"]}'
sleep 3

docker exec cli peer chaincode invoke -n papercontract -C mychannel -c '{"Args":["redeem","00001"]}'
sleep 3

#chaincode query b
docker exec cli peer chaincode query -n papercontract -C mychannel -c '{"Args":["getHistory","00001"]}'

echo '-------------------------------------END-------------------------------------'
