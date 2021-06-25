package main

// 외부모듈포함
import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

// 클래스정의
type SmartContract struct {
}

// 구조체정의
type Developer struct {
	ID                  string  `json:"id"`
	Avg                 float32 `json:"avg"`
	NumProject          int     `json:"nproject"`
	CurrentState        int     `json:"state"`
	CurrentProject      string  `json:"pname"`
	CurrentProjectScore int     `json:"pscore"`
}

const (
	REGISTERED int = iota
	JOINED
	FINISHED
)

// TODO: 1. 프로젝트 구조체 정의

// init 함수
func (s *SmartContract) Init(stub shim.ChaincodeStubInterface) peer.Response {
	// log
	fmt.Println("func init started")
	// cc instantiate, upgrade 기능을 초기화기능

	return shim.Success(nil)
}

// invoke 함수
func (s *SmartContract) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	fn, args := stub.GetFunctionAndParameters()

	if fn == "registerUser" {
		return s.registerUser(stub, args)
	} else if fn == "joinProject" {
		//return s.joinProject(stub, args)
	} else if fn == "recordScore" {
		return s.recordScore(stub, args)
	}

	return shim.Error("Not supported smartcontract function name")

}

// registerUser
func (s *SmartContract) registerUser(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	// args: id
	if len(args) != 1 {
		return shim.Error("regiterUser function needs a parameter")
	}

	// getState 해봐서 에러체크 -> ID가 있으면? error
	var dev = Developer{ID: args[0], Avg: 0., CurrentState: 0, NumProject: 0}
	devAsBytes, _ := json.Marshal(dev)
	stub.PutState(args[0], devAsBytes)

	return shim.Success([]byte("tx is submitted"))
}

// joinProject

// recordScore
func (s *SmartContract) recordScore(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	// args: id, projectname, score
	if len(args) != 3 {
		return shim.Error("recordScore function needs 3 parameters")
	}
	// getState 해봐서 에러체크 -> ID가 있으면? error
	devAsBytes, err := stub.GetState(args[0])
	if err != nil { // GetState 가 수행중 오류를 가져오면
		shim.Error("GetState function occurred a error")
	}
	if devAsBytes == nil { // id가 없는 아이디
		return shim.Error("ID is not registered")
	}
	var dev = Developer{}
	_ = json.Unmarshal(devAsBytes, &dev)
	dev.CurrentProject = args[1]
	dev.CurrentProjectScore, _ = strconv.Atoi(args[2])

	// 평균값 계산
	var newAvg float32

	newAvg = (dev.Avg*float32(dev.NumProject) + float32(dev.CurrentProjectScore)) / float32(dev.NumProject+1)

	dev.NumProject++
	dev.Avg = newAvg
	dev.CurrentState = 2 // FINISHED

	devAsBytes, _ = json.Marshal(dev)
	stub.PutState(args[0], devAsBytes)

	return shim.Success([]byte("tx is submitted"))
}

// registerRroject
// recordProject
// finalizeProject

// main 함수
func main() {
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Println("Error creating new Smart Contract: %s", err)
	}
}
