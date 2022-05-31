const mysql = require("./app");
const mqtt = require('mqtt');

/**mqtt  */

function mqttCon(beaconKodu){

const broker = 'mqtt://192.168.100.40:1883';

const options = {
    clientId: 'nodeClient',
    username: 'beacon',
    password: '12345q'
  }
  let kod = []
    if(beaconKodu == undefined){
        beaconListe()
    }else{
   
   kod=beaconKodu;
   console.log(kod)

   /**topic burada olacak */
    }

    let myTopic =["scan/sena","scan/XXL02"];

    let client = mqtt.connect(broker, options);
    client.subscribe(myTopic)


    client.on('message', (myTopic, paylaod) => {

        let device=JSON.parse(paylaod.toString())
        console.log(device.rssi);
        console.log(device.id.toString());
        console.log(device.distance);

  console.log(`topic`, myTopic)
 
  mysql.query("SELECT mac FROM tracker", (error, results, fields) => {
       
    if (error) {
         return console.error(error.message);
      }
    let dbTrackerListe = [];
    results.forEach((r, i) => {
        dbTrackerListe[i] =results[i].mac;
    });
    // console.log(dbTrackerListe)
    return mqttVeri(dbTrackerListe,device,myTopic);
   
})  })  }

mqttCon()

function mqttVeri(dbTrackerListe,device,myTopic){

    if(dbTrackerListe.find(dbVeri => dbVeri == device.id)){

        let mqttVeriDizi = []
        mqttVeriDizi.push(myTopic,device.rssi,device.distance,device.url, device.uuid)
        console.log("dizi indis sayısı: " + mqttVeriDizi.length)

        console.log("mqtt verileri: ",mqttVeriDizi)

    }
    else{
        console.log("db de yok")
    }
}
function beaconListe(){
    mysql.query("SELECT * FROM beacon", (error, results, fields) => {
        if (error) {
             return console.error(error.message);
          }
          let dbBeaconListe = [];
          let beaconKodu= []
        results.forEach((r, i) => {
      
            dbBeaconListe[i] = [results[i].kodu, results[i].metre,results[i].koordinat,results[i].tipi,results[i].konumAlani]
            if(results[i].kodu != undefined){
            beaconKodu[i]=results[i].kodu;
        }

 

        });
    //   console.log(dbBeaconListe)
    //   console.log(beaconKodu)
      return mqttCon(beaconKodu)
      
    })
}






