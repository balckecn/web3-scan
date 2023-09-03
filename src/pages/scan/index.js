import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
const { Web3 } = require('web3');
const { timestampToTime } = require('../../utils/timeutils.js');

// 以太坊节点的地址（可以是国外的节点）
const ethereumNodeUrl = "https://cloudflare-eth.com";

const web3 = new Web3(ethereumNodeUrl);
var dict = new Map();
var addressContractMap = new Map();

// 展示列表
var showList = new Array();
var exisCon = new Set();

// -------------------------------

// 输入框和确认按钮组件
const TimerControl = ({ onIntervalChange }) => {
    const [intervalValue, setIntervalValue] = useState(15000); // 默认定时器间隔为5秒

    const handleConfirm = () => {
        onIntervalChange(intervalValue);
    };

    return (
        <div>
            <input
                type="number"
                value={intervalValue}
                onChange={(e) => setIntervalValue(e.target.value)}
            />
            <button onClick={handleConfirm}>确认</button>
        </div>
    );
};

const TableComponent = ({ interval, block }) => {
    const [data, setData] = useState([]);
    const [nowBlock, setNowBlock] = useState(3333);
    const columns = [
        {
            title: '合约地址',
            dataIndex: '合约地址',
            key: '合约地址',
        },
        {
            title: '创建者地址',
            dataIndex: '创建者地址',
            key: '创建者地址',
        },
        {
            title: '创建时间',
            dataIndex: '创建时间',
            key: '创建时间',
        },
    ];

    // Simulate fetching data from the database
    const fetchDataFromDatabase = () => {
        web3.eth.getBlockNumber().then((blockNumber) => {
            setNowBlock(Number(blockNumber));
            if (block >= blockNumber) {
                return;
            }
            block++;
            getCreateContractEvent(block, dict);
            //console.log(dict);
            // 打印dic中 isAddPool为 true的合约
            showList = [];
            for (let [key, value] of dict) {
                if (value.isAddPool) {
                    // 新建json
                    let json = {
                        "合约地址": key,
                        "创建者地址": value.creator,
                        "创建时间": value.createDate,
                    }

                    if (!exisCon.has(key)) {
                        showList.push(json);
                    }
                    console.log("合约地址: " + key + " 创建者地址：" + value.creator + " 创建时间：" + value.createDate);
                    dict.delete(key);
                }
            }
            if (showList.length == 0) {
                return;
            }
            setData(prevData => [...prevData, ...showList]);
        }).catch((error) => {
            console.log(error);
        });
    };

    // Fetch data initially and set up the timer
    useEffect(() => {
        fetchDataFromDatabase();

        const timer = setInterval(() => {
            fetchDataFromDatabase();
        }, interval); // Fetch data every 5 seconds

        return () => {
            clearInterval(timer); // Clean up the timer on unmount
        };
    }, [interval]);

    return (
        <div>
            <h1>当前区块: {nowBlock}</h1>
            <Table columns={columns} dataSource={data} />
        </div>
    );
};

const Scan = () => {
    const [block, setBlock] = useState(18045747); // 初始化 block 值为 0
    const [timerInterval, setTimerInterval] = useState(15000); // 初始定时器间隔为5秒

    const handleBlockChange = (e) => {
        setBlock(e.target.value); // 当输入框的值变化时更新 block 状态
    };
    return (
        <div>
            <input
                type="number"
                value={block}
                onChange={handleBlockChange}
                placeholder="输入 block 值"
            />
            <TimerControl onIntervalChange={setTimerInterval} />
            <TableComponent interval={timerInterval} block={block} />
        </div>
    );
};

export default Scan;
// -------------------------------


// 获取最新创建的合约，存储到map中
async function getCreateContractEvent(block, dict) {
    web3.eth.getBlock(block, true).then((block) => {
        const transactions = block.transactions;
        if (transactions == null) {
            return;
        }
        const date = timestampToTime(block.timestamp)
        for (let i = 0; i < transactions.length; i++) {
            const tx = transactions[i];
            if (tx.to != null) {
                checkDevTransferEvent(tx);
                getDevTransferEvent(tx);
                continue;
            }
            web3.eth.getTransactionReceipt(tx.hash).then((receipt) => {
                var info = {
                    "creator": receipt.from,
                    "createDate": date,
                    "txHash": receipt.transactionHash,
                    // dev是否有被发送scanner
                    "isSendScanner": false,
                    // 是否已经添加了池子
                    "isAddPool": false,
                };
                if (addressContractMap.has(receipt.contractAddress)) {
                    addressContractMap.get(receipt.contractAddress).push(receipt.transactionHash);
                } else {
                    let arr = [];
                    arr.push(receipt.contractAddress);
                    addressContractMap.set(receipt.from, arr);
                }
                dict.set(receipt.contractAddress, info);
            }).catch((error) => {
                console.log(error)
            });
        }
    });
}

// 检查交易，判断是否已经是添加了池子
async function getDevTransferEvent(tx) {
    if (tx.to == "0x7a250d5630b4cf539739df2c5dacb4c659f2488d" && (tx.input.includes("0xe8e33700") || tx.input.includes("0xf305d719"))) {
        web3.eth.getTransactionReceipt(tx.hash).then((receipt) => {
            let logs = receipt.logs;
            if (logs.length == 0) {
                return;
            }
            let conAdd = logs[0].address;
            if (dict.has(conAdd)) {
                dict.get(conAdd).isAddPool = true;
            }
        }).catch((error) => {
            console.log(error);
        });
    }
}


// 检查交易，判断dev是否被发scanner
async function checkDevTransferEvent(tx) {
    let scanner = new Set();
    scanner.add("0x0432b95B3C2BBE2c905B6e3cC0D2d2B0fF171837");
    scanner.add("0x7A01b95C2E232d250db9E106DCF317E29A1279ab");
    scanner.add("0x6f23173B74e8606f33aF9740745079d303D80004");
    if (!addressContractMap.has(tx.to) && !scanner.has(tx.from)) {
        return;
    }
    let arr = addressContractMap.get(tx.to);
    if (arr.length > 0) {
        for (let j = 0; j < arr.length; j++) {
            dict.delete(arr[j]);
        }
    }
}
