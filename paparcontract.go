/*
 * Copyright IBM Corp All Rights Reserved
 *
 * SPDX-License-Identifier: Apache-2.0
 */

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

// SimpleAsset implements a simple chaincode to manage an asset
type SimpleAsset struct {
}
type Data struct {
	Issuer   string `json:"issuer"`
	Paper string `json:"paper"`
	Mdate string `json:"mdate"`
	Idate string `json:"idate"`
	Fvalue string `json:"fvalue"`
	State string `json:"state"` // issued, trading, redeemed
	Owner string `json:"owner"`
}

// Init is called during chaincode instantiation to initialize any
// data. Note that chaincode upgrade also calls this function to reset
// or to migrate data.
func (t *SimpleAsset) Init(stub shim.ChaincodeStubInterface) peer.Response {

	return shim.Success(nil)
}

// Invoke is called per transaction on the chaincode. Each transaction is
// either a 'get' or a 'set' on the asset created by Init function. The Set
// method may create a new asset by specifying a new key-value pair.
func (t *SimpleAsset) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	// Extract the function and args from the transaction proposal
	fn, args := stub.GetFunctionAndParameters()

	var result string
	var err error
	if fn == "issue" {
		result, err = issue(stub, args)
	} else if fn == "buy" {
		result, err = buy(stub, args)
	} else if fn == "redeem" {
		result, err = redeem(stub, args)
	} else if fn == "getHistory" {
		result, err = getHistoryForKey(stub, args)
	} else {
		return shim.Error("Not supported chaincode function.")
	}

	if err != nil {
		return shim.Error(err.Error())
	}

	// Return the result as success payload
	return shim.Success([]byte(result))
}

// Set stores the asset (both key and value) on the ledger. If the key exists,
// it will override the value with the new one
func issue(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) != 5 {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key and a value")
	}
	// paperid 가 유효한지
	// issuer 가 유효한지
	// date가 유효한지

	// JSON  변환
	var data = Data{Issuer:args[0],Paper:args[1],Idate:args[2],Mdate:args[3],Fvalue:args[4],State:"issued",Owner:args[0]}
	dataAsBytes, _ := json.Marshal(data)

	err := stub.PutState(args[1], dataAsBytes)
	if err != nil {
		return "", fmt.Errorf("Failed to set asset: %s", args[0])
	}
	return string(dataAsBytes), nil
}

// Get returns the value of the specified asset key
func buy(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) != 3 {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key")
	}

	dataAsBytes, err := stub.GetState(args[0])
	if err != nil {
		return "", fmt.Errorf("Failed to get asset: %s with error: %s", args[0], err)
	}
	if dataAsBytes == nil {
		return "", fmt.Errorf("Asset not found: %s", args[0])
	}
	data := Data{}
	err = json.Unmarshal(dataAsBytes, &data)
	if err != nil {
		return "", fmt.Errorf("unmarshal error")
	}
	data.Owner = args[1]
	data.State = "trading"
	dataAsBytes, _ = json.Marshal(data)

	err = stub.PutState(args[0], dataAsBytes)
	if err != nil {
		return "", fmt.Errorf("Failed to set asset: %s", args[0])
	}

	return string(dataAsBytes), nil
}

// Get returns the value of the specified asset key
func redeem(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) != 1 {
		return "", fmt.Errorf("Incorrect arguments. Expecting a key")
	}

	dataAsBytes, err := stub.GetState(args[0])
	if err != nil {
		return "", fmt.Errorf("Failed to get asset: %s with error: %s", args[0], err)
	}
	if dataAsBytes == nil {
		return "", fmt.Errorf("Asset not found: %s", args[0])
	}
	data := Data{}
	err = json.Unmarshal(dataAsBytes, &data)
	if err != nil {
		return "", fmt.Errorf("unmarshal error")
	}
	data.Owner = data.Issuer
	data.State = "redeemed"
	dataAsBytes, _ = json.Marshal(data)

	err = stub.PutState(args[0], dataAsBytes)
	if err != nil {
		return "", fmt.Errorf("Failed to set asset: %s", args[0])
	}

	return string(dataAsBytes), nil
}

func getHistoryForKey(stub shim.ChaincodeStubInterface, args []string) (string, error) {

	if len(args) < 1 {
		return "", fmt.Errorf("Incorrect number of arguments. Expecting 1")
	}
	keyName := args[0]
	// 로그 남기기
	fmt.Println("getHistoryForKey:" + keyName)

	resultsIterator, err := stub.GetHistoryForKey(keyName)
	if err != nil {
		return "", err
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing historic values for the marble
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return "", err
		}
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"TxId\":")
		buffer.WriteString("\"")
		buffer.WriteString(response.TxId)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Value\":")
		if response.IsDelete {
			buffer.WriteString("null")
		} else {
			buffer.WriteString(string(response.Value))
		}

		buffer.WriteString(", \"Timestamp\":")
		buffer.WriteString("\"")
		buffer.WriteString(time.Unix(response.Timestamp.Seconds, int64(response.Timestamp.Nanos)).String())
		buffer.WriteString("\"")

		buffer.WriteString(", \"IsDelete\":")
		buffer.WriteString("\"")
		buffer.WriteString(strconv.FormatBool(response.IsDelete))
		buffer.WriteString("\"")

		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	// 로그 남기기
	fmt.Println("getHistoryForKey returning:\n" + buffer.String() + "\n")

	return (string)(buffer.Bytes()), nil
}

// main function starts up the chaincode in the container during instantiate
func main() {
	if err := shim.Start(new(SimpleAsset)); err != nil {
		fmt.Printf("Error starting SimpleAsset chaincode: %s", err)
	}
}
