import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';

import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import userUtils from '../utils/userUtils';

const sha1 = require('sha1');

class AuthController {
  static async getConnect(request, response) {
    const auth = request.headers.authorization;
    const credentials = auth.split(' ')[1];
    if (!credentials) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    const decoded = Buffer.from(credentials, 'base64').toString();
    const [email, rowPassword] = decoded.split(':');
    if (!rowPassword || !email) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    const password = sha1(rowPassword);
    const user = await dbClient.usersCollection.findOne({
      email,
      password,
    });
    if (!user) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 24 * 3600);
    return response.status(200).send({ token });
  }

  static async getDisconnect(request, response) {
    const { userId, key } = await userUtils.getUserIdAndKey(request);
    if (!userId) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    await redisClient.del(key);
    return response.status().send(204);
  }

  static async getMe(request, response) {
    const { userId } = await userUtils.getUserIdAndKey(request);
    if (!userId) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    const user = await dbClient.usersCollection.findOne({ _id: ObjectId(userId) });
    return response.status(200).send({
      id: user._id.toString(),
      email: user.email,
    });
  }
}

export default AuthController;
