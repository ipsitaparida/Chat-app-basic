var express = require('express')
var bodyParser = require('body-parser')
var app = express() //instance of express

// using socket
var http = require('http').Server(app) 
var io = require('socket.io')(http) 

var mongoose = require('mongoose')

//middleware
app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

// uncomment this if deprication warning
// mongoose.Promise = Promise

// mongoDB uri
var dbUrl = 'mongodb+srv://<db_user>:<db_pass>@<url mongodb.net?/<db_name>?retryWrites=true&w=majority'

var Message = mongoose.model('Message', {
    name: String,
    message: String
})

/* if not using DB
var messages = [{name: 'Tim', message: 'Hii'}]
*/

app.get('/messages', (req, res) => {
    // res.send(messages) // remove this as DB is used
    Message.find({}, (err, messages) =>{
        res.send(messages)
    })
})

app.post('/messages', (req, res) => {
    var msg = new Message(req.body)
    msg.save().then(()=> {
        // messages.push(req.body) // remove this as DB is used
        // nested callback. Messy
        Message.findOne({message: 'badword'}, (err, censor) => {
            if(censor) {
                console.log('censored word found', censor)
                Message.deleteOne({_id: censor.id}, (err) => {
                    console.log('removed censored message')
                })
            }
        })
        io.emit('syncmessage', req.body)
        res.sendStatus(200)
    }).catch((err) => {
        res.sendStatus(500)
        return console.error(err)
    })
})

io.on('connection', (socket) => {
    console.log("a user connected")
})

/*
// If socket is not needed
var server = app.listen(3000, () => {
    console.log('server is listening on port', server.address().port)
}) //start server to listen
*/

// save message to DB. Using mongoDB here
mongoose.connect(dbUrl,{ useNewUrlParser: true, useUnifiedTopology: true}, (err) => {
    console.log('mongo ds connection', err)
})
// use http server so that both socket and express are running
var server = http.listen(3000, () => {
    console.log('server is listening on port', server.address().port)
}) //start server to listen

