const mqtt = require('mqtt');
const mysql=require('mysql');

const baglantidb=mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: ''
});

baglantidb.connect(function(err)
{
    if(err)
        console.log('Veritabanına bağlanırken bir sorun oluştu'+err);
    else
        console.log('Veritabanina başarıyla bağlanıldı');
});

module.exports = baglantidb; 
