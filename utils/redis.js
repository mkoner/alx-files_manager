import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.isRedisClientConnected = true;
    this.client.on('error', (err) => {
      console.error('Redis client failed to connect:', err.message || err.toString());
      this.isRedisClientConnected = false;
    });
  }

  isAlive() {
    return this.isRedisClientConnected;
  }

  async get(key) {
    // return  this.client.get(key);
    return promisify(this.client.GET).bind(this.client)(key);
  }

  async set(key, value, duration) {
    // this.client.setex(key, duration, value);
    promisify(this.client.SETEX).bind(this.client)(key, duration, value);
  }

  async del(key) {
    // this.client.del(key);
    promisify(this.client.DEL).apply(this.client)(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
