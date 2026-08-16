const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = "mongodb+srv://careertrack_admin:Piramanayagam%401508@careertrack.qzdslfa.mongodb.net/?appName=CareerTrack";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        await client.db("admin").command({ ping: 1 });

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        await client.close();
    }
}

run().catch(console.dir);