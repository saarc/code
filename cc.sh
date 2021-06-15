#!/bin/bash

cd ~/fabric-samples/basic-network
./start.sh

docker-compose -f docker-compose.yml up -d cli

docker exec cli peer chaincode install -n sacc -v v1.0 -p github.com/sacc

docker exec cli peer chaincode instantiate -n sacc -v v1.0 -C mychannel -c '{"Args":[]}' -P 'OR ("Org1MSP.member")'

sleep 3

docker exec cli peer chaincode invoke -n sacc -C mychannel -c '{"Args":["set","Soomin","100"]}'

sleep 3

docker exec cli peer chaincode invoke -n sacc -C mychannel -c '{"Args":["set","Sunwoong","1000"]}'

sleep 3

docker exec cli peer chaincode query -n sacc -C mychannel -c '{"Args":["get","Sunwoong"]}'

docker exec cli peer chaincode query -n sacc -C mychannel -c '{"Args":["get","Soomin"]}'


