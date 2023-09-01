const { MongoClient } = require('mongodb');

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';
const dbUrl = `mongodb://${host}:${port}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(dbUrl, { useUnifiedTopology: true });
    this.client.connect((err, client) => {
      if (err) {
        console.error('Error connecting to db:', err.message || err.toString());
        this.db = false;
      }
      this.db = client.db(database);
      this.usersCollection = this.db.collection('users');
      this.filesCollection = this.db.collection('files');
    });
  };

  isAlive() {
    return !!this.db;
  };

  async nbUsers() {
    return this.usersCollection.countDocuments();
  };

  async nbFiles() {
    return this.filesCollection.countDocuments();
  };
}

const dbClient = new DBClient();

module.exports = dbClient;
