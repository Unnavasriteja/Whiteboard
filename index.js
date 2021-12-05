const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 80;
const { MongoClient } = require("mongodb");

var uri = "mongodb+srv://newuser:new1234@cluster0.ojp2i.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

const client = new MongoClient(uri);

async function run() {
	try {
		await client.connect();
		const database = client.db('myFirstDatabase');
		const paint = database.collection('paint');
		// Query for a movie that has the title 'Back to the Future'
		const changeStream = paint.watch();
		

		app.use(express.static(__dirname + '/public'));

		async function onConnection(socket) {
			console.log('client connected');
			changeStream.on('change', next => {
				socket.emit('init', next);
			});
			const cursor = paint.find();
			if ((await cursor.count()) === 0) {
				console.log("No documents found!");
			}
			await cursor.sort({timestamp:1}).toArray((error, result) => {
				socket.emit('init', result);
				if (error) console.error(error);
			});


			await socket.on('paint', async (data) => {
				data.timestamp = new Date();
				//console.log(data)
				const result = await paint.insertOne(data);
				console.log(`${result.insertedCount} documents were inserted`);

				socket.broadcast.emit('paint', data);
			});

			await socket.on('clearall',async ()=>{
				await paint.drop();
				socket.broadcast.emit('paint',"clearit");
			})
		}

		io.on('connection', onConnection);

		http.listen(port, () => console.log('running on port ' + port));
	} finally {
	  // Ensures that the client will close when you finish/error
	}
  }
  run().catch(console.dir);