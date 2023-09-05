import { MongoClient } from 'mongodb';

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';
const dbUrl = `mongodb://${host}:${port}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(dbUrl, { useUnifiedTopology: true });
    this.db = null;
    this.client.connect((err) => {
      if (err) {
        console.log(err.messeage);
      }
      console.log('Connected successfully to bd');
      this.db = this.client.db(database);
      this.usersCollection = this.db.collection('users');
      this.filesCollection = this.db.collection('files');
    });
  }

  isAlive() {
    return Boolean(this.db);
  }

  async nbUsers() {
    return this.usersCollection.countDocuments();
  }

  async nbFiles() {
    return this.filesCollection.countDocuments();
  }
}

const dbClient = new DBClient();

export default dbClient;
