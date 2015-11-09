/*
 * This is part of the challenge 5 in EC544 at Boston University in Fall 2015 done by group 2
 * consisting of the following members
 * 1) Gaurav Hirlekar
 * 2) Reeve Hicks
 * 3) Xin Peng
 * 4) Ye Liu
 * 5) Hao Wu
 *
 *
 * IMPORTANT: All XBees should be configured in API mode 2 (escaped mode) as the xbee-arduino library
 * requires this mode
 *
 *
 *
 *
 * MIT LICENSE
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the “Software”), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software
 * is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 */

// Loads required NPM modules and makes them available in scope
var xbee_api = require('xbee-api'),
    serialPort = require('serialport'),
    ml = require('machine_learning'),
    fs = require('fs');

// IMPORTANT: Use api_mode: 2 as the xbee-arduino library requires it
// Create the xbeeAPI object which handles parsing and generating of API frames
// C contains some Xbee constant bytes such as frame type, transmit/receive options, etc.

var data = fs.readFileSync('data.csv', 'utf8').split('\r\n').map(function(item) {
    return item.split(',');
});
var result = [];
for (var i = 0; i < 110; i++)
    for (var j = 0; j < 5; j++)
        result.push(i);

var knn = new ml.KNN({
    data: data,
    result: result
});
var dataVector = [];
var readingsCount = 0;

// console.log(knn.predict({
//     x: data[365],
//     k: 1
// }));
// console.log(getArrPosition('0013a20040a03e02'));
// console.log(getArrPosition('0013a20040c848a4'));
// console.log(getArrPosition('0013a20040c4556b'));
// console.log(getArrPosition('0013a2004079b2e6'));


var xbeeOptions = {
        api_mode: 2
    },
    C = xbee_api.constants,
    xbeeAPI = new xbee_api.XBeeAPI(xbeeOptions);

// Serial port options
// This program requires you to manually give it the port name in the command line arguments
// Giving the xbeeAPI.rawParser() to the serial port ensures that the xbeeAPI object handles the serial input/output buffer
var portName = process.argv[2],
    openImmediately = true,
    serialOptions = {
        baudrate: 57600,
        parser: xbeeAPI.rawParser()
    };


var OK = 0xB0,
    ERR = 0xB1,
    DISCOVER = 0xB2,
    PING = 0xB3,
    SET_LOCATION = 0xB4;

var deviceList = [];


// Create a serial port at the port name with the given serial options, open it immediately and call the callback function supplied
var Serial = new serialPort.SerialPort(portName, serialOptions, openImmediately, function() {
    console.log('Opened serial port');
    Serial.flush(function() {
        xbeeAPI.on('error', function(err) {
            console.log('ERROR: Xbee API Checksum mismatch');
        });

        Serial.write(buildApiFrame('000000000000ffff', DISCOVER));
        xbeeAPI.on('frame_object', handleIdResponses);

        setTimeout(function() {
            console.log(deviceList);
            Serial.flush();
            xbeeAPI.removeListener('frame_object', handleIdResponses);
            xbeeAPI.on('frame_object', handleDataResponses);
            setInterval(function() {
                deviceList.map(function(item) {
                    Serial.write(buildApiFrame(item.remote64, PING));
                });
            }, 1000);
        }, 1000);
    })
});

function handleIdResponses(frame) {
    if (frame.type === C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET) {
        deviceList.push({
            remote64: frame.remote64,
            remote16: frame.remote16,
            location: frame.data.toString().split(',').map(function(item) {
                return parseFloat(item);
            })
        });
    }
}

function handleDataResponses(frame) {
    if (frame.type === C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET) {
        // console.log(getArrPosition(frame.remote64) + '\t' + frame.data.readUInt8(0));
        dataVector[getArrPosition(frame.remote64)] = frame.data.readUInt8(0);
        readingsCount++;
        if (readingsCount >= 4) {
            readingsCount = 0;
            console.log(dataVector + '\t' + knn.predict({
                x: dataVector,
                k: 1
            }));
        }
    }
}
function getArrPosition(addr64) {
    if (addr64.match(/40c4556b/)) return 0;
    else if (addr64.match(/4079b2e6/)) return 1;
    else if (addr64.match(/40a03e02/)) return 2;
    else if (addr64.match(/40c848a4/)) return 3;
    else console.log('ERROR: Device address not found');
}

function buildApiFrame(addr64, cmd) {
    return xbeeAPI.buildFrame({
        type: C.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST,
        destination64: addr64,
        id: 0x00,
        data: [cmd]
    });
}
