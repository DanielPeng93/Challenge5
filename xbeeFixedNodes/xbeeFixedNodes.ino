/*
  This is part of the challenge 5 in EC544 at Boston University in Fall 2015 done by group 2
  consisting of the following members
  1) Gaurav Hirlekar
  2) Reeve Hicks
  3) Xin Peng
  4) Ye Liu
  5) Hao Wu


  This is an Arduino program on the set of Arduinos with xbee radios fixed in known locations and
  and pinging a moving robot with the coordinator xbee at regular intervals for RSSI based indoor positioning.

  This code uses the xbee-arduino library by Andrew Rapp (https://github.com/andrewrapp/xbee-arduino)
  for parsing and generating XBee API frames. The payload in the received data frames is of the structure
  [(Command byte) (Payload byte 1) (Payload byte 2) ...]
  where command byte can be
  0xB0 - Synchronize command
  0xB1 - Set sensing interval (this should be followed by null terminated string containing an integer set period in ms)




  MIT LICENSE
  Permission is hereby granted, free of charge, to any person obtaining a copy of this software
  and associated documentation files (the “Software”), to deal in the Software without restriction,
  including without limitation the rights to use, copy, modify, merge, publish, distribute,
  sublicense, and/or sell copies of the Software, and to permit persons to whom the Software
  is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or
  substantial portions of the Software.
*/

#include <XBee.h>
#include <SoftwareSerial.h>

XBee xbee = XBee();
SoftwareSerial xbeeSerial(2, 3);
ZBRxResponse rxResponse = ZBRxResponse();
ZBTxRequest txRequest = ZBTxRequest();
uint8_t dbCommand[] = {'D', 'B'};
AtCommandRequest atRequest = AtCommandRequest(dbCommand);
AtCommandResponse atResponse = AtCommandResponse();
uint8_t lastRssi;

const uint8_t OK = 0xB0,
              ERR = 0xB1,
              DISCOVERY = 0xB2,
              PING = 0xB3,
              SET_LOCATION = 0xB4;

double location[] = {0.00, 0.00};

void setup() {
  Serial.begin(57600);
  xbeeSerial.begin(57600);
  xbee.begin(xbeeSerial);   // This ensures that Xbee object manages serial input/ouput buffer through library functions
  delay(2000);
  xbee.send(atRequest);
}

void loop() {
  xbee.readPacket();
  if (xbee.getResponse().isAvailable() && xbee.getResponse().getApiId() == ZB_RX_RESPONSE) {
    xbee.getResponse().getZBRxResponse(rxResponse);
    txRequest.setAddress64(rxResponse.getRemoteAddress64());
    txRequest.setAddress16(rxResponse.getRemoteAddress16());
    switch (rxResponse.getData(0)) {
      case DISCOVERY: {
          char buf[64];
          String payloadStr = String(String(location[0], 2) + ',' + String(location[1], 2));
          payloadStr.toCharArray(buf, 64);
          txRequest.setPayload((uint8_t*)buf);
          txRequest.setPayloadLength(payloadStr.length());
          xbee.send(txRequest);
          Serial.println("Discovered");
          break;
      } case SET_LOCATION: {
          char token[] = ",";
          location[0] = atof(strtok((char*)rxResponse.getData(), token));
          location[1] = atof(strtok(NULL, token));
          txRequest.setPayload((uint8_t*)&OK);
          txRequest.setPayloadLength(1);
          xbee.send(txRequest);
          break;
      } case PING: {
          xbee.send(atRequest);
          xbee.readPacket(200);
          if (xbee.getResponse().isAvailable() && xbee.getResponse().getApiId() == AT_COMMAND_RESPONSE) {
            xbee.getResponse().getAtCommandResponse(atResponse);
            if (atResponse.isOk()) {
              txRequest.setPayload(atResponse.getValue());
              txRequest.setPayloadLength(1);
              xbee.send(txRequest);
            }
          }
        }
    }
  }
}
