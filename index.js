var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var requestify = require('requestify');

var apn = require('apn');

app.use(bodyParser.json());

app.post('/api/apn',function(req,res){

    // Set up apn with the APNs Auth Key

    let body = req.body;

    var apnProvider = new apn.Provider(body.config);

    var size = body.notifications.length;
    var count = 1;

    for (const noti of body.notifications){

        var n = new apn.Notification();

        n.topic = body.bundleId;

        n.expiry = noti.expiry;
        n.badge = noti.badge;
        n.priority = noti.priority;
        n.sound = noti.sound;
        n.alert = noti.alert;
        n.payload = {
            payload: noti.payload
        };

        apnProvider.send(n, noti.deviceToken).then(function(result) {

            console.log("response : ",JSON.stringify(result));

            if(count === size){
                return res.send();
            }

            count++;

        });
    }

});

app.post('/api/emitEvent',function(req,res){

    let body = req.body;
    var room = "all";

    if(body.room === "all"){
        io.emit(body.event,body.payload);
    }else{
        io.to(body.room).emit(body.event,body.payload);
        room = body.room;
    }

    console.log('Emitting Event '+body.event+" to room "+room);

    return res.send();

});

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});

io.on('connection',function(socket){

    socket.on('GET_POST_Data_To_Server',function (data) {

        let method = data.method;
        let url = data.url;

        if(method === 'POST'){
            requestify.post(url, data).then(function (response) {});
        }else{
            requestify.get(url,{
                params : data
            });
        }

        console.log(socket.id+' Posting Data To Server');
    });

    socket.on('join-room', function (data) {
        console.log(socket.id+' User Joining Room ',data.room);
        socket.join(data.room);
    });

    socket.on('disconnect',function(){
        console.log('one user disconnected '+socket.id);
    });

});

http.listen(4500,function(){
    console.log('server listening on port 4500');
});
