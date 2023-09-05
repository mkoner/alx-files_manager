import dbClient from '../utils/db';

const sha1 = require('sha1');

class UsersController {
  static async postNew(resquest, response) {
    const { email, password } = resquest.body;
    const emailExists = dbClient.usersCollection.findOne({ email });
    if (!email) {
      return response.status(400).send({ error: 'Missing email' });
    }
    if (!password) {
      return response.status(400).send({ error: 'Missing password' });
    }
    if (emailExists) {
      return response.status(400).send({ error: 'Already exist' });
    }
    const newUser = {
      email,
      password: sha1(password),
    };
    const result = await dbClient.usersCollection.insertOne(newUser);

    return response.status(201).send({
      id: result.insertedId,
      email,
    });
  }
}

export default UsersController;
