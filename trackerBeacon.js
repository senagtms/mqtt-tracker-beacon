const mysql = require("./app");
const mqtt = require('mqtt');

// mqtt filtreleme işlemleri
function mqttVeri(dbTrackerListe,device,dbBeaconListe){

var ortakdbmqtt;
let data = []
let ortakMac;

data=device.map((obj) => obj.address);   // databe ile mqtt mac adresleri uyuşuyor mu sorgusu
ortakdbmqtt = dbTrackerListe.filter(function(val) { 
    return data.indexOf(val) != -1;
  });

  if(ortakdbmqtt) {

     ortakMac = device.reduce((dict, data) => { // id lere göre ayırma
        if (!dict[data.address]) dict[data.address] = [];
        dict[data.address].push(data);
        return dict;
      }, {});
  

      function sortObj(ortakMac){ // distance sıralama
        return Object.entries(ortakMac) 
          .reduce((acc, [key, value]) => 
          (acc[key] = value.sort((a, b) => a.distance - b.distance), acc), {})
      }
      
      var result = sortObj(ortakMac);
      console.log(result);
      return trakerİzleme(result,dbBeaconListe)

    
    }

  else{
        console.log("db de yok")
    }
console.log(data)
    device= []; // diziyi boşalt
}
        
   
// veri tabanından beacon verileri listele

function beaconListe(){
    mysql.query("SELECT * FROM beacon ORDER BY metre ASC", (error, results, fields) => {
        if (error) {
             return console.error(error.message);
          }
          let dbBeaconListe = [];
          let dbbeaconKodu= []
          
        results.forEach((r, i) => {
      
            dbBeaconListe[i] = [results[i].kodu, results[i].metre,results[i].koordinat,results[i].tipi,results[i].konumAlani]
            dbbeaconKodu[i]=results[i].kodu;
        });
      return mqttCon(dbbeaconKodu,dbBeaconListe)
      
    })
}



/**mqtt Connection */

function mqttCon(dbbeaconKodu,dbBeaconListe){

const broker = 'mqtt://192.168.100.10:1883';

const options = {
    clientId: 'nodeClient',
    username: '',
    password: ''
  }


  let device = [];
  let myTopic;


    if(dbbeaconKodu == undefined){

        beaconListe()

    }
    else{
   
  
      myTopic = "devices";
      console.log("Beacon Kodlar: ",myTopic)
  
    let client = mqtt.connect(broker, options);
    client.subscribe(myTopic)


    client.on('message', (myTopic, paylaod) => {

        device.push(JSON.parse(paylaod.toString()));

        function push(props , device) { // topic device içine push edildi
            let lastIndex = device.length - 1;
            device[lastIndex] = Object.assign(props, device[lastIndex]);
          }
          push({
              esp: dbbeaconKodu
            }, device);

     console.log(device.topic)
     
  // tracker verileri databaseden çekildi
  mysql.query("SELECT mac FROM tracker", (error, results, fields) => {
       
    if (error) {
         return console.error(error.message);
      }
    let dbTrackerListe = [];
    results.forEach((r, i) => {
        dbTrackerListe[i] =results[i].mac;
    });
    // console.log(dbTrackerListe)
    return mqttVeri(dbTrackerListe,device,dbBeaconListe);
   
})  
  }) 
    }
      }

mqttCon() //


function trakerİzleme(ortakMac,dbBeaconListe){

/** konum hesaplama- **/
    var macDistance = Object.entries(ortakMac).reduce((acc, [key, value]) => 
    (acc[key] = value.map((a) => a.distance), acc), {})
    
    let distanceTopla, konum;
    size = 1;
    let i = 0;

    for (var prop in macDistance) {
    if (i < size) {
    
            distanceTopla= macDistance[prop][0] + macDistance[prop][1]
            console.log("distance toplam: ",distanceTopla) 

            konum= ((20/distanceTopla) * macDistance[prop][0])+dbBeaconListe[0][1]
            console.log("sonuc",konum) 
          
    }
    else if(macDistance[prop].length == 1){
        console.log("Tek distance: ", macDistance[prop][0]) 
        console.log("***************************")
    }
    else{
        console.log(console.log("tek elemanlı dizi bulunmamaktadır"))
    }
    i++;
   
    }

    /**tracker izleme verileri databaseden alındı */
    let dbIzleme = [];
    mysql.query("SELECT * FROM izlenme", (error, results, fields) => {
       
                if (error) {
                     return console.error(error.message);
                  }
             
                results.forEach((r, i) => {
                    dbIzleme =[results[i].mac, results[i].sonKonum,results[i].sonKoordinat,results[i].sonMetre];
                    return trakerİzlemedb(macDistance,konum,dbIzleme)
                });
            })
       
}

/* yeni tracker verileri işlemleri */
function trakerİzlemedb(macDistance,konum,dbIzleme){
   let ortakdizi = []
   let ortakOlmayan= []
            const mac = Object.keys(macDistance);

            console.log()
         
var result = mac.reduce(function (prev, value) {

  var isDuplicate = false;
  for (var i = 0; i < mac.length; i++) {
      if (value == dbIzleme[i]) {
          isDuplicate = true;
          mysql.query(`UPDATE izlenme SET sonKonum=?, sonKoordinat =?, sonMetre=? WHERE mac='${value}'`,["0","0",konum], (error, results, fields) => {
                                if (error) {
                                      return console.error(error.message);
                                    }
                                
                                    // console.log(results);
                                    console.log("update edildi")
                                  });
                        }
          break;}

  if (!isDuplicate) {
    mysql.query(`INSERT INTO izlenme (mac,sonKonum,sonKoordinat,sonMetre) VALUES ('${value}','0','0','${konum}')`, function (error,results) {
                  if (error) {
                   return console.error(error.message);
                  }
              // console.log(results);
              console.log("ekleme yapıldı")
  }
);}
  return prev;

}, []);

}


}
