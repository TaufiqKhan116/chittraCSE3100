#include <Servo.h>  // Header for servo motor
#if defined(ESP32)
#include <WiFi.h>
#elif defined(ESP8266)
#include <ESP8266WiFi.h>
#endif
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h" // Provide the token generation process info.
#include "addons/RTDBHelper.h"  // Provide the RTDB payload printing info and other helper functions.

#define MAC_ADDRESS "40:F5:20:2D:CE:F6"
/* 1. Define the WiFi credentials */
#define WIFI_SSID "TP-Link_AD88"
#define WIFI_PASSWORD "87337778"
/* 2. Define the API Key */
#define API_KEY "AIzaSyBNc1hX8l6zT1or8SWzO_1rG6Hyv5b5wns"
/* 3. Define the RTDB URL */
#define DATABASE_URL "https://chittranodemcuprojectcse3100-default-rtdb.firebaseio.com/" //<databaseName>.firebaseio.com or <databaseName>.<region>.firebasedatabase.app
/* 4. Define the user Email and password that alreadey registerd or added in your project */
#define USER_EMAIL "khantaufiq2017@gmail.com"
#define USER_PASSWORD "read!inthenameofyourLord"

// Define Firebase Data object
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

Servo myservo;
bool oscFlag;
int pos = 0;

// Assigning listener to listen change in firebase db
void streamCallback(FirebaseStream data);
void streamTimeoutCallback(bool timeout);

void setup()
{

  Serial.begin(9600);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  Serial.printf("Firebase Client v%s\n\n", FIREBASE_CLIENT_VERSION);

  /* Assign the api key (required) */
  config.api_key = API_KEY;
  /* Assign the user sign in credentials */
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;
  /* Assign the RTDB URL (required) */
  config.database_url = DATABASE_URL;
  /* Assign the callback function for the long running token generation task */
  config.token_status_callback = tokenStatusCallback; //see addons/TokenHelper.h
  Firebase.begin(&config, &auth);
  //Comment or pass false value when WiFi reconnection will control by your code or third party library
  Firebase.reconnectWiFi(true);
  Firebase.setDoubleDigits(5);

  // stream
  Firebase.RTDB.setStreamCallback(&fbdo, streamCallback, streamTimeoutCallback);
  if (!Firebase.RTDB.beginStream(&fbdo, "/40:F5:20:2D:CE:F6/isOscillating")) {
    //Could not begin stream connection, then print out the error detail
    Serial.println(fbdo.errorReason());
  }

  // servo setup
  myservo.attach(5);  // Pin D1
  myservo.write(90);
  delay(2000);

  // Initializing Oscillation
  Serial.printf("Oscillating: %s\n", Firebase.RTDB.getBool(&fbdo, "/40:F5:20:2D:CE:F6/isOscillating", &oscFlag) ? oscFlag ? "true" : "false" : fbdo.errorReason().c_str());
}

void loop()
{
    if(oscFlag) {
      for(pos = 0; pos < 180; pos += 1) {
        myservo.write(pos);
      } 
      for(pos = 180; pos>=1; pos-=1) {                                
        myservo.write(pos);
      }
    }
}

void streamCallback(FirebaseStream data)
{

  //Print out all information

  Serial.println("Stream Data...");
  Serial.println(data.streamPath());
  Serial.println(data.dataPath());
  Serial.println(data.dataType());

  //Print out the value
  //Stream data can be many types which can be determined from function dataType

  if (data.dataTypeEnum() == fb_esp_rtdb_data_type_boolean) {
    if(!data.to<bool>()) {
      if(pos == 90) {
        oscFlag = data.to<bool>();
      } else if(pos < 90) {
        for(int i = pos; i == 90; i += 1) {
          myservo.write(i);
        }
        oscFlag = data.to<bool>(); 
      } else if(pos > 90) {
        for(int i = pos; i == 90; i-=1) {                                
          myservo.write(i);
        }
        oscFlag = data.to<bool>();
      }
      myservo.write(90);
    }
    else {
      oscFlag = data.to<bool>();
    }
    Serial.println(data.to<bool>()? "true" : "false");
  }
}

void streamTimeoutCallback(bool timeout)
{
  if(timeout){
    Serial.println("Stream timeout, resume streaming...");
  }  
}
