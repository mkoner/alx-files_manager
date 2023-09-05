import redisClient from './redis';

const userUtils = {
  async getUserIdAndKey(request) {
    console.log(request.headers)
    const obj = { userId: null, key: null };
    const xToken = request.header('X-Token');
    console.log('xtoken', xToken)
    if (!xToken) return obj;
    obj.key = `auth_${xToken}`;
    obj.userId = await redisClient.get(obj.key);
    console.log('obj11', obj);
    return obj;
  },
};

export default userUtils;
